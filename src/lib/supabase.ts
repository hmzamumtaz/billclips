import { createClient } from '@supabase/supabase-js';
import { getEnv } from './env';

export function createServerSupabaseClient() {
  const env = getEnv();
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
}

export function createBrowserSupabaseClient() {
  const env = getEnv();
  return createClient(env.supabaseUrl, env.supabaseAnonKey);
}
