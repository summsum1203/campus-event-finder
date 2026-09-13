-- Campus Event Finder schema

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null default 'General',
  location text,
  event_date timestamptz not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create index if not exists events_event_date_idx on public.events(event_date);
create index if not exists events_category_idx on public.events(category);
create index if not exists events_created_by_idx on public.events(created_by);
create index if not exists bookmarks_user_id_idx on public.bookmarks(user_id);

create index if not exists events_search_idx
  on public.events using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(location, '') || ' ' || coalesce(category, '')));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at
  before update on public.events
  for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.bookmarks enable row level security;

-- Profiles: users can see and edit their own profile.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Events: public read, authenticated users create, owners/admins modify.
drop policy if exists "events_public_read" on public.events;
create policy "events_public_read"
  on public.events for select
  using (true);

drop policy if exists "events_insert_authenticated" on public.events;
create policy "events_insert_authenticated"
  on public.events for insert
  to authenticated
  with check (auth.uid() = created_by);

drop policy if exists "events_update_owner_or_admin" on public.events;
create policy "events_update_owner_or_admin"
  on public.events for update
  to authenticated
  using (auth.uid() = created_by or auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  with check (auth.uid() = created_by or auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "events_delete_owner_or_admin" on public.events;
create policy "events_delete_owner_or_admin"
  on public.events for delete
  to authenticated
  using (auth.uid() = created_by or auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Bookmarks: only owner can read/write.
drop policy if exists "bookmarks_select_own" on public.bookmarks;
create policy "bookmarks_select_own"
  on public.bookmarks for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "bookmarks_insert_own" on public.bookmarks;
create policy "bookmarks_insert_own"
  on public.bookmarks for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "bookmarks_delete_own" on public.bookmarks;
create policy "bookmarks_delete_own"
  on public.bookmarks for delete
  to authenticated
  using (auth.uid() = user_id);
