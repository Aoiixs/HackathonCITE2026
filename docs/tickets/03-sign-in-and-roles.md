# 03 — Sign in, roles, and the dashboard shell

**What to build:** Staff sign in with email and password and land on a Dashboard that shows who they are and what role they have. The manager sees a sidebar menu; the employee does not. Signed-out visitors see nothing but the Sign in screen.

**Blocked by:** 02

**Status:** todo

- [ ] A numbered SQL file in `supabase/sql/` adds the first manager and an employee `profiles` row for accounts the team creates in the Supabase dashboard
- [ ] Sign in with the right email and password goes to the Dashboard
- [ ] A wrong password shows "Invalid credentials" and stays on the form
- [ ] A staff member with `is_active = false` cannot sign in
- [ ] The top bar shows full name and role, and Log out asks for confirmation, then returns to Sign in
- [ ] The manager sees a sidebar menu; the employee does not
- [ ] Any other page, opened while signed out, goes to Sign in
- [ ] Works on the live URL, signed in as both a manager and an employee
