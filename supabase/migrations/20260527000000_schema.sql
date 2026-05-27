-- ─── UniRoom · Schema base ────────────────────────────────────────────────
-- Tabelas core: profiles, perfis de estudante, properties, rooms, applications

-- Extensões
create extension if not exists "pgcrypto";

-- ─── Enums ────────────────────────────────────────────────────────────────
do $$ begin
  create type user_type as enum ('student','landlord','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type verification_level as enum ('none','bronze','silver','gold');
exception when duplicate_object then null; end $$;

do $$ begin
  create type trust_level as enum ('new','confirmed','trusted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type room_type as enum ('shared','private','studio','apartment');
exception when duplicate_object then null; end $$;

do $$ begin
  create type application_status as enum ('pending','accepted','rejected','withdrawn','expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type property_status as enum ('draft','active','paused','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type room_status as enum ('available','reserved','occupied','unavailable');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('pending','reviewing','resolved','dismissed');
exception when duplicate_object then null; end $$;

-- ─── profiles ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  type user_type not null default 'student',
  full_name text not null,
  email text not null,
  photo_url text,
  phone text,
  role text default 'user',
  onboarding_completed boolean not null default false,
  profile_completeness jsonb default '{"personal":0,"lifestyle":0,"preferences":0,"overall":0}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── personal_profiles ────────────────────────────────────────────────────
create table if not exists public.personal_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  age int check (age is null or (age between 16 and 99)),
  gender text check (gender in ('male','female','other','prefer_not_to_say') or gender is null),
  course text,
  institution text,
  year_of_study int check (year_of_study is null or (year_of_study between 1 and 8)),
  hometown text,
  bio text,
  languages text[] default '{}',
  updated_at timestamptz not null default now()
);

-- ─── lifestyle_profiles ───────────────────────────────────────────────────
create table if not exists public.lifestyle_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  bedtime text check (bedtime in ('early','moderate','late') or bedtime is null),
  wakeup_time text check (wakeup_time in ('early','moderate','late') or wakeup_time is null),
  schedule text check (schedule in ('morning','flexible','night') or schedule is null),
  cleanliness int check (cleanliness is null or (cleanliness between 1 and 5)),
  cleaning_frequency text check (cleaning_frequency in ('daily','weekly','monthly') or cleaning_frequency is null),
  noise_tolerance int check (noise_tolerance is null or (noise_tolerance between 1 and 5)),
  music_volume text check (music_volume in ('quiet','moderate','loud') or music_volume is null),
  guests_frequency text check (guests_frequency in ('never','rarely','sometimes','often') or guests_frequency is null),
  guests_acceptance int check (guests_acceptance is null or (guests_acceptance between 1 and 5)),
  smoking boolean,
  pets boolean,
  cooking text check (cooking in ('never','rarely','sometimes','often') or cooking is null),
  personality text check (personality in ('introvert','moderate','extrovert') or personality is null),
  social_preference text check (social_preference in ('quiet','moderate','social') or social_preference is null),
  updated_at timestamptz not null default now()
);

-- ─── accommodation_preferences ────────────────────────────────────────────
create table if not exists public.accommodation_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  max_budget numeric(10,2) check (max_budget is null or max_budget >= 0),
  preferred_cities text[] default '{}',
  max_distance_from_university numeric(6,2),
  move_in_date date,
  stay_duration int check (stay_duration is null or stay_duration > 0),
  room_type room_type,
  amenities jsonb default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ─── properties ───────────────────────────────────────────────────────────
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  address text not null,
  city text not null,
  zone text,
  distance_to_university numeric(6,2),
  coordinates jsonb,
  images text[] default '{}',
  amenities jsonb default '{}'::jsonb,
  house_rules jsonb default '{}'::jsonb,
  total_rooms int not null default 1,
  whole_property_available boolean default false,
  whole_property_price numeric(10,2),
  whole_property_utilities numeric(10,2),
  whole_property_minimum_stay int,
  status property_status not null default 'draft',
  verified boolean not null default false,
  views int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists properties_landlord_idx on public.properties(landlord_id);
create index if not exists properties_status_idx on public.properties(status);
create index if not exists properties_city_idx on public.properties(city);

-- ─── rooms ────────────────────────────────────────────────────────────────
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  title text not null,
  description text,
  images text[] default '{}',
  price numeric(10,2) not null check (price >= 0),
  utilities numeric(10,2) default 0,
  area numeric(6,2),
  private_bathroom boolean default false,
  balcony boolean default false,
  desk boolean default false,
  wardrobe boolean default false,
  furnished boolean default true,
  available_from date,
  minimum_stay int check (minimum_stay is null or minimum_stay > 0),
  status room_status not null default 'available',
  occupied_by uuid references public.profiles(id) on delete set null,
  reserved_by uuid references public.profiles(id) on delete set null,
  move_in_date date,
  compatibility_score int check (compatibility_score is null or (compatibility_score between 0 and 100)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists rooms_property_idx on public.rooms(property_id);
create index if not exists rooms_status_idx on public.rooms(status);

-- ─── applications ─────────────────────────────────────────────────────────
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status application_status not null default 'pending',
  move_in_date date,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, room_id)
);
create index if not exists applications_student_idx on public.applications(student_id);
create index if not exists applications_landlord_idx on public.applications(landlord_id);
create index if not exists applications_room_idx on public.applications(room_id);

-- ─── favorites ────────────────────────────────────────────────────────────
create table if not exists public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, room_id)
);
