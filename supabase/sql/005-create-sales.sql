-- NOTE: the complete_sale() in this file is SUPERSEDED by the version in
-- 006-create-low-stock-alerts.sql. The tables and security here are still
-- current. (005b-repair-sales-tables.sql repeats sections 1 to 4 only.)

-- 005 — sales, sale_items, and complete_sale().
--
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It needs 002, 003 and 004 to have been run first.

-- 1. Receipt numbers ---------------------------------------------------
--
-- A sequence is a counter owned by the database: every call to nextval()
-- gives the next number, and two people can never get the same one. The
-- app never makes up receipt numbers.
create sequence if not exists public.receipt_number_seq;

-- 2. sales: one row per checkout ---------------------------------------

create table if not exists public.sales (
  id              uuid          primary key default gen_random_uuid(),
  receipt_number  text          not null unique
    default ('NX-' || lpad(nextval('public.receipt_number_seq')::text, 6, '0')),
  employee_id     uuid          not null references public.profiles (id)
                                default auth.uid(),
  total_amount    numeric(10,2) not null check (total_amount >= 0),
  amount_received numeric(10,2) not null,
  change_amount   numeric(10,2) not null check (change_amount >= 0),
  payment_method  text          not null default 'cash'
    check (payment_method in ('cash', 'gcash', 'maya')),
  status          text          not null default 'completed'
    check (status in ('completed', 'voided')),
  created_at      timestamptz   not null default now(),
  check (amount_received >= total_amount),
  check (change_amount = amount_received - total_amount)
);

-- 3. sale_items: the products on each receipt ---------------------------
--
-- product_name and unit_price are COPIED at the time of sale, so a receipt
-- never changes even if the product is renamed or repriced later.

create table if not exists public.sale_items (
  id           uuid          primary key default gen_random_uuid(),
  sale_id      uuid          not null references public.sales (id),
  product_id   uuid          not null references public.products (id),
  product_name text          not null,
  quantity     integer       not null check (quantity > 0),
  unit_price   numeric(10,2) not null check (unit_price >= 0),
  line_total   numeric(10,2) not null check (line_total >= 0)
);

-- Now that sales exists, link stock movements to the sale that caused them.
-- (inventory_movements.sale_id was left unlinked in 004.)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'inventory_movements_sale_id_fkey'
  ) then
    alter table public.inventory_movements
      add constraint inventory_movements_sale_id_fkey
      foreign key (sale_id) references public.sales (id);
  end if;
end
$$;

-- 4. Row Level Security -------------------------------------------------

alter table public.sales enable row level security;
alter table public.sale_items enable row level security;

-- Same two layers as 004. Layer 1: take away every privilege, give back
-- only reading. Nobody can insert, update or delete a sale through the
-- API: sales are created by complete_sale() below and never edited.
revoke all on public.sales from anon, authenticated;
revoke all on public.sale_items from anon, authenticated;
grant select on public.sales to authenticated;
grant select on public.sale_items to authenticated;

-- Layer 2: which rows. Managers see every sale; an employee sees only
-- their own. Both require the person to still be active staff.
create policy "managers read all sales, employees their own"
  on public.sales for select
  to authenticated
  using (
    (select public.current_staff_role()) = 'manager'
    or (
      (select public.is_active_staff())
      and employee_id = (select auth.uid())
    )
  );

-- A receipt line is visible exactly when its sale is visible. The inner
-- query on sales is itself filtered by the policy above, so we do not
-- repeat the rule here.
create policy "sale items follow their sale"
  on public.sale_items for select
  to authenticated
  using (
    (select public.is_active_staff())
    and exists (
      select 1 from public.sales s where s.id = sale_items.sale_id
    )
  );

-- 5. complete_sale(): the whole checkout in one all-or-nothing step -----
--
-- p_items looks like: [{"product_id": "<uuid>", "quantity": 2}, ...]
--
-- Everything below happens inside ONE transaction. If any line fails (for
-- example, not enough stock), nothing is saved at all: no sale, no stock
-- change. That is what keeps the count honest.
--
-- Two custom error codes tell the app what went wrong:
--   NX001  not enough stock; the DETAIL holds the product's id
--   NX002  the amount received does not cover the total
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
  v_line     record;
  v_product  record;
  v_total    numeric(10,2) := 0;
  v_change   numeric(10,2);
  v_sale     record;
  v_lines    jsonb := '[]'::jsonb;
  v_name      text;
  v_price     numeric(10,2);
  v_remaining integer;
begin
  if (select public.current_staff_role()) is null then
    raise exception 'Only active staff can record sales'
      using errcode = '42501';
  end if;

  -- Stage 1 takes cash only.
  if p_payment_method is distinct from 'cash' then
    raise exception 'Only cash is accepted' using errcode = '22023';
  end if;

  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'Add at least one item' using errcode = '22023';
  end if;

  -- Pass 1: check every line and add up the total.
  -- "for update" LOCKS the product row until this transaction ends, so two
  -- cashiers selling the last item at the same moment cannot both succeed.
  -- Lines are visited in id order so two sales cannot lock each other out.
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

  -- Pass 2: save each line, lower the stock, and log the movement.
  -- Totals, line totals and remaining stock are all worked out here, never
  -- trusted from the app.
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
      returning name, price, current_stock into v_name, v_price, v_remaining;

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

    v_lines := v_lines || jsonb_build_object(
      'product_name', v_name,
      'quantity',     v_line.quantity,
      'unit_price',   v_price,
      'line_total',   v_price * v_line.quantity
    );
  end loop;

  -- Ticket 06 adds the low-stock alert check here.

  return jsonb_build_object(
    'sale_id',         v_sale.id,
    'receipt_number',  v_sale.receipt_number,
    'created_at',      v_sale.created_at,
    'total_amount',    v_total,
    'amount_received', p_amount_received,
    'change_amount',   v_change,
    'items',           v_lines
  );
end
$$;

revoke all on function public.complete_sale(jsonb, numeric, text) from public, anon;
grant execute on function public.complete_sale(jsonb, numeric, text) to authenticated;
