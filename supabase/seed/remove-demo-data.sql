-- Removes everything demo-data.sql created, and nothing else.
--
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
--
-- Demo sales are the ones with a receipt number starting "DEMO-". Demo
-- stock records carry the note "DEMO DATA". Demo products are the ones that
-- have a demo "initial" stock record. Your real products, sales and stock
-- records are not touched.
--
-- One caution: if you made a REAL sale of a demo product afterwards, that
-- product cannot be deleted (a real receipt still points at it) and this
-- script will stop with an error. Nothing is half-deleted: it all happens
-- in one step, or not at all.

do $$
declare
  v_products uuid[];
  v_sales    int;
begin
  select coalesce(array_agg(distinct product_id), '{}')
    into v_products
    from public.inventory_movements
    where movement_type = 'initial' and note = 'DEMO DATA';

  delete from public.sale_items
    where sale_id in (select id from public.sales where receipt_number like 'DEMO-%');

  delete from public.inventory_movements
    where note like 'DEMO DATA%'
       or sale_id in (select id from public.sales where receipt_number like 'DEMO-%');

  delete from public.sales where receipt_number like 'DEMO-%';
  get diagnostics v_sales = row_count;

  delete from public.low_stock_alerts where product_id = any (v_products);
  delete from public.products where id = any (v_products);

  raise notice 'Removed % demo sales and % demo products.', v_sales, coalesce(array_length(v_products, 1), 0);
end
$$;
