# 04 — Manage products (manager)

**What to build:** The manager can add, edit, and deactivate products. A new product with a starting stock records an 'initial' stock movement. Nobody, not even the manager, can change a product's stock by editing it.

**Blocked by:** 03

**Status:** todo

- [ ] The `products` and `inventory_movements` tables exist as in the spec, with Row Level Security on and explicit policies, created from numbered files in `supabase/sql/`
- [ ] The Manage products screen lists products with search, a category filter, and an Active / Inactive filter
- [ ] "Add product" takes name, category, price, starting stock, and minimum stock, shows validation errors for missing or invalid fields, and shows a success toast
- [ ] A product with a starting stock creates an 'initial' movement
- [ ] Two active products cannot share the same name (ignoring capital letters)
- [ ] "Edit" changes name, category, price, and minimum stock, but not stock
- [ ] "Deactivate" asks for confirmation and hides the product from the active list; nothing is deleted
- [ ] An employee cannot open Manage products or change products
- [ ] Stock cannot be changed by a direct update from the app, and this is enforced in the database
- [ ] Every policy on these tables allows only staff whose profile has `is_active = true`; a deactivated user is refused even with a login that still works
- [ ] Works on the live URL
