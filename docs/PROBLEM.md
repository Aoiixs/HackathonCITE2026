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

**What the team has measured (reported by Jeremiah and the manager):**
- Orders per day: 50 to 70 on a normal day, 100 to 120 on a busy day.
- Time lost: 2 to 5 minutes on every order. At 50 to 70 orders that is
  roughly 100 to 350 minutes of handling a day (our arithmetic from his
  figures, not a separate measurement).
- Products running out unnoticed: it happens many times. Orders get
  declined, roughly ₱25 lost per declined order (as reported; how many
  orders are declined per day is not yet counted).

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
while the order is being taken and cannot warn anyone. Jeremiah's own
view: a Google Sheet with formulas is too complicated to set up and
maintain.

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
- **Sale**: the saved record of an order once it is paid, with the payment method and a receipt number. Confirmed: Jeremiah uses "sale" and "order" for the same thing.
- **Void**: cancelling a wrong sale so it no longer counts. Stage 2.
- **Stock-in**: stock added, for example a delivery arrives.
- **Stock-out**: stock removed without a sale, for example spoiled or damaged.
- **Employee**: the person at the counter who takes orders (Jeremiah).
- **Manager**: the person who manages products and decides restocking.
