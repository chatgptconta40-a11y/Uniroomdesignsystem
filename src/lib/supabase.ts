import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const projectId = "wgkromwdktxibnamjdwr";
export const supabaseUrl = `https://${projectId}.supabase.co`;

const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indna3JvbXdka3R4aWJuYW1qZHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5Mjg1MTUsImV4cCI6MjA5NjUwNDUxNX0' +
  '.2YNdERUXHprJAa_zXeKaWjWMZgCjPE2iXLS_Sl4h37c';

export let supabaseAnonKey = ANON_KEY;
export let publicAnonKey = ANON_KEY;

// Singleton: reuse the existing client across Vite HMR re-evaluations so
// GoTrueClient doesn't warn about multiple instances in the same tab.
const _win = typeof window !== 'undefined' ? window as Window & { __uniroom_supabase__?: SupabaseClient } : null;

export const supabase: SupabaseClient = _win?.__uniroom_supabase__ ?? (() => {
  const client = createClient(supabaseUrl, ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  if (_win) _win.__uniroom_supabase__ = client;
  return client;
})();

export const isSupabaseConfigured = true;
