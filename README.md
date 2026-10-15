# StockWise — Nexora Order & Stock Tracker

**Live URL:** https://hackathon-cite-2026.vercel.app

StockWise is an order and stock tracker for the Nexora food business, Ortiz
branch. The employee taps the products in a customer's order and gives a
receipt, the stock drops by itself, and the manager is warned before a
product runs out.

Built from the PHINMA AI Builder team template: Next.js (App Router) and
TypeScript, Tailwind CSS, Supabase (database and login) and Vercel (hosting).

## The two roles

- **Employee** — the only role that sells. Takes orders with **New sale**,
  gives receipts, sees their own sales, and sees the **Low stock** list
  (view only).
- **Manager** — does not sell. Manages products, records stock in and stock
  out, recounts stock, flags and resolves low-stock alerts, and sees every
  employee's sales and all reports.

Both sign in with email and password. Accounts are made by the team in
Supabase, and there is no sign-up page.

## Project documents

- [`docs/PROBLEM.md`](docs/PROBLEM.md) — the problem, the person, the MVP cut
- [`docs/PITCH.md`](docs/PITCH.md) — the 10-minute pitch and demo walk-through
- [`docs/SPEC.md`](docs/SPEC.md) — what we are building (screens, data, rules)
- [`docs/LATER.md`](docs/LATER.md) — good ideas that are not in the MVP
- [`docs/tickets/`](docs/tickets/) — one file per ticket

## Run it locally

You need [Node.js](https://nodejs.org) and Git.

```bash
git clone <your repo URL>
cd <your repo>
npm install
```

Create your local settings file from the template (PowerShell, then Git
Bash or macOS/Linux):

```powershell
Copy-Item .env.example .env.local
```

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the two variables below, then start the app:

```bash
npm run dev
```

Open http://localhost:3000. Before pushing, run `npm run build` and
`npm run lint`. `npm run build` is the exact command Vercel runs.

### The two environment variables

The app needs exactly these two, in `.env.local` **and** in Vercel
(**Settings → Environment Variables**, then redeploy):

| Name                            | Where to find it in Supabase                                   |
|---------------------------------|----------------------------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`      | Your project → **Connect** → Project URL                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your project → **Connect** → publishable key (`sb_publishable_…`) |

Never add the `service_role` key or any `sb_secret_` key to this project,
and never commit `.env.local`.

## Set up the database (Supabase)

Use a **hosted** Supabase project (free tier). Do not run Supabase locally.

1. In Supabase, go to **Authentication → Users → Add user** and create one
   manager and one employee (tick **Auto Confirm User**). Turn sign-ups off.
2. Run the files in [`supabase/sql/`](supabase/sql/) **one at a time, in
   this order**: Supabase → **SQL Editor → New query → paste → Run**.

| File | What it does |
|------|--------------|
| `002-create-profiles.sql` | Staff profiles (name, role, active) |
| `003-staff-accounts-and-helpers.sql` | Role helpers, and the profiles for your two accounts |
| `004-create-products.sql` | Products, stock history, `create_product` |
| `005-create-sales.sql` | Sales and receipts |
| `006-create-low-stock-alerts.sql` | Low-stock alerts and the re-check rule |
| `007-adjust-stock.sql` | Manager stock recount |
| `008-stock-in-and-out.sql` | Stock in and stock out |
| `009-managers-read-profiles.sql` | Managers can read all profiles |
| `010-sales-report.sql` | Totals for History & reports |
| `011-low-stock-always-rechecked.sql` | Alerts can never drift from the stock |
| `012-profiles-avatar.sql` | Profile picture column |
| `013-set-sample-avatars.sql` | Optional: give the two accounts a sample picture |
| `015-complete-sale-employees-only.sql` | Only employees can sell (replaces `complete_sale` from 006) |

Things to know:

- **`003` and `013` contain placeholders** for the two emails and names.
  Replace them in the SQL Editor only. Never save real emails into the
  file, and never commit a filled-in version.
- **Skip `001`** (a commented-out example). **Run `005b` only** if a sale
  fails because the sales tables are missing (it repeats the tables from
  005).
- Every table has Row Level Security on, with explicit policies. Stock and
  sales can only change through database functions, never by direct writes.
- There may also be a local-only reset script, `014-clear-business-data.sql`.
  It deletes all products, sales and history, and it is deliberately kept
  out of git. It is not part of setup.

## Demo data (sample data, not real sales)

For a rehearsal or a demo you can fill the app with made-up history. Both
scripts live in [`supabase/seed/`](supabase/seed/) and run in the same SQL
Editor.

- **Load it:** run `demo-data.sql` after the setup above (it needs files
  002 to 010 and one active manager and one active employee). It builds 11
  products and 15 days of sales ending **today** (Manila time), so run it
  on the day you present. Receipts start with `DEMO-`, every sale belongs to
  the employee, and four products end up low on stock. It refuses to run
  twice.
- **Remove it:** run `remove-demo-data.sql`. It removes only the sample
  data. Sales you made yourself, such as rehearsal orders, stay.
- **Never present demo sales as real.**

## Where things live

```
src/app/(app)/            the signed-in screens (dashboard, sales, products, stock, history)
src/app/login/            the Sign in page
src/components/ui/        Button, Card, Input, Textarea, Label
src/lib/supabase/         the database clients, with comments on which to use where
supabase/sql/             every database change, numbered
supabase/seed/            demo data and its remover
docs/                     problem, pitch, spec, later and tickets
CLAUDE.md                 the rules the AI agent follows
```

## The workflow

| Command            | What it does                                      |
|--------------------|---------------------------------------------------|
| `/grill-with-docs` | Interviews you hard about the problem             |
| `/pitch`           | Turns that into your pitch                        |
| `/to-spec`         | Writes the spec for what you will build           |
| `/to-tickets`      | Breaks the spec into small tickets                |
| `/implement`       | Builds one ticket, then deploys it                |
| `/code-review`     | Checks it is correct and safe before you demo     |

The agent will refuse to write feature code before there is a spec. That is
deliberate.

## When something breaks

- **Build fails on Vercel but works locally** — run `npm run build` on
  your laptop. That is the exact command Vercel runs. It will show you
  the same error.
- **Live site cannot reach the database** — your environment variables
  are probably missing in Vercel, or you did not redeploy after adding
  them.
- **`npm audit` shows warnings** — these are in the development
  toolchain only. Ignore them; the "fix" breaks the project.
- **The agent keeps failing at the same thing** — stop it, and ask it to
  explain what it thinks is wrong instead of trying again. Then get a
  facilitator.

## The rules

1. **Deploy first.** Live URL before features.
2. **No spec, no code.**
3. **One user, one job, demoable in three minutes.**
4. **Row Level Security on, always.** Your app is public. Without RLS,
   so is your data.
5. **Never commit `.env.local`.**
