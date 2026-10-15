# Spec: Nexora Order & Stock Tracker

## Problem
At Nexora's Ortiz branch, customer orders go into a notebook and stock
lives in a separate Excel file. Staff retype every order, counts drift
from the shelf, and the manager finds out late that a product is running
out.

## Solution
One app where staff take an order, record how the customer paid, and
give a receipt. Stock drops automatically and low stock is flagged to
staff and the manager straight away. The manager manages products, sees
history and reports, and decides when to restock.

## The user
Two roles, both signed in:
- **Employee** (Jeremiah): takes orders and records stock.
- **Manager**: monitors stock, manages products, decides restocking.

## Build stages
This spec is bigger than one three-hour session. It is split in two so
the demo path ships first.
- **Stage 1 (must ship):** Sign in, Dashboard (basic), New sale with
  payment and receipt, Manage products (no images), Low stock.
- **Stage 2 (only if time allows):** Record stock-in, Record stock-out,
  History & reports, void a sale, product images, manager dashboard
  extras (sales by employee, top sellers), tablet layout.

Anything marked **[Stage 2]** below is not needed for the demo.

## User stories
1. As an employee, I want to tap products to build an order and confirm
   it, so the stock drops automatically and I never retype anything.
2. As an employee, I want to record how the customer paid and give a
   receipt, so each sale is on record.
3. As an employee, I want to be told "Only 3 left" when an order is too
   big, so stock never goes negative.
4. As an employee, I want to record stock coming in and going out
   (spoiled, damaged, used), so the count matches the shelf. [Stage 2]
5. As an employee or manager, I want a low-stock list and warnings, so
   nobody finds out a product ran out too late.
6. As a manager, I want to add, edit and deactivate products and correct
   a miscount with a note, so the menu and the numbers stay right.
7. As a manager, I want to see every sale and stock movement, and
   reports by date, so I can decide when to restock and spot mistakes.
   [Stage 2]
8. As a manager, I want to void a wrong sale and flag items for
   restocking, so errors and restocking are handled in the app. (Flagging
   is Stage 1; voiding is Stage 2.)

## Screens
Designed for desktop (1440px) with large text and big tap targets for
the counter. Tablet landscape (1024px) is [Stage 2] and still to be
confirmed with Jeremiah (PROBLEM.md says the counter has a desktop
monitor). Both roles sign in on the same screen; their role in `profiles`
decides what they see.

### 1. Sign in
- Email and password. Nothing else is visible without signing in.
- Wrong credentials show "Invalid credentials" and keep the user on the form.
- Deactivated staff (`profiles.is_active = false`) cannot sign in.
- After sign-in, go to the Dashboard.

### 2. Dashboard (home), different per role
- Top bar: full_name, role, Log out (confirmation dialog, then back to Sign in).
- **Employee:** a large "New sale" button; their own sales today (total
  and count); count of low-stock items; product list (name, category,
  price, stock, In stock / Low stock tag); their 5 most recent sales.
  Record stock-in and Record stock-out buttons [Stage 2].
- **Manager:** sidebar menu (Dashboard, New sale, Manage products, Low
  stock; Stock-in, Stock-out, History & reports [Stage 2]); cards for
  active products, low-stock items, sales today for all staff;
  inventory table (name, category, current_stock, minimum_stock, status,
  Edit); open alerts panel. Stock-outs today, sales by employee today,
  and top sellers today [Stage 2].
- A low-stock badge with the count of open and flagged alerts shows on
  the Dashboard and the New sale screen.

### 3. New sale (POS), both roles
- Left: searchable grid of active products with category tabs; each
  shows name, price, and current_stock (amber when below minimum).
- Right: order summary with quantity +/-, remove item, line totals, total.
- Payment: cash only in Stage 1. Amount received (must cover the total)
  and the change. GCash and Maya as labels are [Stage 2].
- "Confirm order" calls `complete_sale`.
- Error: if a quantity is above the stock left, show "Only 5 left in
  stock" on that item and stay on the screen.
- Success: receipt modal with receipt_number, date and time, cashier
  name, items, total, amount received, change, and "Stock updated
  automatically".
- If the sale brings any product below minimum_stock, an amber low-stock
  modal follows the receipt. After it (or straight after the receipt if
  there is none) the user chooses "New sale" or "Back to dashboard".

### 4. Manage products, manager only
- Table of products with search, category filter, Active / Inactive filter.
- "Add product" form: name, category, price, starting stock, minimum
  stock. Optional image [Stage 2]. Validation errors for missing or
  invalid fields. A starting stock creates an 'initial' movement.
- "Edit" form: name, category, price, minimum stock (image [Stage 2]).
  Stock is not edited here. Changing the minimum re-checks the product's
  alert.
- "Adjust stock": enter the counted stock and a required note; saves
  through `adjust_stock`.
- "Deactivate" opens a confirmation dialog and sets is_active = false.
  Inactive products disappear from New sale but stay in past sales and
  history.
- Success toast after save.

### 5. Record stock-in, both roles [Stage 2]
- Form: product, quantity received, date (defaults to today, can be
  earlier), optional note. Shows the product's current stock and
  minimum beside the form.
- Validation errors for missing product or quantity <= 0.
- Success toast with the new stock level; resolves the product's open
  alert if stock is back at or above minimum.

### 6. Record stock-out, both roles [Stage 2]
- Form: product, quantity, date, reason (Spoiled, Damaged, Used),
  optional note.
- Error if quantity is above the stock left ("Only 12 in stock").
- Success toast; if the product drops below minimum, show the low-stock modal.

### 7. Low stock, both roles
- List of products with an open or flagged alert, furthest below minimum
  first (current_stock / minimum_stock). Each row: product, current
  stock, minimum, status.
- Manager can "Flag for restocking" (status 'flagged') and "Mark
  resolved". Employee sees the list read-only.

### 8. History & reports [Stage 2]
- Stock movement table: date, product, type (Sale, Stock-in, Stock-out,
  Adjustment, Initial, Void), quantity change, remaining stock,
  employee, reason or note. Filters: date range, product, type.
- Sales list: receipt number, date, cashier, total, payment method,
  status; opens the receipt.
- Manager only: void a sale (confirmation; sets status 'voided', puts the
  stock back, and writes a 'void' movement). Voided sales are excluded
  from totals.
- Summary for the selected range: total sales, number of sales, most
  sold products, current low-stock items.
- Employees see only their own sales and movements; managers see all.

### Flow
- Sign in -> (valid) Dashboard; (invalid) error on Sign in.
- Dashboard -> New sale, Low stock; manager also -> Manage products.
  [Stage 2] also Stock-in, Stock-out, History & reports.
- Forms validate; if wrong, show the error and stay; if right, save,
  update stock, then check minimum stock.
- Below minimum? Yes -> low-stock modal, then Dashboard. No -> Dashboard
  with updated stock.
- Dashboard -> Log out -> confirmation -> Sign in.

## Data
Table and column names are decisions; use them exactly.

### profiles — staff info
- id uuid PK, references auth.users.id
- full_name text not null
- role text not null, check in ('employee','manager')
- is_active boolean default true (deactivate, never delete: past sales point at staff)
- created_at timestamptz default now()

### products — menu and current inventory
- id uuid PK
- name text not null, unique (case-insensitive) among active products
- category text not null
- price numeric(10,2) not null, check >= 0
- current_stock integer not null, check >= 0
- minimum_stock integer not null, check >= 0
- image_url text nullable [Stage 2]
- is_active boolean default true (never hard-delete)
- created_at, updated_at timestamptz

### sales — one record per checkout
- id uuid PK
- receipt_number text unique, generated by the database from a sequence
  (e.g. NX-000119), never by the app
- employee_id uuid FK -> profiles.id, defaults to the signed-in user
- total_amount, amount_received, change_amount numeric(10,2)
- payment_method text, check in ('cash','gcash','maya') (Stage 1 only uses 'cash')
- status text default 'completed', check in ('completed','voided')
- created_at timestamptz default now()

### sale_items — products in each receipt
- id uuid PK
- sale_id uuid FK -> sales.id
- product_id uuid FK -> products.id
- product_name text (snapshot at time of sale)
- quantity integer, check > 0
- unit_price numeric(10,2) (snapshot at time of sale)
- line_total numeric(10,2)

### inventory_movements — every stock change, no exceptions
- id uuid PK
- product_id uuid FK -> products.id
- sale_id uuid nullable FK -> sales.id
- employee_id uuid FK -> profiles.id, defaults to the signed-in user
- movement_type text, check in ('initial','sale','stock_in','stock_out','adjustment','void')
- quantity_change integer (negative for sale and stock_out)
- remaining_stock integer
- reason text nullable, check in ('spoiled','damaged','used') when movement_type = 'stock_out'
- note text nullable
- movement_date date default current_date
- created_at timestamptz default now()

### low_stock_alerts — products needing restock
- id uuid PK
- product_id uuid FK -> products.id
- current_stock, minimum_stock integer (snapshot when the alert was created)
- status text default 'open', check in ('open','flagged','resolved')
- flagged_by, resolved_by uuid nullable FK -> profiles.id
- resolved_at timestamptz nullable
- created_at timestamptz default now()
- At most one alert per product with status 'open' or 'flagged' (partial unique index)

## Rules that must hold
- Every stock change goes through a database function in one
  all-or-nothing step, never a direct table write from the app. The app
  can never update `current_stock` directly; this is blocked in the
  database, not just left out of the screens.
- `complete_sale(items, amount_received, payment_method)`: lock the
  product rows, refuse if any quantity exceeds stock, insert sales and
  sale_items, lower current_stock, insert one 'sale' movement per item,
  re-check alerts. Totals, change, line totals and remaining_stock are
  computed inside the function.
- `adjust_stock(product_id, new_stock, note)`: manager only; inserts an
  'adjustment' movement with the difference and re-checks the alert.
- Creating a product with a starting stock inserts an 'initial' movement
  and checks the alert. Changing minimum_stock re-checks the alert.
- `record_stock_in(product_id, quantity, movement_date, note)` [Stage 2]:
  raises stock, inserts a movement, re-checks the alert.
- `record_stock_out(product_id, quantity, reason, movement_date, note)`
  [Stage 2]: refuses if quantity exceeds stock, lowers stock, inserts a
  movement, re-checks the alert.
- `void_sale(sale_id, note)` [Stage 2]: manager only; sets status
  'voided', puts the stock back, inserts 'void' movements, re-checks alerts.
- **Re-check alert** means: below minimum_stock and no open or flagged
  alert -> create one; at or above minimum_stock -> resolve the open or
  flagged alert.

## Row Level Security
- Signed-out visitors: nothing.
- **Deactivated staff** (`is_active = false`) are refused by every policy
  and every database function on every table except reading their own
  profile (the app needs that to sign them out). A password that still
  works is not enough.
- **Employee:** read all products (only active ones appear on New sale);
  call `complete_sale` (and, in Stage 2, `record_stock_in` and
  `record_stock_out`); read open and flagged alerts; read their own
  profile; read only their own sales, sale_items and movements.
- **Manager:** everything an employee can do, plus insert and update
  products (never `current_stock`), call `adjust_stock` (and
  `void_sale` in Stage 2), read all sales and movements, update
  low_stock_alerts (flag, resolve), read and update profiles.
- Nobody can update or delete sales, sale_items or inventory_movements,
  except a manager voiding a sale through `void_sale`.
- Nobody can delete products or profiles.

## Login
Required. Supabase Auth, email and password. Sign-ups are off in
Supabase. The role comes from `profiles`; deactivated staff cannot sign
in. Accounts are created by the team (not the manager) in the Supabase
dashboard, with a numbered SQL file in `supabase/sql/` adding the
matching `profiles` row and the first manager. Deactivating staff is
done the same way; there is no staff screen.

## Done for the demo (live URL, Stage 1)
- [ ] Sign in as employee and as manager; a wrong password shows "Invalid credentials".
- [ ] Manager adds a product with starting stock; it shows on New sale.
- [ ] Employee confirms an order paid in cash; the receipt shows change
      and a receipt number.
- [ ] Stock drops on the Dashboard; an order over the stock shows "Only N left".
- [ ] A sale that takes a product below minimum shows the low-stock
      modal, and the product appears in Low stock.
- [ ] Manager flags a low-stock product for restocking.
- [ ] A signed-out visitor sees nothing; an employee cannot reach Manage products.

## Out of scope
- Staff management screen, receipt printing, offline mode, multi-branch.
- Real GCash or Maya payment integration. GCash and Maya as recorded
  labels are Stage 2.
- Anything in Stage 2 that does not get built.
