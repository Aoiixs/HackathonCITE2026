-- DEMO DATA — a believable 15 days of history, ending today, for History & reports.
--
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It needs 002 to 010 to have been run first, and at least one active
-- manager profile and one active employee profile.
--
-- THE DATES ARE RELATIVE TO THE DAY YOU RUN IT (Manila time): the history
-- starts 14 days ago and ends today, so run it on the day you demo. Today's
-- sales stop 5 minutes before the moment you run it, so nothing is dated in
-- the future. (If you run it before 8:05am, today has no sales yet.)
--
-- THIS IS MADE-UP SAMPLE DATA for a demo, not real sales. Never present it
-- as real. To remove all of it again, run remove-demo-data.sql.
--
-- What it creates:
--   * 11 products (Meals, Snacks, Drinks, Cakes) with starting stock on day 1
--   * about 200 cash sales over 15 days, 8am to 8pm Manila time, busier on
--     weekends. Every sale belongs to the employee: managers do not sell.
--   * three deliveries (stock in), a few spoiled/damaged items (stock out),
--     and a shelf recount on the last day that leaves four products low
--   * the matching stock movements and low-stock alerts, so every screen
--     agrees with every other screen
--
-- It is "seeded" (the same "random" numbers every time), though the days
-- shift with the date you run it. It refuses to run twice.

do $$
declare
  v_names    text[]    := array['Chicken Adobo Meal', 'Pork Sisig Meal', 'Beef Tapa Meal',
                                 'Vegetable Pancit', 'French Fries', 'Iced Coffee', 'Milk Tea',
                                 'Bottled Water', 'Lemonade', 'Chocolate Cake Slice', 'Mango Cake Slice'];
  v_cats     text[]    := array['Meals', 'Meals', 'Meals', 'Meals', 'Snacks', 'Drinks', 'Drinks',
                                 'Drinks', 'Drinks', 'Cakes', 'Cakes'];
  v_prices   numeric[] := array[85, 95, 100, 70, 55, 65, 75, 20, 45, 90, 95];
  v_mins     int[]     := array[15, 15, 12, 10, 15, 20, 20, 30, 20, 10, 10];
  v_init     int[]     := array[60, 55, 45, 40, 50, 90, 85, 120, 70, 40, 35];
  v_weights  numeric[] := array[10, 9, 7, 5, 6, 14, 12, 8, 6, 5, 4];  -- how often each sells
  v_adj_names text[]   := array['Iced Coffee', 'Chocolate Cake Slice', 'Bottled Water', 'Beef Tapa Meal'];
  v_adj_to    int[]    := array[9, 4, 14, 11];                        -- the shelf recount on the last day
  v_reasons  text[]    := array['spoiled', 'damaged', 'used'];
  v_start    date        := (now() at time zone 'Asia/Manila')::date - 14; -- 15 days, today included
  v_t0       timestamptz := ((v_start)::timestamp + interval '7 hours') at time zone 'Asia/Manila';

  n          int;
  v_wsum     numeric;
  v_mgr      uuid;
  v_emp      uuid;
  v_ids      uuid[]    := '{}';
  v_stock    int[]     := '{}';
  v_pid      uuid;
  v_sale_id  uuid;
  v_day      date;
  v_ts       timestamptz;
  v_lines_idx int[];
  v_lines_qty int[];
  v_total    numeric(10,2);
  v_received numeric(10,2);
  v_r        numeric;
  v_acc      numeric;
  v_slot     numeric;
  v_n_sales  int;
  v_end_min  int;
  v_minute   int;
  v_pick     int;
  v_qty      int;
  v_count    int := 0;
  i int; j int; d int; k int; l int;
begin
  if exists (select 1 from public.sales where receipt_number like 'DEMO-%') then
    raise notice 'Demo data is already loaded. Run remove-demo-data.sql first to load it again.';
    return;
  end if;

  if exists (
    select 1 from public.products
    where is_active and lower(name) = any (select lower(x) from unnest(v_names) x)
  ) then
    raise exception 'A product with one of the demo names already exists. Rename or deactivate it first.';
  end if;

  select id into v_mgr from public.profiles
    where role = 'manager' and is_active order by created_at limit 1;
  select id into v_emp from public.profiles
    where role = 'employee' and is_active order by created_at limit 1;
  if v_mgr is null then
    raise exception 'No active manager profile found. Run 003 first.';
  end if;
  if v_emp is null then
    raise exception 'No active employee profile found. Every demo sale belongs to the employee (managers do not sell).';
  end if;

  perform setseed(0.2026);   -- the same "random" numbers every time
  n := array_length(v_names, 1);
  select sum(w) into v_wsum from unnest(v_weights) w;

  -- 1. The products, with their starting stock on the first day.
  for i in 1..n loop
    insert into public.products (name, category, price, current_stock, minimum_stock, created_at, updated_at)
    values (v_names[i], v_cats[i], v_prices[i], v_init[i], v_mins[i], v_t0, v_t0)
    returning id into v_pid;
    v_ids[i]   := v_pid;
    v_stock[i] := v_init[i];

    insert into public.inventory_movements
      (product_id, employee_id, movement_type, quantity_change, remaining_stock, note, movement_date, created_at)
    values
      (v_pid, v_mgr, 'initial', v_init[i], v_init[i], 'DEMO DATA', v_start, v_t0);
  end loop;

  -- 2. Day by day: deliveries, a recount, sales, then spoilage.
  for d in 0..14 loop
    v_day := v_start + d;

    -- Deliveries on days 4, 8 and 12 for anything running thin.
    if d in (3, 7, 11) then
      for i in 1..n loop
        if v_stock[i] < 3 * v_mins[i] then
          v_qty := v_mins[i] * 4 + floor(random() * 10)::int;
          v_stock[i] := v_stock[i] + v_qty;
          insert into public.inventory_movements
            (product_id, employee_id, movement_type, quantity_change, remaining_stock, note, movement_date, created_at)
          values
            (v_ids[i], v_mgr, 'stock_in', v_qty, v_stock[i], 'DEMO DATA: delivery', v_day,
             (v_day::timestamp + interval '7 hours 30 minutes') at time zone 'Asia/Manila');
        end if;
      end loop;
    end if;

    -- The morning of the last day (today): a delivery tops up any product
    -- that is thin and is not one of the four to be left low, then the
    -- manager recounts four shelves. This keeps exactly four products low
    -- at the end, whatever day the script is run. Both are dated 5 minutes
    -- before now at the latest, so they are never in the future.
    if d = 14 then
      for i in 1..n loop
        if not (v_names[i] = any (v_adj_names)) and v_stock[i] < 2 * v_mins[i] then
          v_qty := v_mins[i] * 4 + floor(random() * 10)::int;
          v_stock[i] := v_stock[i] + v_qty;
          insert into public.inventory_movements
            (product_id, employee_id, movement_type, quantity_change, remaining_stock, note, movement_date, created_at)
          values
            (v_ids[i], v_mgr, 'stock_in', v_qty, v_stock[i], 'DEMO DATA: delivery', v_day,
             least((v_day::timestamp + interval '7 hours 30 minutes') at time zone 'Asia/Manila',
                   now() - interval '5 minutes'));
        end if;
      end loop;

      for j in 1..array_length(v_adj_names, 1) loop
        i := array_position(v_names, v_adj_names[j]);
        if v_stock[i] <> v_adj_to[j] then
          v_qty := v_adj_to[j] - v_stock[i];
          v_stock[i] := v_adj_to[j];
          insert into public.inventory_movements
            (product_id, employee_id, movement_type, quantity_change, remaining_stock, note, movement_date, created_at)
          values
            (v_ids[i], v_mgr, 'adjustment', v_qty, v_stock[i], 'DEMO DATA: shelf recount', v_day,
             least((v_day::timestamp + interval '7 hours 45 minutes') at time zone 'Asia/Manila',
                   now() - interval '5 minutes'));
        end if;
      end loop;
    end if;

    -- The day's sales. Weekends are busier.
    v_n_sales := case
      when extract(isodow from v_day) in (6, 7) then 14 + floor(random() * 9)::int
      else 10 + floor(random() * 7)::int
    end;
    v_end_min := 1200;   -- 8pm
    if d = 14 then       -- today: stop 5 minutes before right now
      v_end_min := least(1200,
        (extract(hour from (now() at time zone 'Asia/Manila')) * 60
         + extract(minute from (now() at time zone 'Asia/Manila')))::int - 5);
      if v_end_min <= 480 then
        v_n_sales := 0;  -- the shop has not opened yet, so no sales today
      end if;
    end if;
    v_slot := (v_end_min - 480)::numeric / greatest(v_n_sales, 1);

    for k in 1..v_n_sales loop
      v_lines_idx := '{}';
      v_lines_qty := '{}';

      -- One to three lines, each product chosen by how popular it is.
      for l in 1..(1 + floor(random() * 3)::int) loop
        v_r := random() * v_wsum;
        v_acc := 0;
        v_pick := n;
        for j in 1..n loop
          v_acc := v_acc + v_weights[j];
          if v_r <= v_acc then
            v_pick := j;
            exit;
          end if;
        end loop;

        if v_pick = any (v_lines_idx) then
          continue;
        end if;
        v_qty := 1 + floor(random() * 2)::int + case when random() < 0.1 then 1 else 0 end;
        if v_qty > v_stock[v_pick] then
          v_qty := v_stock[v_pick];   -- never sell more than is on the shelf
        end if;
        -- Today, the products that are not meant to end low stay at or above
        -- their minimum.
        if d = 14 and not (v_names[v_pick] = any (v_adj_names)) then
          v_qty := least(v_qty, v_stock[v_pick] - v_mins[v_pick]);
        end if;
        if v_qty <= 0 then
          continue;
        end if;
        v_lines_idx := v_lines_idx || v_pick;
        v_lines_qty := v_lines_qty || v_qty;
      end loop;

      if coalesce(array_length(v_lines_idx, 1), 0) = 0 then
        continue;
      end if;

      v_total := 0;
      for j in 1..array_length(v_lines_idx, 1) loop
        v_total := v_total + v_prices[v_lines_idx[j]] * v_lines_qty[j];
      end loop;
      -- The customer pays with the next 50 or 100 peso bill.
      v_received := case
        when random() < 0.3 then ceil(v_total / 100) * 100
        else ceil(v_total / 50) * 50
      end;

      v_minute := 480 + floor((k - 1) * v_slot + random() * v_slot)::int;
      v_ts := (v_day::timestamp + make_interval(mins => v_minute)) at time zone 'Asia/Manila';
      v_count := v_count + 1;

      insert into public.sales
        (receipt_number, employee_id, total_amount, amount_received, change_amount, payment_method, status, created_at)
      values
        ('DEMO-' || lpad(v_count::text, 4, '0'), v_emp, v_total, v_received,
         v_received - v_total, 'cash', 'completed', v_ts)
      returning id into v_sale_id;

      for j in 1..array_length(v_lines_idx, 1) loop
        i := v_lines_idx[j];
        v_stock[i] := v_stock[i] - v_lines_qty[j];

        insert into public.sale_items
          (sale_id, product_id, product_name, quantity, unit_price, line_total)
        values
          (v_sale_id, v_ids[i], v_names[i], v_lines_qty[j], v_prices[i], v_prices[i] * v_lines_qty[j]);

        insert into public.inventory_movements
          (product_id, sale_id, employee_id, movement_type, quantity_change, remaining_stock, movement_date, created_at)
        values
          (v_ids[i], v_sale_id, v_emp, 'sale', -v_lines_qty[j], v_stock[i], v_day, v_ts);
      end loop;
    end loop;

    -- Evening spoilage on days 5, 9 and 14 (never today).
    if d in (4, 8, 13) then
      for j in 1..2 loop
        i := 1 + ((d * 3 + j * 5) % n);
        v_qty := least(3, v_stock[i]);
        if v_qty > 0 then
          v_stock[i] := v_stock[i] - v_qty;
          insert into public.inventory_movements
            (product_id, employee_id, movement_type, quantity_change, remaining_stock, reason, note, movement_date, created_at)
          values
            (v_ids[i], v_mgr, 'stock_out', -v_qty, v_stock[i], v_reasons[1 + ((d + j) % 3)],
             'DEMO DATA', v_day,
             (v_day::timestamp + interval '20 hours 30 minutes') at time zone 'Asia/Manila');
        end if;
      end loop;
    end if;
  end loop;

  -- 3. Save the final stock and create the low-stock alerts it implies.
  for i in 1..n loop
    update public.products set current_stock = v_stock[i] where id = v_ids[i];
    perform public.recheck_low_stock(v_ids[i]);
  end loop;

  raise notice 'Demo data loaded: % sales and % products.', v_count, n;
end
$$;
