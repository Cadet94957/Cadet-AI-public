import { createClient } from '@supabase/supabase-js'

// Handle environment variables for both server and client
const isServer = typeof window === 'undefined'
const supabaseUrl = isServer ? process.env.SUPABASE_URL : import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = isServer ? process.env.SUPABASE_ANON_KEY : import.meta.env.VITE_SUPABASE_ANON_KEY

// Use placeholder values if credentials are missing (for development with test users)
// This prevents "Failed to fetch" errors while still allowing the app to run
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co'
const finalKey = supabaseAnonKey || 'placeholder-anon-key'

const client = createClient(finalUrl, finalKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: false,  // Disable auto-refresh to prevent unnecessary requests
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
})

// Wrap all auth methods to silently catch fetch errors when Supabase is not configured
const originalAuth = client.auth
client.auth = {
  ...originalAuth,
  getSession: () => originalAuth.getSession().catch(() => ({ data: { session: null }, error: null })),
  onAuthStateChange: (...args) => {
    try {
      return originalAuth.onAuthStateChange(...args)
    } catch {
      return { data: { subscription: { unsubscribe: () => {} } } }
    }
  }
} as typeof originalAuth

export const supabase = client