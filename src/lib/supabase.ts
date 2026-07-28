import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let browserClient: ReturnType<typeof createClient> | null = null;

export function createServerSupabaseClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase server environment variables');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export function createBrowserSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('createBrowserSupabaseClient can only be used in the browser');
  }
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase browser environment variables');
  }
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
}
