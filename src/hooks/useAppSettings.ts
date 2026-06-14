import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const APP_SETTINGS_ID = 'global';

export interface AppSettings {
  platform_name: string;
  main_email: string;
  support_email: string;
  platform_version: string;
  auto_approve_properties: boolean;
  require_email_verification: boolean;
  detect_suspicious_listings: boolean;
  reports_before_auto_suspension: number;
  max_properties_per_landlord: number;
  max_applications_per_student: number;
  max_images_per_property: number;
  max_message_length: number;
  trust_bonus_verified: number;
  trust_bonus_complete_profile: number;
  trust_bonus_successful_application: number;
  trust_penalty_valid_report: number;
  notify_new_reports: boolean;
  notify_critical_reports: boolean;
  notify_new_properties: boolean;
  notify_new_users: boolean;
  notify_system_alerts: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  platform_name: 'UniRoom',
  main_email: 'admin@uniroom.pt',
  support_email: 'suporte@uniroom.pt',
  platform_version: '1.0.0',
  auto_approve_properties: false,
  require_email_verification: true,
  detect_suspicious_listings: true,
  reports_before_auto_suspension: 3,
  max_properties_per_landlord: 10,
  max_applications_per_student: 5,
  max_images_per_property: 10,
  max_message_length: 2000,
  trust_bonus_verified: 10,
  trust_bonus_complete_profile: 5,
  trust_bonus_successful_application: 3,
  trust_penalty_valid_report: 15,
  notify_new_reports: true,
  notify_critical_reports: true,
  notify_new_properties: false,
  notify_new_users: false,
  notify_system_alerts: true,
};

function mergeWithDefaults(data: unknown): AppSettings {
  const incoming = (data && typeof data === 'object') ? (data as Partial<AppSettings>) : {};
  return { ...DEFAULT_SETTINGS, ...incoming };
}

export function useAppSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('app_settings')
      .select('data')
      .eq('id', APP_SETTINGS_ID)
      .maybeSingle();
    if (err) {
      console.error('[useAppSettings] fetch error:', err.message);
      setError(err.message);
    } else {
      setError(null);
      setSettings(mergeWithDefaults(data?.data));
    }
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const save = useCallback(async (next: Partial<AppSettings>): Promise<boolean> => {
    setSaving(true);
    const merged: AppSettings = { ...settings, ...next };
    const payload = {
      id: APP_SETTINGS_ID,
      data: merged,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    };
    const { error: err } = await supabase
      .from('app_settings')
      .upsert(payload, { onConflict: 'id' });
    setSaving(false);
    if (err) {
      console.error('[useAppSettings] save error:', err.message);
      setError(err.message);
      return false;
    }
    setError(null);
    setSettings(merged);
    return true;
  }, [settings, user?.id]);

  return { settings, loading, saving, error, refresh, save };
}
