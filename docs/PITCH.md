# Pitch — StockWise (Nexora Order & Stock Tracker)

> Every number below comes from `docs/PROBLEM.md` and was reported by
> Jeremiah and the manager. Say "we were told", not "we measured". If you
> have two presenters, split it as beats 1–2 / beats 3–5.

## The script (about 3 minutes, spoken)

### 1. The person
Meet Jeremiah. He works the counter at Nexora's Ortiz branch. On a normal
day he takes fifty to seventy orders. On a busy day, a hundred or more.
Every one goes into a notebook, by hand, while the customer waits in the
queue.

### 2. Today
Later, he types those orders again into an Excel file to update the
stock. Two steps that never talk to each other. We were told each order
costs two to five minutes. Notebook entries go missing. The stock count
drifts away from the shelf. And the manager finds out a product is
running out too late. Then orders get declined, about twenty-five pesos
lost each time. Jeremiah says it happens many times.

### 3. Our fix
We built StockWise. In one sentence: staff tap the products in a
customer's order, record the payment, and give a receipt, and the stock
drops by itself. When a product falls below its minimum, it shows up on a
running low list, so the manager can restock before it runs out.

We asked Jeremiah about a Google Sheet with formulas. He said it is too
complicated to set up and keep working. So we built something simple, for
one branch.

### 4. The demo moment
Now we show it live. We sign in. We add a product. We take an order and
show the receipt. We watch the stock number drop. Then we see the product
appear on the running low list.

### 5. How we will know
Jeremiah will try it at the counter. We will time one order in the app
and compare it to today's two to five minutes. We will also check the
screen's stock count against the shelf. If the order is faster and the
count matches, it worked.

*(About 330 words.)*

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
