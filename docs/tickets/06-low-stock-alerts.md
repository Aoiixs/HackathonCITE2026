# 06 — Low-stock alerts

**What to build:** When a product's stock falls below its minimum, an alert is created automatically. Staff see a warning after the sale, a Low stock list, and a badge with the count. The manager can flag items for restocking and mark them resolved.

**Blocked by:** 05

**Status:** todo

- [ ] The `low_stock_alerts` table exists as in the spec, with Row Level Security on and explicit policies, and only one open or flagged alert can exist per product
- [ ] The "re-check alert" rule creates an alert when stock is below minimum and none is open or flagged, and resolves it when stock is back at or above minimum
- [ ] The re-check runs when a product is added, when its minimum stock is edited, and when a sale is confirmed
- [ ] A sale that takes a product below its minimum shows an amber low-stock modal after the receipt
- [ ] The Low stock screen lists open and flagged alerts, furthest below minimum first, showing product, current stock, minimum, and status
- [ ] Employees can see the Low stock list but cannot change it
- [ ] The manager can "Flag for restocking" and "Mark resolved"
- [ ] A badge with the number of open and flagged alerts shows on the Dashboard and the New sale screen
- [ ] The manager Dashboard shows active products, low-stock items, and sales today for all staff
- [ ] Every policy on this table allows only staff whose profile has `is_active = true`; a deactivated user is refused even with a login that still works
- [ ] Works on the live URL
