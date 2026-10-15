# 13 — Loading states on every page

**What to build:** Every page, for the manager and for the employee, shows a placeholder shaped like the page while it loads, instead of a blank screen or a frozen-looking click. Buttons that save something show that they are working and can't be pressed twice. No change to what anything does.

**Blocked by:** 12

**Status:** done

- [x] Every page in the signed-in app has a loading placeholder shaped like the page: Dashboard, New sale, Manage products (list and edit; Add product is now a pop-up, so it needs none), Manage Stocks, Low stock, History & reports, and a reopened receipt
- [x] The Sign in page has one too
- [x] Applying a filter, opening a link, and loading more rows each show the placeholder at once
- [x] The placeholders are announced to screen readers as "Loading…" and the grey blocks are hidden from them
- [x] Log out, Deactivate, Flag for restocking and Mark resolved show a "working" label while they run and cannot be pressed a second time
- [x] The buttons that already showed a working label (Sign in, Confirm order, Save, Adjust stock) are unchanged
- [x] Nothing jumps or breaks at phone width
- [x] Works on the live URL
