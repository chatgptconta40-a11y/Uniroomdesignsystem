import { createClient } from '@supabase/supabase-js';
import { projectId as infoProjectId, publicAnonKey as infoAnonKey } from '../../utils/supabase/info';

export const projectId = infoProjectId;
export const supabaseUrl = `https://${projectId}.supabase.co`;

export let supabaseAnonKey = infoAnonKey;
export let publicAnonKey = infoAnonKey;

export const supabase = createClient(supabaseUrl, infoAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const isSupabaseConfigured = true;
