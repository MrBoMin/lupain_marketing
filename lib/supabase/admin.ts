import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl } from './config'

// Admin client using service role key - bypasses RLS
// Only use this for admin operations after verifying user is admin
export function createAdminClient() {
  const supabaseUrl = getSupabaseUrl()
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
