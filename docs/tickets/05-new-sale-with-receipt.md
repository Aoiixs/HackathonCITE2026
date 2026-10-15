# 05 — New sale with payment and receipt

**What to build:** Staff take a customer's order by tapping products, enter the cash received, and confirm. The stock drops automatically and a receipt appears. An order bigger than the stock left is refused. This is cash only; GCash and Maya are parked for later.

**Blocked by:** 04

**Status:** done

- [x] The `sales` and `sale_items` tables and the `complete_sale` function exist as in the spec, with Row Level Security on and explicit policies
- [x] The New sale screen shows a searchable grid of active products with category tabs, each showing name, price, and current stock
- [x] Tapping a product adds it to the order; quantities can be raised, lowered, and removed; line totals and the order total update
- [x] The employee enters the amount received; the change is calculated, and an amount below the total is refused
- [x] "Confirm order" saves the sale and lowers the stock in one all-or-nothing step, and writes one 'sale' movement per item
- [x] If any quantity is above the stock left, that item shows "Only N left in stock" and nothing is saved
- [x] The receipt modal shows a database-generated receipt number (`NX-` prefix), date and time, cashier name, items, total, amount received, change, and "Stock updated automatically", with "New sale" and "Back to dashboard" buttons
- [x] The employee Dashboard shows the product list with stock, their own sales today (total and count), and their five most recent sales
- [x] An employee sees only their own sales; a manager sees everyone's
- [x] Sales cannot be edited or deleted
- [x] Every policy on these tables, and `complete_sale` itself, allows only staff whose profile has `is_active = true`; a deactivated user is refused even with a login that still works
- [x] Works on the live URL
