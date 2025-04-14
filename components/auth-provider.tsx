'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{
    error: Error | null
    data: any | null
  }>
  signUp: (email: string, password: string, fullName: string) => Promise<{
    error: Error | null
    data: any | null
  }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({ error: null, data: null }),
  signUp: async () => ({ error: null, data: null }),
  signOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Make sure we're using the right persistence mode
  useEffect(() => {
    // Check if we need to set the persistence
    const setupPersistence = async () => {
      try {
        console.log('Setting up auth persistence...');
        // Set persistence to default to localStorage where available
        const { data: { session } } = await supabase.auth.getSession();
        
        // Update persistence if needed
        if (typeof window !== 'undefined') {
          // Force persistence to localStorage
          localStorage.setItem('supabase.auth.token', JSON.stringify({
            access_token: session?.access_token || '',
            refresh_token: session?.refresh_token || '',
          }));
          
          // Also try to set session through the API
          if (session?.access_token) {
            const { data, error } = await supabase.auth.setSession({
              access_token: session.access_token,
              refresh_token: session.refresh_token || '',
            });
            
            if (error) {
              console.error('Error setting persistence mode:', error);
            } else {
              console.log('Auth persistence mode updated');
            }
          }
        }
      } catch (e) {
        console.error('Error setting up auth persistence:', e);
      }
    };
    
    setupPersistence();
  }, []);

  useEffect(() => {
    // Check active session
    const getSession = async () => {
      console.log('AuthProvider: Checking active session')
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('AuthProvider: Session fetch error:', error)
        } else {
          console.log('AuthProvider: Session found?', !!session)
          if (session?.user) {
            console.log('AuthProvider: User authenticated:', session.user.id)
          }
        }
        
        setUser(session?.user || null)
        setLoading(false)
      } catch (e) {
        console.error('AuthProvider: Unexpected error in getSession:', e)
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthProvider: Auth state changed -', event)
      if (session?.user) {
        console.log('AuthProvider: User authenticated on state change:', session.user.id)
      } else {
        console.log('AuthProvider: No user after auth state change')
      }
      
      setUser(session?.user || null)
      setLoading(false)
      
      console.log('AuthProvider: Refreshing router...')
      router.refresh()
    })

    return () => {
      console.log('AuthProvider: Unsubscribing from auth events')
      subscription.unsubscribe()
    }
  }, [router])

  const signIn = async (email: string, password: string) => {
    console.log('AuthProvider: Attempting sign in for:', email)
    try {
      // First clear any existing session
      await supabase.auth.signOut();
      
      // Then perform sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('AuthProvider: Sign in error:', error)
        return { data, error }
      } 
      
      console.log('AuthProvider: Sign in successful', data.user?.id)
      
      // Store the session manually to ensure it persists
      if (data.session) {
        try {
          // Store in localStorage for backup
          localStorage.setItem('supabase.auth.token', JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }));
          
          console.log('AuthProvider: Session stored in localStorage');
          
          // Update user state before returning
          setUser(data.user)
          
          // Set cookie manually
          document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=3600; SameSite=Lax`;
          document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=3600; SameSite=Lax`;
          
          // Ensure session is properly saved before returning
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        } catch (e) {
          console.error('AuthProvider: Error storing session:', e);
        }
      }
      
      return { data, error }
    } catch (e) {
      console.error('AuthProvider: Unexpected error during sign in:', e)
      return { data: null, error: e as Error }
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    console.log('AuthProvider: Attempting sign up for:', email)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        console.error('AuthProvider: Sign up error:', error)
        return { data, error }
      }
      
      console.log('AuthProvider: Sign up successful', data.user?.id)

      // Create profile in the database if sign up is successful
      if (data.user) {
        console.log('AuthProvider: Creating user profile')
        try {
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            created_at: new Date().toISOString(),
          })
          
          if (profileError) {
            console.error('AuthProvider: Profile creation error:', profileError)
          } else {
            console.log('AuthProvider: Profile created successfully')
          }
        } catch (e) {
          console.error('AuthProvider: Unexpected error creating profile:', e)
        }
      }

      return { data, error }
    } catch (e) {
      console.error('AuthProvider: Unexpected error during sign up:', e)
      return { data: null, error: e as Error }
    }
  }

  const signOut = async () => {
    console.log('AuthProvider: Signing out')
    try {
      await supabase.auth.signOut()
      
      // Clear localStorage and cookies
      localStorage.removeItem('supabase.auth.token');
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      console.log('AuthProvider: Sign out successful, redirecting to home')
      
      // Force reload to reset everything
      window.location.href = '/';
    } catch (e) {
      console.error('AuthProvider: Error during sign out:', e)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
} 