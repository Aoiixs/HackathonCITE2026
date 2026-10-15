-- 002 — profiles: one row per staff member (employee or manager).
--
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
--
-- A profile is the extra information about a signed-in user: their name,
-- their role, and whether they may still sign in. The login itself
-- (email and password) lives in Supabase Auth, in auth.users.

create table if not exists profiles (
  id         uuid        primary key references auth.users (id),
  full_name  text        not null,
  role       text        not null check (role in ('employee', 'manager')),
  is_active  boolean     not null default true,
  created_at timestamptz not null default now()
);

-- Row Level Security: ON, so nobody can touch this table unless a policy
-- below says they may. Without it, anyone on the internet could read
-- every staff member's name and role.
alter table profiles enable row level security;

-- A signed-in user may read ONLY their own profile.
-- Signed-out visitors have no policy, so they can read nothing.
create policy "users can read their own profile"
  on profiles for select
  to authenticated
  using ((select auth.uid()) = id);

-- Deliberately NO insert, update or delete policy. Nobody can add,
-- change or remove profiles through the app. The team adds them with SQL
-- in the dashboard (ticket 03), which is allowed to bypass these rules.
-- The manager's policy to read all profiles comes in a later ticket.
