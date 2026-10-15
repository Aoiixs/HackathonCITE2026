# 10 — History and reports

**What to build:** A History & reports screen where staff can look back: every stock movement (sales, stock in, stock out, adjustments, initial stock), a list of sales that opens each receipt again, and a summary for the chosen dates. The manager sees everyone's records; an employee sees only their own. This is Stage 2 work from `docs/SPEC.md`, pulled forward at the team's request. Voiding a sale is a separate item and is not part of this ticket.

**Blocked by:** 09

**Status:** todo

- [ ] A manager can read every staff member's name (a Row Level Security policy), so history can show who did what; an employee still reads only their own profile
- [ ] The screen has a date range (defaults to the last 7 days, in Manila time), a product filter, and a movement-type filter, with Apply and Reset
- [ ] Stock movement table: date, product, type (Sale, Stock in, Stock out, Adjustment, Initial), quantity change, remaining stock, employee, and reason or note; newest first
- [ ] Sales list: receipt number, date and time, cashier, total, payment method and status, each with a link that opens the receipt
- [ ] The receipt page shows the same receipt layout as after a sale, and an employee cannot open another employee's receipt
- [ ] Summary for the chosen dates: total sales, number of sales, most sold products (top five by quantity) and the products running low now
- [ ] Voided sales are left out of the totals
- [ ] A manager sees all staff's records; an employee sees only their own, and their labels say "Your"
- [ ] If there are more rows than are shown, the screen says so
- [ ] "History & reports" is in the manager's menu and on the employee's Dashboard
- [ ] Works on the live URL
