-- 003 — staff profiles for the first two accounts, plus helper functions.
--
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
--
-- BEFORE YOU RUN IT: replace the four placeholders below (the two emails
-- and the two full names) with the real ones. The real emails are kept
-- out of the repo on purpose: this repo is on GitHub and they are
-- personal addresses. Do not commit the filled-in version.
--
-- Prerequisite: create both users first in Supabase ->
-- Authentication -> Users -> Add user (tick "Auto Confirm User").

-- 1. Helper: "what role does the signed-in user have, if they are active?"
--
-- Returns 'manager' or 'employee' for an active staff member, and NULL for
-- everyone else: signed-out visitors, unknown users, and deactivated staff
-- (is_active = false). Policies on later tables call this, so a deactivated
-- person is refused everywhere even if their password still works.
--
-- It is SECURITY DEFINER, meaning it runs with the table owner's rights.
-- That lets it read profiles without being blocked by the profiles policies
-- (which would otherwise send a policy on profiles into an endless loop).
-- It can only ever answer about the CURRENT user (auth.uid()).
create or replace function public.current_staff_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.profiles
  where id = (select auth.uid())
    and is_active
$$;

-- "Is the signed-in user active staff at all?"
create or replace function public.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_staff_role() is not null
$$;

-- Functions are callable by everyone unless you say otherwise.
-- Only signed-in users may call these two.
revoke all on function public.current_staff_role() from public, anon;
revoke all on function public.is_active_staff() from public, anon;
grant execute on function public.current_staff_role() to authenticated;
grant execute on function public.is_active_staff() to authenticated;

-- 2. The first two profiles.
--
-- The login (email + password) lives in Supabase Auth. A profile adds the
-- name and the role. We look each user up by email to get their id.
-- "on conflict" makes it safe to run twice.
insert into public.profiles (id, full_name, role)
select id, 'MANAGER FULL NAME', 'manager'
from auth.users
where email = 'MANAGER_EMAIL'
on conflict (id) do update
  set full_name = excluded.full_name,
      role      = excluded.role,
      is_active = true;

insert into public.profiles (id, full_name, role)
select id, 'EMPLOYEE FULL NAME', 'employee'
from auth.users
where email = 'EMPLOYEE_EMAIL'
on conflict (id) do update
  set full_name = excluded.full_name,
      role      = excluded.role,
      is_active = true;

-- 3. Check it worked: this should list exactly two rows.
-- If it lists none, an email above does not match the user you created.
select p.full_name, p.role, p.is_active, u.email
from public.profiles p
join auth.users u on u.id = p.id
order by p.role;

-- To switch a staff member off later (they can no longer use the app):
--   update public.profiles set is_active = false where id = '<their id>';
