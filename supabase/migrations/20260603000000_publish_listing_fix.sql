-- ─── UniRoom · Fix publicação de propriedades e quartos ────────────────────
-- Estende o schema base para corresponder ao payload enviado pelo cliente
-- (PropertiesContext.propertyToDb / roomToDb) e adiciona políticas RLS para
-- que o landlord autenticado possa criar e atualizar os seus anúncios.

-- ─── rooms · colunas em falta ─────────────────────────────────────────────
alter table public.rooms
  add column if not exists landlord_id uuid references public.profiles(id) on delete cascade;

alter table public.rooms
  add column if not exists room_number text;

alter table public.rooms
  add column if not exists room_type room_type not null default 'private';

alter table public.rooms
  add column if not exists max_occupants int not null default 1 check (max_occupants > 0);

alter table public.rooms
  add column if not exists air_conditioning boolean not null default false;

alter table public.rooms
  add column if not exists views int not null default 0;

alter table public.rooms
  add column if not exists size numeric(6,2);

create index if not exists rooms_landlord_idx on public.rooms(landlord_id);

-- Backfill landlord_id a partir da property
update public.rooms r
   set landlord_id = p.landlord_id
  from public.properties p
 where r.property_id = p.id
   and r.landlord_id is null;

-- ─── room_status enum · valores em falta ─────────────────────────────────
-- O cliente usa 'draft' (rascunho) e 'paused' (pausado pelo senhorio).
alter type room_status add value if not exists 'draft';
alter type room_status add value if not exists 'paused';

-- ─── properties · colunas de moderação ───────────────────────────────────
alter table public.properties
  add column if not exists admin_suspended boolean not null default false;

alter table public.properties
  add column if not exists admin_suspension_reason text;

alter table public.properties
  add column if not exists admin_suspended_at timestamptz;

alter table public.properties
  add column if not exists admin_suspended_by text;

-- ─── RLS · properties ────────────────────────────────────────────────────
alter table public.properties enable row level security;

drop policy if exists properties_select_public on public.properties;
create policy properties_select_public
  on public.properties
  for select
  using (true);

drop policy if exists properties_insert_own on public.properties;
create policy properties_insert_own
  on public.properties
  for insert
  with check (landlord_id = auth.uid());

drop policy if exists properties_update_own on public.properties;
create policy properties_update_own
  on public.properties
  for update
  using (landlord_id = auth.uid())
  with check (landlord_id = auth.uid());

drop policy if exists properties_delete_own on public.properties;
create policy properties_delete_own
  on public.properties
  for delete
  using (landlord_id = auth.uid());

-- ─── RLS · rooms ─────────────────────────────────────────────────────────
alter table public.rooms enable row level security;

drop policy if exists rooms_select_public on public.rooms;
create policy rooms_select_public
  on public.rooms
  for select
  using (true);

drop policy if exists rooms_insert_own on public.rooms;
create policy rooms_insert_own
  on public.rooms
  for insert
  with check (landlord_id = auth.uid());

drop policy if exists rooms_update_own on public.rooms;
create policy rooms_update_own
  on public.rooms
  for update
  using (landlord_id = auth.uid())
  with check (landlord_id = auth.uid());

drop policy if exists rooms_delete_own on public.rooms;
create policy rooms_delete_own
  on public.rooms
  for delete
  using (landlord_id = auth.uid());
