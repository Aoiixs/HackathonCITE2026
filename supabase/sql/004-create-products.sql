-- 004 — products and inventory_movements, plus create_product().
--
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It needs 002 and 003 to have been run first.

-- 1. products: the menu and the current stock of each item ------------

create table if not exists public.products (
  id            uuid          primary key default gen_random_uuid(),
  name          text          not null,
  category      text          not null,
  price         numeric(10,2) not null check (price >= 0),
  current_stock integer       not null default 0 check (current_stock >= 0),
  minimum_stock integer       not null default 0 check (minimum_stock >= 0),
  image_url     text,                         -- Stage 2, not used yet
  is_active     boolean       not null default true,
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now()
);

-- Two ACTIVE products cannot share a name, ignoring capital letters.
-- A deactivated product frees its name for reuse.
create unique index if not exists products_active_name_key
  on public.products (lower(name))
  where is_active;

-- Keeps updated_at honest without the app having to remember.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- 2. inventory_movements: every stock change, no exceptions -----------
--
-- Nothing in the app writes here directly. Only database functions do,
-- so the history always matches the stock.

create table if not exists public.inventory_movements (
  id              uuid        primary key default gen_random_uuid(),
  product_id      uuid        not null references public.products (id),
  sale_id         uuid,       -- gets its link to sales in ticket 05
  employee_id     uuid        not null references public.profiles (id)
                              default auth.uid(),
  movement_type   text        not null
    check (movement_type in
      ('initial', 'sale', 'stock_in', 'stock_out', 'adjustment', 'void')),
  quantity_change integer     not null,
  remaining_stock integer     not null check (remaining_stock >= 0),
  reason          text        check (reason in ('spoiled', 'damaged', 'used')),
  note            text,
  movement_date   date        not null default current_date,
  created_at      timestamptz not null default now(),
  -- a reason only makes sense for stock going out
  check (reason is null or movement_type = 'stock_out')
);

-- 3. Row Level Security ----------------------------------------------

alter table public.products enable row level security;
alter table public.inventory_movements enable row level security;

-- Layer 1 — table privileges. Supabase hands every new table to signed-in
-- and signed-out users by default; take it all away, then give back only
-- what is needed.
revoke all on public.products from anon, authenticated;
revoke all on public.inventory_movements from anon, authenticated;

grant select on public.products to authenticated;

-- Column-level privilege: the app may update THESE columns and no others.
-- current_stock is deliberately missing, so nobody (not even the manager)
-- can change stock by editing a product. Stock only moves through
-- database functions. New products arrive only via create_product() below,
-- so there is no insert privilege at all.
grant update (name, category, price, minimum_stock, image_url, is_active)
  on public.products to authenticated;

grant select on public.inventory_movements to authenticated;

-- Layer 2 — policies: which rows. Every policy goes through the helpers
-- from 003, so a deactivated person is refused even with a valid login.
create policy "active staff can read products"
  on public.products for select
  to authenticated
  using ((select public.is_active_staff()));

create policy "managers can update products"
  on public.products for update
  to authenticated
  using ((select public.current_staff_role()) = 'manager')
  with check ((select public.current_staff_role()) = 'manager');

create policy "managers read all movements, employees their own"
  on public.inventory_movements for select
  to authenticated
  using (
    (select public.current_staff_role()) = 'manager'
    or (
      (select public.is_active_staff())
      and employee_id = (select auth.uid())
    )
  );

-- No insert or delete policy on either table: nobody can add or remove
-- rows through the API. Products are never deleted, only deactivated.

-- 4. create_product(): add a product and record its starting stock ----
--
-- Runs as one all-or-nothing step: the product and its 'initial'
-- movement are saved together, or neither is. SECURITY DEFINER (see 003)
-- lets it write to tables the app cannot write to, so it checks for itself
-- that the caller is an active manager.
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

  return v_id;
end
$$;

revoke all on function public.create_product(text, text, numeric, integer, integer)
  from public, anon;
grant execute on function public.create_product(text, text, numeric, integer, integer)
  to authenticated;

-- Ticket 06 will extend create_product() to check low-stock alerts too.
