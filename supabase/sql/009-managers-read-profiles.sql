-- 009 — managers may read every staff profile.
--
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It needs 002 and 003 to have been run first.
--
-- Why: the History & reports screen shows WHO made each sale and each
-- stock change. The only profiles policy so far ("users can read their own
-- profile", from 002) lets a manager see their own name and nobody else's,
-- so every other staff member would show up blank.
--
-- Policies on the same table and action are OR-ed together: a row is
-- readable if ANY policy allows it. So this adds to the old one instead of
-- replacing it, and an employee still reads only their own profile.
--
-- It goes through current_staff_role() (from 003), so a deactivated
-- manager gets nothing.

drop policy if exists "managers can read all profiles" on public.profiles;

create policy "managers can read all profiles"
  on public.profiles for select
  to authenticated
  using ((select public.current_staff_role()) = 'manager');

-- Reading only: there is still no insert, update or delete policy or
-- privilege on profiles. Staff are added and switched off with SQL in the
-- dashboard (ticket 03).
