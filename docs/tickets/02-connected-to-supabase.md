# 02 — Connected to Supabase

**What to build:** The live app talks to the team's hosted Supabase project. One real table, the staff `profiles` table, exists with Row Level Security on, and a small "connected" check on the page proves the connection works and that a signed-out visitor can read nothing.

**Blocked by:** 01

**Status:** todo

- [ ] The two Supabase environment variables are set locally and in Vercel, and the live site was redeployed after adding them
- [ ] The `profiles` table exists as in the spec, created from a numbered file in `supabase/sql/`
- [ ] Row Level Security is on for `profiles`, with a policy that lets a signed-in user read only their own profile
- [ ] Sign-ups are switched off in Supabase
- [ ] No `service_role` or `sb_secret_` key appears anywhere in the project, and `.env.local` is not committed
- [ ] The page shows "Connected", and shows that a signed-out visitor sees no profile rows
- [ ] Works on the live URL
