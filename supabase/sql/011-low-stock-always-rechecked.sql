-- 011 — Low-stock alerts can no longer drift from the real stock numbers.
--
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It needs 006 to have been run first. Safe to run more than once.
--
-- THE BUG: alerts were only created by the app's own database functions
-- (a sale, stock-in, stock-out, adjustment, or adding a product through the
-- app). A product whose stock was set any other way (demo data, a manual
-- edit in the Supabase table editor, or a new product starting below its
-- minimum) got no alert, so the alert count said 1 while two products were
-- below minimum.
--
-- THE FIX: a trigger is a rule the database runs by itself. This one runs
-- the re-check from 006 whenever a product is inserted or its stock or
-- minimum changes, however that happened.

create or replace function public.recheck_after_product_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.recheck_low_stock(new.id);
  return new;
end
$$;

revoke all on function public.recheck_after_product_change()
  from public, anon, authenticated;

drop trigger if exists products_recheck_after_insert on public.products;
create trigger products_recheck_after_insert
  after insert on public.products
  for each row
  execute function public.recheck_after_product_change();

drop trigger if exists products_recheck_after_stock_change on public.products;
create trigger products_recheck_after_stock_change
  after update of current_stock, minimum_stock on public.products
  for each row
  when (
    old.current_stock is distinct from new.current_stock
    or old.minimum_stock is distinct from new.minimum_stock
  )
  execute function public.recheck_after_product_change();

-- Catch up: give every product that is below its minimum right now its
-- alert (this is what fixes Spaghetti and Sting today).
do $$
declare
  v_id uuid;
begin
  for v_id in select id from public.products where is_active loop
    perform public.recheck_low_stock(v_id);
  end loop;
end
$$;
