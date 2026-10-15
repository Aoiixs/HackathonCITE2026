-- 008 — record_stock_in() and record_stock_out().
--
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It needs 002 to 007 to have been run first.
--
-- Same idea as adjust_stock() (007): stock only changes through database
-- functions, each one saves the new number AND its history record in one
-- all-or-nothing step, and each re-checks the low-stock alert.
--
-- Both are for managers only for now.
--
-- Each returns a small JSON answer, so the app can say "Rice meal now has
-- 25" and, for stock out, warn when the product dropped below its minimum:
--   { "product_name": "...", "new_stock": 25, "minimum_stock": 5 }

-- 1. record_stock_in(): a delivery arrived -----------------------------

create or replace function public.record_stock_in(
  p_product_id    uuid,
  p_quantity      integer,
  p_movement_date date,
  p_note          text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Asia/Manila')::date;  -- the shop's calendar day
  v_name  text;
  v_new   integer;
  v_min   integer;
begin
  if (select public.current_staff_role()) is distinct from 'manager' then
    raise exception 'Only an active manager can record stock in'
      using errcode = '42501';
  end if;

  if p_quantity is null or p_quantity < 1 or p_quantity > 1000000 then
    raise exception 'Quantity must be a whole number of 1 or more'
      using errcode = '22023';
  end if;

  p_movement_date := coalesce(p_movement_date, v_today);
  if p_movement_date > v_today then
    raise exception 'The date cannot be in the future' using errcode = '22023';
  end if;

  p_note := nullif(btrim(coalesce(p_note, '')), '');
  if length(p_note) > 500 then
    raise exception 'Keep the note under 500 characters' using errcode = '22023';
  end if;

  -- The update takes a lock on the row, so a sale at the same moment waits
  -- its turn instead of overwriting this change.
  update public.products
    set current_stock = current_stock + p_quantity
    where id = p_product_id and is_active
    returning name, current_stock, minimum_stock into v_name, v_new, v_min;

  if not found then
    raise exception 'That product was not found' using errcode = '22023';
  end if;

  insert into public.inventory_movements
    (product_id, employee_id, movement_type, quantity_change, remaining_stock,
     note, movement_date)
  values
    (p_product_id, (select auth.uid()), 'stock_in', p_quantity, v_new,
     p_note, p_movement_date);

  perform public.recheck_low_stock(p_product_id);

  return jsonb_build_object(
    'product_name', v_name, 'new_stock', v_new, 'minimum_stock', v_min
  );
end
$$;

-- 2. record_stock_out(): stock lost to spoilage, damage or own use ------

create or replace function public.record_stock_out(
  p_product_id    uuid,
  p_quantity      integer,
  p_reason        text,
  p_movement_date date,
  p_note          text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today   date := (now() at time zone 'Asia/Manila')::date;
  v_name    text;
  v_current integer;
  v_new     integer;
  v_min     integer;
begin
  if (select public.current_staff_role()) is distinct from 'manager' then
    raise exception 'Only an active manager can record stock out'
      using errcode = '42501';
  end if;

  if p_quantity is null or p_quantity < 1 or p_quantity > 1000000 then
    raise exception 'Quantity must be a whole number of 1 or more'
      using errcode = '22023';
  end if;

  if p_reason is null or p_reason not in ('spoiled', 'damaged', 'used') then
    raise exception 'Choose a reason' using errcode = '22023';
  end if;

  p_movement_date := coalesce(p_movement_date, v_today);
  if p_movement_date > v_today then
    raise exception 'The date cannot be in the future' using errcode = '22023';
  end if;

  p_note := nullif(btrim(coalesce(p_note, '')), '');
  if length(p_note) > 500 then
    raise exception 'Keep the note under 500 characters' using errcode = '22023';
  end if;

  -- Lock the row first, then compare, so the stock cannot change between
  -- checking it and lowering it.
  select name, current_stock, minimum_stock
    into v_name, v_current, v_min
    from public.products
    where id = p_product_id and is_active
    for update;

  if not found then
    raise exception 'That product was not found' using errcode = '22023';
  end if;

  -- NX001 is the same "not enough stock" code complete_sale() uses.
  if p_quantity > v_current then
    raise exception 'Only % in stock', v_current
      using errcode = 'NX001', detail = p_product_id::text;
  end if;

  v_new := v_current - p_quantity;

  update public.products set current_stock = v_new where id = p_product_id;

  insert into public.inventory_movements
    (product_id, employee_id, movement_type, quantity_change, remaining_stock,
     reason, note, movement_date)
  values
    (p_product_id, (select auth.uid()), 'stock_out', -p_quantity, v_new,
     p_reason, p_note, p_movement_date);

  perform public.recheck_low_stock(p_product_id);

  return jsonb_build_object(
    'product_name', v_name, 'new_stock', v_new, 'minimum_stock', v_min
  );
end
$$;

-- 3. Who may call them: signed-in users only (the functions check the role).

revoke all on function public.record_stock_in(uuid, integer, date, text)
  from public, anon;
revoke all on function public.record_stock_out(uuid, integer, text, date, text)
  from public, anon;
grant execute on function public.record_stock_in(uuid, integer, date, text)
  to authenticated;
grant execute on function public.record_stock_out(uuid, integer, text, date, text)
  to authenticated;
