import { getStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  eachDay,
  firstOfMonthManila,
  formatDateOnly,
  isValidDate,
  manilaDateOf,
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

  const [salesResult, movementsResult, soldResult, productsResult] = await Promise.all([
    supabase
      .from("sales")
      .select("id, receipt_number, created_at, total_amount, payment_method, status, profiles(full_name)")
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: false })
      .limit(5000),
    movementQuery,
    supabase
      .from("sale_items")
      .select("product_name, quantity, sales!inner(created_at, status)")
      .gte("sales.created_at", start)
      .lt("sales.created_at", end)
      .eq("sales.status", "completed")
      .limit(5000),
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

  // Card 1: totals and one bar per day. Voided sales never count.
  const completed = sales.filter((s) => s.status === "completed");
  const totalCents = completed.reduce(
    (sum, s) => sum + Math.round(Number(s.total_amount) * 100),
    0,
  );
  const centsByDay = new Map<string, number>();
  for (const s of completed) {
    const day = manilaDateOf(s.created_at);
    centsByDay.set(day, (centsByDay.get(day) ?? 0) + Math.round(Number(s.total_amount) * 100));
  }
  const days = eachDay(from, to).slice(-CHART_DAYS);
  const daily = days.map((date) => ({ date, cents: centsByDay.get(date) ?? 0 }));

  // Card 2: the four best sellers.
  const soldByProduct = new Map<string, number>();
  for (const item of (soldResult.data ?? []) as { product_name: string; quantity: number }[]) {
    soldByProduct.set(item.product_name, (soldByProduct.get(item.product_name) ?? 0) + item.quantity);
  }
  const topSellers = [...soldByProduct.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 4);

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

  const saleRows: SaleRow[] = sales.slice(0, SALES_SHOWN).map((s) => ({
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

      <SummaryCards
        mine={mine}
        totalCents={totalCents}
        orders={completed.length}
        daily={daily}
        today={today}
        topSellers={topSellers}
        lowProducts={lowProducts}
      />

      <MovementHistory
        filters={{ from, to, product, type }}
        today={today}
        products={allProducts.map((p) => ({ id: p.id, name: p.name, inactive: !p.is_active }))}
        movements={movements}
        hasMore={movementRows.length > shown}
        shown={shown}
        pageSize={PAGE_SIZE}
      />

      <SalesList mine={mine} sales={saleRows} shown={SALES_SHOWN} total={sales.length} />
    </div>
  );
}
