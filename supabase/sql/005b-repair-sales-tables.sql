-- NOTE: this is a repair script that repeats sections 1 to 4 of
-- 005-create-sales.sql (tables and security only). It never contained
-- complete_sale(); the live version is in
-- 015-complete-sale-employees-only.sql.

-- 005b — repair: create the sales tables if they are missing.
--
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
--
-- Why this file exists: complete_sale() (from 006) was found in the
-- database while the sales table it writes to did not exist, so every sale
-- failed. This is sections 1 to 4 of 005-create-sales.sql only: the
-- counter, the two tables, the link from stock movements, and their
-- security. It deliberately does NOT include the old complete_sale() from
-- 005, which would overwrite the newer version from 006.
--
-- Safe to run more than once: tables use "if not exists" and policies are
-- dropped before they are recreated.

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
drop policy if exists "managers read all sales, employees their own" on public.sales;
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
drop policy if exists "sale items follow their sale" on public.sale_items;
create policy "sale items follow their sale"
  on public.sale_items for select
  to authenticated
  using (
    (select public.is_active_staff())
    and exists (
      select 1 from public.sales s where s.id = sale_items.sale_id
    )
  );

