# 07 — Adjust stock and demo check

**First to drop if demo day gets tight.** Nothing else depends on this ticket, and the demo path works without the manager's stock-adjust action.

**What to build:** The manager can correct a miscount by entering the counted stock and a note. Then the team runs the whole "Done for the demo" checklist on the live URL and fixes whatever fails.

**Blocked by:** 06

**Status:** done

- [x] "Adjust stock" on Manage products takes the counted stock and a required note, and saves through the `adjust_stock` function (manager only)
- [x] An adjustment writes an 'adjustment' movement with the difference and re-checks the product's alert
- [x] An employee cannot adjust stock
- [x] Every item in the "Done for the demo" checklist in `docs/SPEC.md` passes on the live URL, signed in as both roles
- [x] `adjust_stock` allows only an active manager
- [x] A signed-out visitor sees nothing, an employee cannot reach Manage products, and a deactivated staff member is refused everywhere
- [x] Works on the live URL
