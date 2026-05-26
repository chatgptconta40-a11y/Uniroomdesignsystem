import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://wsdxtflqoghexndbeetn.supabase.co';

export const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZHh0Zmxxb2doZXhuZGJlZXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNDQzOTksImV4cCI6MjA5MTkyMDM5OX0.6iS4yQWo6tv7k6UfYl9uzuHL2U_YbczGLw76y55LIDM';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});