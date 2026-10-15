# 09 — Stock in and stock out (manager)

**What to build:** The manager can record stock coming in (a delivery) and stock going out (spoiled, damaged or used), each with a date and an optional note. Stock goes up or down, the change is saved in the movement history, and low-stock alerts update. This is Stage 2 work from `docs/SPEC.md`, pulled forward at the team's request. It is manager-only for now; employees can be given it later.

**Blocked by:** 07

**Status:** done

- [x] `record_stock_in` and `record_stock_out` database functions exist, each allowing only an active manager, each saving the stock change and its movement in one all-or-nothing step
- [x] Stock in form: product, quantity received, date (defaults to today, can be earlier, cannot be in the future), optional note, a Cancel button and a "Save stock in" button
- [x] Stock out form: product, quantity, date, reason (Spoiled, Damaged or Used), optional note, a Cancel button and a "Save stock out" button
- [x] Both forms show the chosen product's current stock and minimum next to the form
- [x] Missing product, missing reason, or a quantity that is not a whole number of 1 or more shows an error and keeps what was typed
- [x] Stock out refuses a quantity above the stock left ("Only 12 in stock") and saves nothing
- [x] A success message shows the product's new stock level
- [x] Stock in that brings a product back to its minimum or above resolves its low-stock alert
- [x] Stock out that drops a product below its minimum creates the alert and shows the amber low-stock warning
- [x] Each change is saved as a 'stock_in' or 'stock_out' movement (with the reason for stock out)
- [x] "Stock in" and "Stock out" are in the manager menu; an employee cannot open either page or call either function
- [x] Works on the live URL
