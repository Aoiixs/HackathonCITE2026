# 06 — Low-stock alerts

**What to build:** When a product's stock falls below its minimum, an alert is created automatically. Staff see a warning after the sale, a Low stock list, and a badge with the count. The manager can flag items for restocking and mark them resolved.

**Blocked by:** 05

**Status:** done

- [x] The `low_stock_alerts` table exists as in the spec, with Row Level Security on and explicit policies, and only one open or flagged alert can exist per product
- [x] The "re-check alert" rule creates an alert when stock is below minimum and none is open or flagged, and resolves it when stock is back at or above minimum
- [x] The re-check runs when a product is added, when its minimum stock is edited, and when a sale is confirmed
- [x] A sale that takes a product below its minimum shows an amber low-stock modal after the receipt
- [x] The Low stock screen lists open and flagged alerts, furthest below minimum first, showing product, current stock, minimum, and status
- [x] Employees can see the Low stock list but cannot change it
- [x] The manager can "Flag for restocking" and "Mark resolved"
- [x] A badge with the number of open and flagged alerts shows on the Dashboard and the New sale screen
- [x] The manager Dashboard shows active products, low-stock items, and sales today for all staff
- [x] Every policy on this table allows only staff whose profile has `is_active = true`; a deactivated user is refused even with a login that still works
- [x] Works on the live URL
