-- NOTE: the complete_sale() in this file is SUPERSEDED by the version in
-- 015-complete-sale-employees-only.sql (the only change is that sales are
-- now limited to employees). The create_product() in this file is still the
-- live one.

-- 006 — low_stock_alerts, the "re-check" rule, and the functions that use it.
--
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It needs 002 to 005 to have been run first.
--
-- This file also REPLACES create_product() and complete_sale() from 004 and
-- 005 with versions that re-check alerts. That is safe to run: the old
-- versions are simply overwritten, and their permissions are kept.

-- 1. low_stock_alerts -------------------------------------------------

create table if not exists public.low_stock_alerts (
  id            uuid        primary key default gen_random_uuid(),
  product_id    uuid        not null references public.products (id),
  current_stock integer     not null,   -- a snapshot, from when the alert was created
  minimum_stock integer     not null,   -- likewise
  status        text        not null default 'open'
    check (status in ('open', 'flagged', 'resolved')),
  flagged_by    uuid        references public.profiles (id),
  resolved_by   uuid        references public.profiles (id),
  resolved_at   timestamptz,
  created_at    timestamptz not null default now()
);

-- At most ONE live alert per product. A "partial" unique index only counts
-- rows that match its condition, so any number of resolved alerts can
-- pile up for a product, but never two open or flagged ones.
create unique index if not exists low_stock_alerts_one_live_per_product
  on public.low_stock_alerts (product_id)
  where status in ('open', 'flagged');

-- 2. Row Level Security -----------------------------------------------

alter table public.low_stock_alerts enable row level security;

-- Layer 1: privileges. Reading only. Nobody changes alerts directly:
-- the functions below do it, so "flagged_by" always means the real person.
revoke all on public.low_stock_alerts from anon, authenticated;
grant select on public.low_stock_alerts to authenticated;

-- Layer 2: policies. Managers see every alert. Employees see only the live
-- ones (open or flagged). Both must still be active staff.
create policy "managers read all alerts, employees the live ones"
  on public.low_stock_alerts for select
  to authenticated
  using (
    (select public.current_staff_role()) = 'manager'
    or (
      (select public.is_active_staff())
      and status in ('open', 'flagged')
    )
  );

-- 3. The re-check rule ------------------------------------------------
--
-- "Look at this product. Is its stock below its minimum?"
--   yes -> make sure ONE live alert exists (do nothing if there already is)
--   no  -> close any live alert, because the product is fine again
--
-- Every function that changes stock calls this, so alerts never drift out
-- of step with the real numbers. It is for other database functions only:
-- nobody, including signed-in users, may call it from the app.
create or replace function public.recheck_low_stock(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_stock   integer;
  v_minimum integer;
begin
  select current_stock, minimum_stock
    into v_stock, v_minimum
    from public.products
    where id = p_product_id;

  if not found then
    return;
  end if;

  if v_stock < v_minimum then
    insert into public.low_stock_alerts (product_id, current_stock, minimum_stock)
    values (p_product_id, v_stock, v_minimum)
    on conflict (product_id) where status in ('open', 'flagged') do nothing;
  else
    update public.low_stock_alerts
      set status = 'resolved', resolved_at = now()
      where product_id = p_product_id
        and status in ('open', 'flagged');
  end if;
end
$$;

revoke all on function public.recheck_low_stock(uuid)
  from public, anon, authenticated;

-- 4. Editing a product's minimum re-checks it too ----------------------
--
-- Managers edit minimum_stock with a plain update (ticket 04), not through
-- a function, so a trigger does the re-check: a rule the database runs
-- itself whenever that column changes.
create or replace function public.recheck_after_minimum_change()
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

drop trigger if exists products_recheck_after_minimum_change on public.products;
create trigger products_recheck_after_minimum_change
  after update of minimum_stock on public.products
  for each row
  when (old.minimum_stock is distinct from new.minimum_stock)
  execute function public.recheck_after_minimum_change();

-- 5. Manager actions: flag and resolve --------------------------------

create or replace function public.flag_low_stock_alert(p_alert_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select public.current_staff_role()) is distinct from 'manager' then
    raise exception 'Only an active manager can flag alerts'
      using errcode = '42501';
  end if;

  update public.low_stock_alerts
    set status = 'flagged', flagged_by = (select auth.uid())
    where id = p_alert_id and status = 'open';

  if not found then
    raise exception 'That alert is not open' using errcode = '22023';
  end if;
end
$$;

create or replace function public.resolve_low_stock_alert(p_alert_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select public.current_staff_role()) is distinct from 'manager' then
    raise exception 'Only an active manager can resolve alerts'
      using errcode = '42501';
  end if;

  update public.low_stock_alerts
    set status = 'resolved',
        resolved_by = (select auth.uid()),
        resolved_at = now()
    where id = p_alert_id and status in ('open', 'flagged');

  if not found then
    raise exception 'That alert is already resolved' using errcode = '22023';
  end if;
end
$$;

revoke all on function public.flag_low_stock_alert(uuid) from public, anon;
revoke all on function public.resolve_low_stock_alert(uuid) from public, anon;
grant execute on function public.flag_low_stock_alert(uuid) to authenticated;
grant execute on function public.resolve_low_stock_alert(uuid) to authenticated;

-- 6. create_product(): same as 004, plus the re-check -------------------

create or replace function public.create_product(
  p_name           text,
  p_category       text,
  p_price          numeric,
  p_starting_stock integer,
  p_minimum_stock  integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if (select public.current_staff_role()) is distinct from 'manager' then
    raise exception 'Only an active manager can add products'
      using errcode = '42501';
  end if;

  p_name     := btrim(coalesce(p_name, ''));
  p_category := btrim(coalesce(p_category, ''));

  if p_name = '' then
    raise exception 'Name is required' using errcode = '22023';
  end if;
  if p_category = '' then
    raise exception 'Category is required' using errcode = '22023';
  end if;
  if p_price is null or p_price < 0 then
    raise exception 'Price must be 0 or more' using errcode = '22023';
  end if;
  if p_starting_stock is null or p_starting_stock < 0
     or p_minimum_stock is null or p_minimum_stock < 0 then
    raise exception 'Stock numbers must be 0 or more' using errcode = '22023';
  end if;

  insert into public.products (name, category, price, current_stock, minimum_stock)
  values (p_name, p_category, p_price, p_starting_stock, p_minimum_stock)
  returning id into v_id;

  if p_starting_stock > 0 then
    insert into public.inventory_movements
      (product_id, employee_id, movement_type, quantity_change, remaining_stock)
    values
      (v_id, (select auth.uid()), 'initial', p_starting_stock, p_starting_stock);
  end if;

  perform public.recheck_low_stock(v_id);

  return v_id;
end
$$;

-- 7. complete_sale(): same as 005, plus the re-check and a "low_stock" list
--
-- The result now also carries "low_stock": the products on this order that
-- ended up below their minimum, so the app can warn the cashier right away.

create or replace function public.complete_sale(
  p_items           jsonb,
  p_amount_received numeric,
  p_payment_method  text default 'cash'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_line      record;
  v_product   record;
  v_total     numeric(10,2) := 0;
  v_change    numeric(10,2);
  v_sale      record;
  v_lines     jsonb := '[]'::jsonb;
  v_low       jsonb := '[]'::jsonb;
  v_name      text;
  v_price     numeric(10,2);
  v_remaining integer;
  v_minimum   integer;
begin
  if (select public.current_staff_role()) is null then
    raise exception 'Only active staff can record sales'
      using errcode = '42501';
  end if;

  if p_payment_method is distinct from 'cash' then
    raise exception 'Only cash is accepted' using errcode = '22023';
  end if;

  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'Add at least one item' using errcode = '22023';
  end if;

  -- Pass 1: check every line and add up the total (rows are locked).
  for v_line in
    select (e ->> 'product_id')::uuid        as product_id,
           sum((e ->> 'quantity')::integer)  as quantity
    from jsonb_array_elements(p_items) e
    group by 1
    order by 1
  loop
    if v_line.quantity is null or v_line.quantity <= 0 then
      raise exception 'Quantity must be at least 1' using errcode = '22023';
    end if;

    select id, name, price, current_stock
      into v_product
      from public.products
      where id = v_line.product_id and is_active
      for update;

    if not found then
      raise exception 'A product on this order is no longer available'
        using errcode = '22023';
    end if;

    if v_product.current_stock < v_line.quantity then
      raise exception 'Only % left in stock', v_product.current_stock
        using errcode = 'NX001', detail = v_product.id::text;
    end if;

    v_total := v_total + v_product.price * v_line.quantity;
  end loop;

  if p_amount_received is null or p_amount_received < v_total then
    raise exception 'The amount received is less than the total'
      using errcode = 'NX002';
  end if;
  v_change := p_amount_received - v_total;

  insert into public.sales (total_amount, amount_received, change_amount, payment_method)
  values (v_total, p_amount_received, v_change, 'cash')
  returning id, receipt_number, created_at into v_sale;

  -- Pass 2: save each line, lower the stock, log it, and re-check the alert.
  for v_line in
    select (e ->> 'product_id')::uuid        as product_id,
           sum((e ->> 'quantity')::integer)  as quantity
    from jsonb_array_elements(p_items) e
    group by 1
    order by 1
  loop
    update public.products
      set current_stock = current_stock - v_line.quantity
      where id = v_line.product_id
      returning name, price, current_stock, minimum_stock
        into v_name, v_price, v_remaining, v_minimum;

    insert into public.sale_items
      (sale_id, product_id, product_name, quantity, unit_price, line_total)
    values
      (v_sale.id, v_line.product_id, v_name, v_line.quantity,
       v_price, v_price * v_line.quantity);

    insert into public.inventory_movements
      (product_id, sale_id, employee_id, movement_type, quantity_change, remaining_stock)
    values
      (v_line.product_id, v_sale.id, (select auth.uid()), 'sale',
       -v_line.quantity, v_remaining);

    perform public.recheck_low_stock(v_line.product_id);

    v_lines := v_lines || jsonb_build_object(
      'product_name', v_name,
      'quantity',     v_line.quantity,
      'unit_price',   v_price,
      'line_total',   v_price * v_line.quantity
    );

    if v_remaining < v_minimum then
      v_low := v_low || jsonb_build_object(
        'product_name',  v_name,
        'current_stock', v_remaining,
        'minimum_stock', v_minimum
      );
    end if;
  end loop;

  return jsonb_build_object(
    'sale_id',         v_sale.id,
    'receipt_number',  v_sale.receipt_number,
    'created_at',      v_sale.created_at,
    'total_amount',    v_total,
    'amount_received', p_amount_received,
    'change_amount',   v_change,
    'items',           v_lines,
    'low_stock',       v_low
  );
end
$$;

-- 8. Catch up: products that were ALREADY below their minimum before this
-- file existed get their alert now.
do $$
declare
  v_id uuid;
begin
  for v_id in select id from public.products where is_active loop
    perform public.recheck_low_stock(v_id);
  end loop;
end
$$;
