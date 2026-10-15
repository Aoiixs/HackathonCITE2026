# Pitch — StockWise (Nexora Order & Stock Tracker)

> **Ten minutes, with about 30 seconds of buffer.**
> Every number below comes from `docs/PROBLEM.md` and was reported by
> Jeremiah and the manager. Say "we were told", not "we measured". Do not
> say a number you have not been given. The demo sales are made-up sample
> data, and you say so out loud.
>
> Two presenters: one talks and one clicks during the demo. Suggested
> split: Presenter A speaks parts 1, 2, 3, "Why the data is safe" and 5.
> Presenter B drives the two windows in part 4 and speaks "What's next".

## Timing at a glance

| Clock       | Length | Part                         |
|-------------|--------|------------------------------|
| 0:00–0:45   | 0:45   | 1. The person                |
| 0:45–1:25   | 0:40   | 2. Today                     |
| 1:25–2:10   | 0:45   | 3. Our fix                   |
| 2:10–7:10   | 5:00   | 4. The demo moment (live)    |
| 7:10–8:05   | 0:55   | Why the data is safe         |
| 8:05–8:40   | 0:35   | 5. How we will know          |
| 8:40–9:30   | 0:50   | What's next                  |
| 9:30–10:00  | 0:30   | Buffer                       |

In the demo, **DO** is what you click (not spoken) and **SHOW** is what you
say about what the panel sees.

## The script

### 1. The person (0:00–0:45)
Meet Jeremiah. He works the counter at Nexora's Ortiz branch. We were told
that on a normal day he takes fifty to seventy orders. On a busy day, a
hundred to a hundred and twenty. Every order goes into a notebook, by hand,
while the customer waits in the queue. Every number you hear today was told
to us by Jeremiah and the manager.

### 2. Today (0:45–1:25)
Later, he types the same orders again into an Excel file to update the
stock. Two steps that never talk to each other. We were told each order
costs two to five minutes. Notebook entries go missing. The stock count
drifts away from the shelf. The manager finds out too late that a product
is running out. Then orders get declined, about twenty-five pesos lost each
time. Jeremiah says it happens many times.

### 3. Our fix (1:25–2:10)
We built StockWise. In one sentence: the employee taps the products in a
customer's order, records the payment and gives a receipt, and the stock
drops by itself. When a product falls below its minimum, it appears on a
running low list. The manager sees every employee's sales and can restock
before anything runs out.

We asked Jeremiah about a Google Sheet with formulas. He said it is too
complicated to set up and keep working. So we built something simple, for
one branch.

### 4. The demo moment (2:10–7:10, live)
Say first: "Now the live demo. Alex is our employee account. Luegi is our
manager account. This is the live website, not our laptop. Most of the
history you will see is sample data we loaded for the demo. It is not real
sales."

The steps follow the "Done for the demo" list in `docs/SPEC.md`. Use the
Alex window (normal) and the Luegi window (private), both on the live URL
and both signed out at the start.

**Step 1 — Sign in (2:10–2:40)**
- **DO:** In Alex's window, type a wrong password and press Sign in. Then
  type the right one.
- **SHOW:** A wrong password says "Invalid credentials" and keeps us on the
  form. After the right one, Alex, the employee, lands on his Dashboard: a
  big New sale button, his own sales today, and the product list with
  stock.

**Step 2 — The manager adds a product (2:40–3:30)**
- **DO:** In Luegi's window, sign in, open Manage products and click Add
  product. Enter a new product, for example "Leche Flan", category Cakes,
  price 60, starting stock 6, minimum stock 5, and save. Then switch to
  Alex's window and open New sale.
- **SHOW:** The manager adds a product in a pop-up. It is in the list, and
  it is on Alex's New sale screen. We chose a starting stock of six and a
  minimum of five on purpose, so the order in step 5 tips it low.

**Step 3 — The employee takes an order (3:30–4:20)**
- **DO:** As Alex, tap one product that has plenty of stock (check the
  Dashboard first), type an amount received that covers the total, and
  click Confirm order.
- **SHOW:** The receipt appears with a receipt number, the total, the
  amount received and the change, and the line "Stock updated
  automatically". The employee never typed anything twice.

**Step 4 — Stock drops, and no overselling (4:20–5:00)**
- **DO:** As Alex, close the receipt and show the Dashboard stock for that
  product. Then open New sale, tap Leche Flan and press + until the
  quantity goes past 6.
- **SHOW:** The stock went down by itself. Now we try to sell more than we
  have: "Only 6 left in stock" appears on that line, and Confirm order is
  greyed out. Nobody can sell what is not there.

**Step 5 — Low stock (5:00–5:30)**
- **DO:** Set the Leche Flan quantity to 2, enter the amount received,
  Confirm order, then click Continue on the receipt. Close the pop-up and
  open Low stock from the Dashboard.
- **SHOW:** After the receipt, an amber pop-up warns that Leche Flan is now
  below its minimum. It is on the Low stock list. The employee can see it
  but has no buttons to change it.

**Step 6 — The manager flags it (5:30–5:50)**
- **DO:** In Luegi's window, open Low stock and click Flag for restocking
  next to Leche Flan.
- **SHOW:** The status changes to "Flagged for restocking". The manager
  decides when to restock, and the employee cannot change this.

**Step 7 — Employees and visitors are kept out (5:50–6:20)**
- **DO:** In Alex's window, add `/products` to the end of the live URL and
  press Enter. Then click Log out, confirm, and try to open `/history`
  directly.
- **SHOW:** Alex is sent straight back to his Dashboard, because Manage
  products and Manage Stocks are for the manager only. After logging out,
  anyone who is not signed in only ever sees the Sign in page.

**Step 8 — The manager sees everything (6:20–7:10)**
- **DO:** In Luegi's window, open the Dashboard, then History & reports.
  Point at the cards, the sales list and the stock movement history, and
  open one receipt.
- **SHOW:** The manager sees the sales of every employee, on the Dashboard
  and in History and reports, and has no New sale button, because managers
  do not sell. The movement history shows who changed what, with notes.
  Remember: most of this is sample data.

### Why the data is safe (7:10–8:05)
A fair question: is the data safe? Four answers. First, everyone signs in,
and the database knows who is an employee and who is a manager. Second,
every table is protected by Row Level Security. That is a rule inside the
database that decides which rows each person may see. An employee sees only
their own sales. A visitor who is not signed in sees nothing. Third,
employees cannot change stock numbers or delete sales. Nobody can delete a
sale. Every stock change goes through a checked function and is written to
the history. Fourth, the database itself refuses to sell more than the
stock. And no secret key is in our code or in the browser.

### 5. How we will know (8:05–8:40)
Next, Jeremiah will try it at the counter. We will time one order in the
app and compare it to the two to five minutes we were told. We will also
check the screen's stock count against the shelf. If the order is faster
and the count matches, it worked.

### What's next (8:40–9:30)
What comes next, from our Later list. Voiding a wrong sale. Product
pictures. More on the manager's Dashboard itself, like sales by employee and
top sellers. The most sold products already appear in History and reports.
A tablet layout, and cards instead of wide tables on a phone.
GCash and Maya as payment labels. And uploading your own profile picture.
Things we chose not to build: a staff management screen, receipt printing,
offline mode, more than one branch, and real GCash or Maya payments. We
kept the first version small so that it could ship.

## The three hardest questions

**1. "Two to five minutes per order. Did you time that, or is it a guess?"**
This attacks the weakest point: the time figures are reported, not timed.
Honest answer: "Jeremiah and the manager told us. We have not put a
stopwatch on it yet, and that is the first thing we will do with the app:
time one order each way." Before you present, time one real order on
paper with a phone stopwatch.

**2. "Twenty-five pesos per declined order is small. Why does this matter?"**
Honest answer: "On its own, yes. It adds up with volume, and we have not
yet counted how many orders are declined a day. We will ask Jeremiah to
tally them for one day." Do not multiply it into a monthly total unless
you have that count.

**3. "Why not a shared Google Sheet or an existing POS app?"**
Honest answer: "Jeremiah told us a sheet with formulas is too
complicated for him to maintain. Our app deducts stock while the order is
taken and warns the manager. We have not compared existing POS apps."
That last sentence is true; say it rather than bluff.

## More panel questions

**About the demo steps**

- **"Why can't the manager sell?"** "We decided the roles with the team:
  employees only sell, and managers handle everything else. The app
  refuses managers, and so does the database."
- **"What if an order is wrong after you press Confirm?"** "Voiding a sale
  is on our Later list, so it is not built yet. Today the manager can
  correct the stock with a recount and a required note, and the history
  shows it." Do not claim a refund or void feature.
- **"What if the employee presses Confirm twice?"** "The button shows
  'Saving…' and cannot be pressed a second time. The stock check is also
  done inside the database."
- **"Why did you pick that product and that stock level?"** "To show the
  low-stock alert in one order. In real use the manager sets each
  product's minimum."

**About data safety**

- **"Can an employee change stock or delete a sale?"** "No. There is no
  screen for it, and the database refuses it. Stock changes only go
  through checked functions, and every change is written to the history."
- **"What if someone guesses the address of a page?"** "Every page checks
  who you are. A signed-out visitor goes to Sign in, and an employee who
  opens a manager page is sent back to the Dashboard. The database checks
  again on its own."
- **"What happens when a staff member leaves?"** "The team switches the
  account off. A switched-off person cannot sign in, even with the right
  password. There is no staff screen yet; accounts are made by the team."
- **"Where is the data kept?"** "In a hosted Supabase database. The
  website runs on Vercel. Only the public address and the public key are in
  the browser."

**No internet**

- **"What happens if the internet drops?"** "StockWise needs the internet.
  Offline mode is something we chose not to build for now. If the
  connection drops, the shop goes back to the notebook for that time. We
  have not tested how often the branch loses its connection." Say plainly
  that this is a real limit.

**Two employees selling the last item**

- **"What if two employees sell the last one at the same time?"** "The
  database locks the product while it checks the stock. The first sale
  goes through. The second one is refused with a message that the stock is
  gone, and nothing is half-saved." You have one employee account in the
  demo, so say this has not been shown live.

**Is the demo data real?**

- **"Are those sales real?"** "No. They are made-up sample data that we
  loaded with a script for the demo. The receipts start with DEMO and the
  notes say DEMO DATA, and a second script removes all of it. The only real
  numbers we have are the ones Jeremiah and the manager told us."

## Is the evidence thin?
Medium. The person, the routine and the volume are real, and Jeremiah's
views are in his own words. The weak spots are that the time per order is
unmeasured, the number of declined orders is not counted, and "Jeremiah
will try it" is still to be confirmed.

Strengthen it before you present:
- Time one real order on paper, and write the time down.
- Ask Jeremiah how many orders he declines on a typical day.
- Get one quote from Jeremiah in his own words about what annoys him most.
- Confirm a time when he will try the live app.

## Before you present
- **Two windows, same live URL, not localhost.** Use a normal browser
  window for Alex (employee) and a private window for Luegi (manager). Do
  not sign in before the demo, because step 1 shows the Sign in page. Have
  both passwords ready, and check that the two accounts really are named
  Alex and Luegi on screen.
- **Demo data.** Run `supabase/seed/demo-data.sql` on the day you present
  (it builds the 15 days ending today). To start clean instead, run `014` by
  hand. Never say the demo sales are real.
- **Check the starting point of the demo.** There must be no active product
  called "Leche Flan" (use another name if there is one). Before step 3,
  look at the Dashboard and pick a product with plenty of stock, so that
  order does not trigger the low-stock pop-up too early.
- **After every rehearsal, deactivate Leche Flan.** In Manage products,
  click Deactivate next to Leche Flan and confirm. A deactivated product
  frees its name, so you can add Leche Flan again next time. Its rehearsal
  sale stays in History, because history is never deleted.
- **To wipe the rehearsal sales too,** run `014` by hand (it deletes all
  products, sales and history, but keeps the staff accounts), then run
  `demo-data.sql` again. `remove-demo-data.sql` is not enough: it only
  removes the sample data, not your rehearsal sales. Do this on the day you
  present, so the numbers are clean for the panel.
- **Rehearse out loud with a timer, twice.** The demo is the part most
  likely to run over: if you reach step 7 (5:50) more than 30 seconds late,
  skip it and say it is on the checklist. Steps 1 to 6 and 8 are the ones
  that matter.
- **If something fails live, say so and carry on.** A calm "that did not
  work, here is what it should show" is better than a bluff.

## Word count and timing note
- **Spoken words: about 800** (parts 1, 2, 3, the demo SHOW lines, "Why the
  data is safe", 5 and "What's next"). DO lines are clicks, not speech, and
  are not counted.
- At a calm 130 words a minute that is about 6 minutes of talking. The
  other 3½ minutes are for clicking, page loads and pauses in the demo.
- Each part fits its slot in the table at the top, with a little to spare:
  1 is 64 words for 45 seconds, 2 is 73 for 40, 3 is 84 for 45, the demo is
  319 for 5 minutes, "Why the data is safe" is 117 for 55 seconds (the
  tightest), 5 is 50 for 35, and "What's next" is 95 for 50.
- The 450-word limit was for a 3-minute pitch. For 10 minutes the script
  can be longer, but if you rehearse and run over, cut the
  "Why the data is safe" part first and shorten the demo narration, not
  the demo itself.
