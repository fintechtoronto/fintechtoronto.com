import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  // Create a response object
  const res = NextResponse.next();

  // Get the pathname of the request
  const pathname = request.nextUrl.pathname;

  // Skip middleware for API and next internal routes
  if (pathname.startsWith('/_next') || pathname.includes('api')) {
    return res;
  }

  // Skip middleware for test-auth page which is used to debug auth issues
  if (pathname === '/test-auth') {
    console.log('Skipping middleware for test auth page');
    return res;
  }

  console.log('Middleware executing for path:', pathname);
  
  // Only run auth check for protected routes
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/dashboard')) {
    return res;
  }

  // Fix for direct navigation to /dashboard/new-article and other nested routes
  // Allow the request to proceed and let client-side auth handle it
  if (pathname.startsWith('/dashboard/') && pathname !== '/dashboard') {
    console.log('Allowing access to subpath of dashboard:', pathname);
    return res;
  }

  // Create a Supabase client using cookies
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  // Create a new Supabase client for server-side authentication
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
      autoRefreshToken: false,
    }
  });

  // Get project reference for cookie name
  const projectRef = supabaseUrl.match(/(?:http[s]?:\/\/)?([^.]*)\.supabase\.co/)?.[1] || '';
  
  // Check cookie names based on common patterns
  const cookieNames = [
    'sb-access-token',
    'sb-refresh-token',
    'sb:access:token',
    'sb:refresh:token',
    `sb-${projectRef}-auth-token`,
  ];
  
  console.log('Checking cookies:', request.cookies.getAll().map(c => c.name));
  
  // Look for JWT in headers (higher priority)
  const authHeader = request.headers.get('authorization');
  let authToken = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    authToken = authHeader.split(' ')[1];
    console.log('Found authorization header');
  }
  
  // If no auth header, try cookies
  if (!authToken) {
    for (const name of cookieNames) {
      const cookie = request.cookies.get(name);
      if (cookie?.value) {
        console.log('Found auth cookie:', name);
        
        // For combined tokens in JSON format
        if (name.includes('-auth-token')) {
          try {
            const parsed = JSON.parse(decodeURIComponent(cookie.value));
            if (parsed.access_token) {
              authToken = parsed.access_token;
              break;
            }
          } catch (e) {
            console.error('Error parsing auth cookie:', e);
          }
        } else if (name.includes('access')) {
          authToken = cookie.value;
          break;
        }
      }
    }
  }

  // Check if we have auth token
  let user = null;
  
  try {
    if (authToken) {
      console.log('Found auth token, attempting to get user');
      
      // Get the user with the token
      const { data, error } = await supabase.auth.getUser(authToken);
      
      if (!error && data.user) {
        console.log('User authenticated:', data.user.id);
        user = data.user;
      } else if (error) {
        console.error('Error in middleware auth:', error.message);
      }
    } else {
      console.log('No auth token found in request');
    }
  } catch (error) {
    console.error('Unexpected error in middleware auth:', error);
  }

  // Handle authentication for protected routes - no longer redirecting for /dashboard/
  // This is to allow client-side code to handle auth for deeply nested routes
  if (!user) {
    // Only redirect for the main dashboard and admin routes
    if (pathname === '/dashboard' || pathname.startsWith('/admin')) {
      console.log('No authenticated user found, redirecting to login');
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    // For subpaths, allow the request to proceed
    console.log('No authenticated user found, but allowing access to be checked client-side');
    return res;
  }

  // For admin routes, check if user has admin role
  if (pathname.startsWith('/admin')) {
    // Fetch user's profile to check admin status
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        // Profile fetch error, redirect to dashboard
        console.log('Error fetching user profile:', profileError);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      
      const userRole = profile.role || 'user';
      
      // For simplicity, first check if user has at least moderator role
      const adminRoles = ['superadmin', 'admin', 'moderator'];
      if (!adminRoles.includes(userRole)) {
        console.log('User does not have admin-level role');
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      
      // For more specific routes, check permissions based on route
      if (pathname !== '/admin') {
        // Define route permission requirements
        const routePermissions: Record<string, string[]> = {
          '/admin/users': ['manage_users'],
          '/admin/requests': ['manage_roles'],
          '/admin/submissions': ['approve_articles'],
          '/admin/series': ['manage_series'],
          '/admin/tags': ['manage_tags'],
          '/admin/settings': ['manage_system']
        };
        
        // If this is a protected route with specific permissions
        if (routePermissions[pathname]) {
          // Get role's permissions 
          const { data: roleData, error: roleError } = await supabase
            .from('roles')
            .select('rank')
            .eq('id', userRole)
            .single();
            
          if (roleError) {
            console.error('Error fetching role data:', roleError);
            return NextResponse.redirect(new URL('/admin', request.url));
          }
          
          // Superadmin (rank 100) has access to everything
          if (roleData.rank === 100) {
            console.log('Superadmin access granted for all routes');
          } else {
            // Check specific permissions
            const { data: permissions, error: permError } = await supabase
              .from('role_permissions')
              .select('permission_id')
              .eq('role_id', userRole);
              
            if (permError) {
              console.error('Error fetching permissions:', permError);
              return NextResponse.redirect(new URL('/admin', request.url));
            }
            
            const userPermissions = permissions?.map(p => p.permission_id) || [];
            const requiredPerms = routePermissions[pathname];
            const hasPermission = requiredPerms.some(perm => userPermissions.includes(perm));
            
            if (!hasPermission) {
              console.log(`User does not have required permissions for ${pathname}`);
              return NextResponse.redirect(new URL('/admin', request.url));
            }
          }
        }
      }
      
      console.log('Admin access granted for:', user.id);
    } catch (error) {
      console.error('Error checking admin status:', error);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return res;
}

// Match only the paths that should be protected
export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
  ],
}; 