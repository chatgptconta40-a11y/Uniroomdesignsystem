alter table public.profiles
  add column if not exists onboarding_draft jsonb;
