-- ─── UniRoom · Admin: audit logs + app settings ───────────────────────────
-- Suporta FASE ADMIN 1 (admin_audit_logs) e FASE ADMIN 7 (app_settings)
-- do plano de migração Admin → Supabase 100%.

-- ─── helper: is_admin() ───────────────────────────────────────────────────
drop function if exists public.is_admin(uuid);

create or replace function public.is_admin(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.profiles p
     where p.id = check_user_id
       and p.type = 'admin'
  );
$$;

-- ─── admin_audit_logs ─────────────────────────────────────────────────────
create table if not exists public.admin_audit_logs (
  id            text primary key,
  admin_id      uuid not null references public.profiles(id) on delete cascade,
  action        text not null,
  entity_type   text not null,
  entity_id     text,
  entity_label  text,
  note          text,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_idx on public.admin_audit_logs(created_at desc);
create index if not exists admin_audit_logs_admin_idx   on public.admin_audit_logs(admin_id);
create index if not exists admin_audit_logs_entity_idx  on public.admin_audit_logs(entity_type, entity_id);
create index if not exists admin_audit_logs_action_idx  on public.admin_audit_logs(action);

alter table public.admin_audit_logs enable row level security;

drop policy if exists admin_audit_logs_select on public.admin_audit_logs;
create policy admin_audit_logs_select
  on public.admin_audit_logs
  for select
  using (public.is_admin(auth.uid()));

drop policy if exists admin_audit_logs_insert on public.admin_audit_logs;
create policy admin_audit_logs_insert
  on public.admin_audit_logs
  for insert
  with check (public.is_admin(auth.uid()) and admin_id = auth.uid());

-- Realtime
alter publication supabase_realtime add table public.admin_audit_logs;

-- ─── app_settings ─────────────────────────────────────────────────────────
-- Singleton row (id = 'global'). Não usar localStorage; ler/escrever aqui.
create table if not exists public.app_settings (
  id   text primary key default 'global',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

alter table public.app_settings enable row level security;

drop policy if exists app_settings_select on public.app_settings;
create policy app_settings_select
  on public.app_settings
  for select
  using (true);

drop policy if exists app_settings_insert on public.app_settings;
create policy app_settings_insert
  on public.app_settings
  for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists app_settings_update on public.app_settings;
create policy app_settings_update
  on public.app_settings
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Seed singleton com defaults (vazio). AdminSettings preenche no primeiro save.
insert into public.app_settings (id, data)
values ('global', '{}'::jsonb)
on conflict (id) do nothing;

-- Realtime
alter publication supabase_realtime add table public.app_settings;

-- ─── profiles · colunas para suspensão/bloqueio (FASE ADMIN 3) ────────────
-- AdminReports passa a usar profiles em vez de mockAdminUsersState.
alter table public.profiles
  add column if not exists status text not null default 'active'
    check (status in ('active','suspended'));

alter table public.profiles
  add column if not exists blocked_from_publishing boolean not null default false;

alter table public.profiles
  add column if not exists admin_reason text;

-- ─── properties · colunas para suspensão admin (FASE ADMIN 5) ─────────────
alter table public.properties
  add column if not exists admin_suspended boolean not null default false;

alter table public.properties
  add column if not exists admin_suspension_reason text;
