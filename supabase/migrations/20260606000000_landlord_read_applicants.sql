-- Allow a landlord to read profile, lifestyle, preferences, trust_scores
-- and verification_status of students who have applied to one of their
-- properties/rooms.
--
-- Access is scoped to the applications table: a landlord can only read
-- a student's row when there is an application row where
--   applications.landlord_id = auth.uid()
-- and
--   applications.user_id     = <student row>.user_id

-- Helper expression used by every policy below.
-- (Inlined per policy because Postgres does not have policy macros.)

-- ── profiles ─────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_landlord_read_applicants on public.profiles;
create policy profiles_landlord_read_applicants on public.profiles
  for select using (
    exists (
      select 1
      from public.applications a
      where a.landlord_id = auth.uid()
        and a.user_id = profiles.id
    )
  );

-- ── personal_profiles ────────────────────────────────────────────────────────
alter table public.personal_profiles enable row level security;

drop policy if exists personal_profiles_self on public.personal_profiles;
create policy personal_profiles_self on public.personal_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists personal_profiles_landlord_read on public.personal_profiles;
create policy personal_profiles_landlord_read on public.personal_profiles
  for select using (
    exists (
      select 1
      from public.applications a
      where a.landlord_id = auth.uid()
        and a.user_id = personal_profiles.user_id
    )
  );

-- ── lifestyle_profiles ───────────────────────────────────────────────────────
alter table public.lifestyle_profiles enable row level security;

drop policy if exists lifestyle_profiles_self on public.lifestyle_profiles;
create policy lifestyle_profiles_self on public.lifestyle_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists lifestyle_profiles_landlord_read on public.lifestyle_profiles;
create policy lifestyle_profiles_landlord_read on public.lifestyle_profiles
  for select using (
    exists (
      select 1
      from public.applications a
      where a.landlord_id = auth.uid()
        and a.user_id = lifestyle_profiles.user_id
    )
  );

-- ── accommodation_preferences ────────────────────────────────────────────────
alter table public.accommodation_preferences enable row level security;

drop policy if exists accommodation_preferences_self on public.accommodation_preferences;
create policy accommodation_preferences_self on public.accommodation_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists accommodation_preferences_landlord_read on public.accommodation_preferences;
create policy accommodation_preferences_landlord_read on public.accommodation_preferences
  for select using (
    exists (
      select 1
      from public.applications a
      where a.landlord_id = auth.uid()
        and a.user_id = accommodation_preferences.user_id
    )
  );

-- ── trust_scores ─────────────────────────────────────────────────────────────
alter table public.trust_scores enable row level security;

drop policy if exists trust_scores_self on public.trust_scores;
create policy trust_scores_self on public.trust_scores
  for select using (auth.uid() = user_id);

drop policy if exists trust_scores_landlord_read on public.trust_scores;
create policy trust_scores_landlord_read on public.trust_scores
  for select using (
    exists (
      select 1
      from public.applications a
      where a.landlord_id = auth.uid()
        and a.user_id = trust_scores.user_id
    )
  );

-- ── verification_status ──────────────────────────────────────────────────────
alter table public.verification_status enable row level security;

drop policy if exists verification_status_self on public.verification_status;
create policy verification_status_self on public.verification_status
  for select using (auth.uid() = user_id);

drop policy if exists verification_status_landlord_read on public.verification_status;
create policy verification_status_landlord_read on public.verification_status
  for select using (
    exists (
      select 1
      from public.applications a
      where a.landlord_id = auth.uid()
        and a.user_id = verification_status.user_id
    )
  );
