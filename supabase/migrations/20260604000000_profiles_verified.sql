-- Add verified column to profiles (used by the app to show user verification badges).
alter table public.profiles
  add column if not exists verified boolean not null default false;
