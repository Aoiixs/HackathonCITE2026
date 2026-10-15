-- 013 — give your existing accounts one of the sample avatars.
--
-- Run this in the Supabase dashboard AFTER 012.
--
-- BEFORE YOU RUN IT: replace the two placeholders below with the real
-- emails of the accounts you made in 003. Keep the real emails out of the
-- repo: paste them into the SQL Editor only, never save them in this file.
-- Pictures available: /avatars/avatar-1.svg, avatar-2.svg, avatar-3.svg.

update public.profiles p
set avatar_url = '/avatars/avatar-1.svg'
from auth.users u
where u.id = p.id and u.email = 'MANAGER_EMAIL';

update public.profiles p
set avatar_url = '/avatars/avatar-2.svg'
from auth.users u
where u.id = p.id and u.email = 'EMPLOYEE_EMAIL';

-- Check: each person should show their picture.
select u.email, p.full_name, p.role, p.avatar_url
from public.profiles p
join auth.users u on u.id = p.id;
