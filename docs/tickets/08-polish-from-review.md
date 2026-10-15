# 08 — Polish from the code review

**What to build:** Fix the four things the code review found that a real user would notice: the low-stock warning can be skipped with the Escape key, a failed save looks like a success, the manager's sidebar breaks on a phone, and the manager Dashboard is missing the inventory columns and alerts panel the spec asks for. No new features.

**Blocked by:** 07

**Status:** todo

- [ ] Pressing Escape on a receipt that has a low-stock warning waiting shows the warning instead of closing everything
- [ ] If deactivating a product fails, the manager sees an error message, not "Product deactivated"
- [ ] If flagging or resolving a low-stock alert fails, the manager sees an error message and the list is unchanged
- [ ] On a phone-width screen the manager menu sits above the page content instead of squeezing it, and the top bar wraps
- [ ] The menu has no unused "(soon)" branch
- [ ] The manager Dashboard's product table shows the Minimum column and an Edit link on each row
- [ ] The manager Dashboard shows a panel of the open and flagged alerts
- [ ] The employee Dashboard is unchanged
- [ ] Works on the live URL
