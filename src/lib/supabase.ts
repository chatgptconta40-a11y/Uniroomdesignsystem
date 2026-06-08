import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://wgkromwdktxibnamjdwr.supabase.co';

export const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indna3JvbXdka3R4aWJuYW1qZHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5Mjg1MTUsImV4cCI6MjA5NjUwNDUxNX0.2YNdERUXHprJAa_zXeKaWjWMZgCjPE2iXLS_Sl4h37c';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});