import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// Use a placeholder key for build time to prevent errors
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-for-build-time'

// Check if we have a service role key
if (!serviceRoleKey && typeof window === 'undefined') {
  console.warn('No SUPABASE_SERVICE_ROLE_KEY found. Admin functions may not work properly.');
}

// Create a Supabase client for browser usage with anon key
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'supabase.auth.token',
  }
})

// Create a Supabase client with service role for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
})

// Check that supabaseAdmin is working correctly
if (typeof window !== 'undefined') {
  console.log('Supabase clients initialized');
}

export type Subscriber = {
  id: string
  email: string
  subscribed_at?: string
}

export type User = {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
}

export type Article = {
  id: string
  title: string
  slug: string
  excerpt?: string
  summary?: string
  content: string
  status?: 'draft' | 'submitted' | 'published' | 'rejected'
  published?: boolean
  featured?: boolean
  author_id: string
  cover_image?: string
  featured_image?: string
  series_id?: string
  seo_title?: string
  seo_description?: string
  created_at: string
  updated_at: string
  published_at?: string
  sanity_id?: string
} 