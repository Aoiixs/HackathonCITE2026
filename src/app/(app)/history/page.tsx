import { getStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  eachDay,
  firstOfMonthManila,
  formatDateOnly,
  isValidDate,
  manilaDayStart,
  manilaNextDayStart,
  todayManila,
} from "@/lib/time";
import { MovementHistory, type Movement } from "./movement-history";
import { SalesList, type SaleRow } from "./sales-list";
import { SummaryCards } from "./summary-cards";

const PAGE_SIZE = 25;
const SALES_SHOWN = 100;
const CHART_DAYS = 62; // the chart never shows more than this many bars
const MOVEMENT_TYPES = ["sale", "stock_in", "stock_out"];

// The database hands back a joined row either as one object or a list of one.
type Joined<T> = T | T[] | null;
const first = <T,>(value: Joined<T>): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : value;

type SaleQueryRow = {
  id: string;
  receipt_number: string;
  created_at: string;
  total_amount: number;
  payment_method: string;
  status: "completed" | "voided";
  profiles: Joined<{ full_name: string }>;
};

type MovementQueryRow = {
  id: string;
  movement_type: string;
  quantity_change: number;
  remaining_stock: number;
  reason: string | null;
  movement_date: string;
  created_at: string;
  products: Joined<{ name: string; is_active: boolean }>;
  profiles: Joined<{ full_name: string }>;
};

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    product?: string;
    type?: string;
    shown?: string;
  }>;
}) {
  const staff = await getStaff();
  const isManager = staff.role === "manager";
  const mine = isManager ? "" : "Your ";

  // Read the filters from the address; anything odd falls back to a default.
  const sp = await searchParams;
  const today = todayManila();
  let from = sp.from && isValidDate(sp.from) ? sp.from : firstOfMonthManila();
  let to = sp.to && isValidDate(sp.to) ? sp.to : today;
  if (from > to) [from, to] = [to, from];
  const product = /^[0-9a-f-]{36}$/i.test(sp.product ?? "") ? sp.product! : "";
  const type = MOVEMENT_TYPES.includes(sp.type ?? "") ? sp.type! : "";
  const shown = Math.min(Math.max(Number.parseInt(sp.shown ?? "", 10) || PAGE_SIZE, PAGE_SIZE), 500);
  const start = manilaDayStart(from);
  const end = manilaNextDayStart(to);

  // Row Level Security decides what each person may see: a manager's
  // queries return everyone's rows, an employee's only their own.
  const supabase = await createClient();
  let movementQuery = supabase
    .from("inventory_movements")
    .select(
      "id, movement_type, quantity_change, remaining_stock, reason, movement_date, created_at, products(name, is_active), profiles(full_name)",
    )
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: false })
    .limit(shown + 1); // one extra row tells us whether "Load more" is needed
  if (product) movementQuery = movementQuery.eq("product_id", product);
  if (type) movementQuery = movementQuery.eq("movement_type", type);

  const [salesResult, movementsResult, reportResult, productsResult] = await Promise.all([
    // Only the newest rows are fetched for the list; "count" is the exact
    // number of sales in the dates, however many there are.
    supabase
      .from("sales")
      .select(
        "id, receipt_number, created_at, total_amount, payment_method, status, profiles(full_name)",
        { count: "exact" },
      )
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: false })
      .limit(SALES_SHOWN),
    movementQuery,
    // The totals are added up inside the database (see 010-sales-report.sql),
    // not here: Supabase returns at most 1,000 rows per request, so adding
    // up downloaded rows would quietly come out short in a busy month.
    supabase.rpc("sales_report", { p_from: start, p_to: end }),
    // All products, deactivated ones too: history must still name them.
    supabase
      .from("products")
      .select("id, name, current_stock, minimum_stock, is_active")
      .order("name"),
  ]);

  const sales = (salesResult.data ?? []) as SaleQueryRow[];
  const allProducts = (productsResult.data ?? []) as {
    id: string;
    name: string;
    current_stock: number;
    minimum_stock: number;
    is_active: boolean;
  }[];

  // Cards 1 and 2 come from the database's own totals. Voided sales never
  // count. If the totals cannot be loaded we say so, instead of showing
  // zeros that look like "no sales".
  const report = reportResult.error
    ? null
    : (reportResult.data as {
        total: number;
        orders: number;
        daily: { date: string; total: number }[];
        top: { name: string; quantity: number }[];
      });
  if (reportResult.error) {
    console.error("Could not load the sales report:", reportResult.error.message);
  }

  const totalCents = Math.round(Number(report?.total ?? 0) * 100);
  const centsByDay = new Map<string, number>(
    (report?.daily ?? []).map((d) => [d.date, Math.round(Number(d.total) * 100)]),
  );
  // One bar for every day in the range, including days with no sales.
  const daily = eachDay(from, to)
    .slice(-CHART_DAYS)
    .map((date) => ({ date, cents: centsByDay.get(date) ?? 0 }));
  const topSellers: [string, number][] = (report?.top ?? []).map((t) => [t.name, t.quantity]);

  // Card 3: worked out live from today's stock, the same test the Dashboard's
  // product table uses for its "Low stock" tag (active and below minimum).
  const lowProducts = allProducts
    .filter((p) => p.is_active && p.current_stock < p.minimum_stock)
    .map((p) => ({ id: p.id, name: p.name, stock: p.current_stock, minimum: p.minimum_stock }))
    .sort(
      (a, b) =>
        a.stock / Math.max(a.minimum, 1) - b.stock / Math.max(b.minimum, 1) ||
        a.name.localeCompare(b.name),
    );

  const movementRows = (movementsResult.data ?? []) as MovementQueryRow[];
  const movements: Movement[] = movementRows.slice(0, shown).map((m) => ({
    id: m.id,
    createdAt: m.created_at,
    movementDate: m.movement_date,
    productName: first(m.products)?.name ?? "Unknown product",
    productInactive: first(m.products)?.is_active === false,
    type: m.movement_type,
    reason: m.reason,
    change: m.quantity_change,
    remaining: m.remaining_stock,
    employee: first(m.profiles)?.full_name ?? "Unknown",
  }));

  const saleRows: SaleRow[] = sales.map((s) => ({
    id: s.id,
    receiptNumber: s.receipt_number,
    createdAt: s.created_at,
    cashier: first(s.profiles)?.full_name ?? "Unknown",
    total: Number(s.total_amount),
    payment: s.payment_method,
    status: s.status,
  }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">History &amp; reports</h1>
        <p className="text-muted-foreground">
          {formatDateOnly(from)} to {formatDateOnly(to)}
          {!isManager && " · only your own records"}
        </p>
      </header>

      {report ? (
        <SummaryCards
          mine={mine}
          totalCents={totalCents}
          orders={Number(report.orders)}
          daily={daily}
          today={today}
          topSellers={topSellers}
          lowProducts={lowProducts}
        />
      ) : (
        <p role="alert" className="rounded-[var(--radius)] border border-destructive p-4 text-sm font-medium text-destructive">
          The sales totals could not be loaded, so they are not shown. Please
          refresh. If it keeps happening, tell the team.
        </p>
      )}

      <MovementHistory
        filters={{ from, to, product, type }}
        today={today}
        products={allProducts.map((p) => ({ id: p.id, name: p.name, inactive: !p.is_active }))}
        movements={movements}
        hasMore={movementRows.length > shown}
        shown={shown}
        pageSize={PAGE_SIZE}
      />

      <SalesList
        mine={mine}
        sales={saleRows}
        shown={SALES_SHOWN}
        total={salesResult.count ?? saleRows.length}
      />
    </div>
  );
}
