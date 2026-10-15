# Nexora Order & Stock Tracker

## Who
Jeremiah, the employee who takes customer orders and updates the stock
at the Nexora food business, Ortiz branch. He is the main user. The
manager is a second role (decided in `/to-spec`): they monitor stock,
manage products and decide restocking. See `docs/SPEC.md`.

## The struggle
Jeremiah writes each customer order by hand in a notebook while
customers wait in the queue. Afterwards he re-types the orders into an
Excel spreadsheet to update the stock. Orders and stock are never
connected, so we have seen:
- slow service in the queue
- stock counts that drift from reality
- missing or misplaced notebook entries
- the manager finding out late that a product is running out

This happens daily, with every customer order.

**Still to confirm with Jeremiah (not yet measured):**
- Orders per day: ___
- Minutes per day spent updating Excel: ___
- Times a product ran out without being noticed, and what happened: ___

## Today's workaround
A notebook for orders and an Excel spreadsheet for stock, kept in
sync by hand. The manager reads both to decide when to restock.
Cost: time, errors, and late awareness of low stock (figures to confirm
above).

## The MVP
Staff tap the products in a customer's order, record the payment and
give a receipt, the stock drops automatically, and any product below its
minimum level appears in a "running low" list. The manager manages
products and decides restocking.

The counter device is a desktop monitor, so we design for a desktop
screen first. Tablet use is unconfirmed.

Scope grew after the interview: payments and receipts, manager login and
low-stock alerts are now in the MVP (Stage 1 in `docs/SPEC.md`). Stock
history, reports and the rest are Stage 2.

## How we'll know it worked
Demo (three minutes): add a product, take an order, watch the stock
drop, see the product appear as running low.
Who will try it before Session 3: Jeremiah (to confirm).
Why software and not a better spreadsheet: Excel cannot deduct stock
while the order is being taken and cannot warn anyone (our reasoning;
Jeremiah has not yet confirmed it).

## Out of scope
- Stage 2 items from `docs/SPEC.md` (stock-in/out forms, history and
  reports, voiding sales, product images, tablet layout)
- Staff management screen, receipt printing, offline mode, multi-branch
- Real GCash or Maya payment integration (labels only)

## Glossary
- **Order**: one customer's purchase, with one or more products and quantities.
- **Product**: an item the shop sells, with a name and a stock count.
- **Stock**: how many units of a product are left.
- **Minimum level**: the stock number below which a product counts as "running low".
- **Running low**: a product whose stock is below its minimum level.
