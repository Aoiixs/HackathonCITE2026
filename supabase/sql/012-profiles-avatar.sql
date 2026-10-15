-- 012 — a profile picture for each staff member.
--
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Run it BEFORE 013. Safe to run more than once.
--
-- avatar_url is optional text: a path like /avatars/avatar-1.svg (a picture
-- in this project's public/avatars folder) or a full web address. Empty
-- (null) means "show the person's initials instead".
--
-- No new policy is needed: 002 already lets people read their own profile
-- and 009 lets managers read all of them, and both cover every column.
-- Nobody can change a profile through the app, so avatar_url is set here,
-- in SQL, for now.

alter table public.profiles
  add column if not exists avatar_url text;
