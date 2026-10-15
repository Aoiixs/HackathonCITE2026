-- 010 — sales_report(): exact totals for the History & reports cards.
--
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It needs 002 to 006 to have been run first.
--
-- Why: the cards used to add up sales inside the app after downloading
-- them, but Supabase's API hands back at most 1,000 rows per request. In a
-- busy month the totals would quietly come out short. Adding up inside
-- the database has no such limit, so the numbers are exact however many
-- sales there are.
--
-- SECURITY INVOKER (the opposite of the SECURITY DEFINER functions before
-- it) means the function runs with the RIGHTS OF WHOEVER CALLS IT, so Row
-- Level Security still applies: a manager's report adds up everyone's
-- sales, and an employee's adds up only their own. The function cannot
-- show anyone anything they could not already read.
--
-- p_from is included and p_to is excluded: pass the start of the first day
-- and the start of the day AFTER the last day.
--
-- Returns:
--   { "total": 1234.50, "orders": 12,
--     "daily": [ { "date": "2026-10-01", "total": 450.00 }, ... ],
--     "top":   [ { "name": "Iced Coffee", "quantity": 31 }, ... ] }   (best four)
-- Voided sales are never counted.

create or replace function public.sales_report(
  p_from timestamptz,
  p_to   timestamptz
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with s as (
    select id, total_amount, created_at
    from public.sales
    where status = 'completed'
      and created_at >= p_from
      and created_at <  p_to
  ),
  daily as (
    -- Group by the shop's calendar day (Manila), not the server's (UTC).
    select (created_at at time zone 'Asia/Manila')::date as day,
           sum(total_amount)                              as total
    from s
    group by 1
  ),
  top as (
    -- Group by product id, so a renamed product still counts as one item,
    -- and show the name it had on the newest sale.
    select (array_agg(si.product_name order by s.created_at desc))[1] as name,
           sum(si.quantity)::integer                                  as quantity
    from public.sale_items si
    join s on s.id = si.sale_id
    group by si.product_id
    order by sum(si.quantity) desc, 1
    limit 4
  )
  select jsonb_build_object(
    'total',  coalesce((select sum(total_amount) from s), 0),
    'orders', (select count(*) from s),
    'daily',  coalesce(
                (select jsonb_agg(jsonb_build_object('date', day, 'total', total)
                                  order by day) from daily),
                '[]'::jsonb),
    'top',    coalesce(
                (select jsonb_agg(jsonb_build_object('name', name, 'quantity', quantity)
                                  order by quantity desc, name) from top),
                '[]'::jsonb)
  )
$$;

revoke all on function public.sales_report(timestamptz, timestamptz)
  from public, anon;
grant execute on function public.sales_report(timestamptz, timestamptz)
  to authenticated;
