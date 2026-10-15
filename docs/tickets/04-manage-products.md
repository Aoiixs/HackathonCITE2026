# 04 — Manage products (manager)

**What to build:** The manager can add, edit, and deactivate products. A new product with a starting stock records an 'initial' stock movement. Nobody, not even the manager, can change a product's stock by editing it.

**Blocked by:** 03

**Status:** done

- [x] The `products` and `inventory_movements` tables exist as in the spec, with Row Level Security on and explicit policies, created from numbered files in `supabase/sql/`
- [x] The Manage products screen lists products with search, a category filter, and an Active / Inactive filter
- [x] "Add product" takes name, category, price, starting stock, and minimum stock, shows validation errors for missing or invalid fields, and shows a success toast
- [x] A product with a starting stock creates an 'initial' movement
- [x] Two active products cannot share the same name (ignoring capital letters)
- [x] "Edit" changes name, category, price, and minimum stock, but not stock
- [x] "Deactivate" asks for confirmation and hides the product from the active list; nothing is deleted
- [x] An employee cannot open Manage products or change products
- [x] Stock cannot be changed by a direct update from the app, and this is enforced in the database
- [x] Every policy on these tables allows only staff whose profile has `is_active = true`; a deactivated user is refused even with a login that still works
- [x] Works on the live URL
