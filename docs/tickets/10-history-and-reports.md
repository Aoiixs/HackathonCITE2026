# 10 — History and reports

**What to build:** A History & reports screen where staff can look back: three summary cards for the chosen dates (total sales with a daily chart, most sold products, products running low), the stock movement history, and a list of sales that opens each receipt again. The manager sees everyone's records; an employee sees only their own. This is Stage 2 work from `docs/SPEC.md`, pulled forward at the team's request. Voiding a sale is a separate item and is not part of this ticket.

**Blocked by:** 09

**Status:** done

- [x] A manager can read every staff member's name (a Row Level Security policy), so history can show who did what; an employee still reads only their own profile
- [x] The dates default to the 1st of this month through today, in Manila time, and the three cards follow them
- [x] "Total sales" card: the total in pesos, "{n} orders · average ₱{x} per order", and one bar per day with today's bar in a darker shade
- [x] "Most sold products" card: the top four by quantity sold, each with "{n} sold" and a bar scaled to the top item
- [x] "Low-stock items" card (amber border): every active product whose stock is below its minimum, shown as "{stock} of {min}", worked out live from current stock
- [x] The totals, the daily bars and the best sellers are added up inside the database (`sales_report`), so they stay exact however many sales there are; for an employee the same function adds up only their own sales
- [x] If the totals cannot be loaded, the screen says so instead of showing zeros
- [x] Voided sales are left out of the totals
- [x] A clearly labelled demo-data script (and a script that removes it) can fill Oct 1 to Oct 15, 2026 with sample sales, stock movements and low-stock products for a rehearsal
- [x] Stock movement history: filters for From date, To date, product (including deactivated products) and type chips (All, Sale, Stock-in, Stock-out)
- [x] The table, newest first, shows date and time, product, a coloured type pill (Sale, Stock-in, "Stock-out · reason"), quantity as +n or −n, remaining stock, and employee
- [x] More than one page of movements loads with a "Load more" button; no matches shows "No movements for these filters"
- [x] Deactivated products still appear in the history
- [x] A sales list shows receipt number, date and time, cashier, total, payment method and status, each with a link that reopens the receipt; an employee cannot open another employee's receipt
- [x] A manager sees all staff's records; an employee sees only their own, and their labels say "Your"
- [x] "History & reports" is in the manager's menu and on the employee's Dashboard
- [x] Works on the live URL
