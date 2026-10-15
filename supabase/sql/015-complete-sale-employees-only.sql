-- 015 — Only active employees can record sales (managers cannot).
--
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It needs 006 to have been run first. Safe to run more than once.
--
-- WHY: the app already stops managers from selling (the New sale page and
-- the sale action both refuse them), but the database function accepted any
-- active staff. That meant the rule only held as long as nobody called the
-- database directly. Now the database checks it too, the same way
-- record_stock_in and record_stock_out check for managers.
--
-- WHAT CHANGES: complete_sale() is replaced with the version from 006, with
-- one line different: the role check says "employee" instead of "any active
-- staff". Everything else (totals, stock locking, movements, alerts) is
-- identical. Its permissions are kept when a function is replaced.

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
  if (select public.current_staff_role()) is distinct from 'employee' then
    raise exception 'Only an active employee can record sales'
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
