-- 007 — adjust_stock(): the manager corrects a miscount.
--
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It needs 002 to 006 to have been run first.
--
-- Stock can only change through database functions (sales, and now this
-- one), never by editing a product. When the shelf count and the system
-- disagree, the manager counts the shelf and enters the real number here.
-- The difference is saved as an 'adjustment' movement with a required
-- note, so the history always explains why the numbers moved.

create or replace function public.adjust_stock(
  p_product_id uuid,
  p_new_stock  integer,
  p_note       text
)
returns integer   -- how much the stock changed: negative if it went down
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current integer;
  v_diff    integer;
begin
  if (select public.current_staff_role()) is distinct from 'manager' then
    raise exception 'Only an active manager can adjust stock'
      using errcode = '42501';
  end if;

  p_note := btrim(coalesce(p_note, ''));
  if p_note = '' then
    raise exception 'A note is required' using errcode = '22023';
  end if;
  if length(p_note) > 500 then
    raise exception 'Keep the note under 500 characters' using errcode = '22023';
  end if;
  if p_new_stock is null or p_new_stock < 0 then
    raise exception 'Counted stock must be 0 or more' using errcode = '22023';
  end if;

  -- "for update" locks the row so a sale cannot slip in between reading
  -- the current stock and saving the new number.
  select current_stock
    into v_current
    from public.products
    where id = p_product_id and is_active
    for update;

  if not found then
    raise exception 'That product was not found' using errcode = '22023';
  end if;

  v_diff := p_new_stock - v_current;
  if v_diff = 0 then
    raise exception 'The counted stock is the same as the current stock'
      using errcode = '22023';
  end if;

  update public.products
    set current_stock = p_new_stock
    where id = p_product_id;

  insert into public.inventory_movements
    (product_id, employee_id, movement_type, quantity_change, remaining_stock, note)
  values
    (p_product_id, (select auth.uid()), 'adjustment', v_diff, p_new_stock, p_note);

  -- The new number may put the product below its minimum, or lift it out.
  perform public.recheck_low_stock(p_product_id);

  return v_diff;
end
$$;

revoke all on function public.adjust_stock(uuid, integer, text) from public, anon;
grant execute on function public.adjust_stock(uuid, integer, text) to authenticated;
