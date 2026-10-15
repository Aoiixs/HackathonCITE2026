# 07 — Adjust stock and demo check

**First to drop if demo day gets tight.** Nothing else depends on this ticket, and the demo path works without the manager's stock-adjust action.

**What to build:** The manager can correct a miscount by entering the counted stock and a note. Then the team runs the whole "Done for the demo" checklist on the live URL and fixes whatever fails.

**Blocked by:** 06

**Status:** todo

- [ ] "Adjust stock" on Manage products takes the counted stock and a required note, and saves through the `adjust_stock` function (manager only)
- [ ] An adjustment writes an 'adjustment' movement with the difference and re-checks the product's alert
- [ ] An employee cannot adjust stock
- [ ] Every item in the "Done for the demo" checklist in `docs/SPEC.md` passes on the live URL, signed in as both roles
- [ ] A signed-out visitor sees nothing, and an employee cannot reach Manage products
- [ ] Works on the live URL
