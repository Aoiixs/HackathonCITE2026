import Link from "next/link";
import { getStaff } from "@/lib/auth";
import { getLowStockAlerts } from "@/lib/low-stock";
import { createClient } from "@/lib/supabase/server";
import { formatPeso } from "@/lib/format";
import {
  daysAgoManila,
  formatDateOnly,
  formatManila,
  isValidDate,
  manilaDayStart,
  manilaNextDayStart,
  todayManila,
} from "@/lib/time";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  sale: "Sale",
  stock_in: "Stock in",
  stock_out: "Stock out",
  adjustment: "Adjustment",
  initial: "Initial",
  void: "Void",
};

const SALES_SHOWN = 100;
const MOVEMENTS_SHOWN = 300;

const selectClass =
  "flex h-10 w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-base md:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type Person = { full_name: string } | { full_name: string }[] | null;
const nameOf = (p: Person) =>
  (Array.isArray(p) ? p[0]?.full_name : p?.full_name) ?? "Unknown";

type SaleRow = {
  id: string;
  receipt_number: string;
  created_at: string;
  total_amount: number;
  payment_method: string;
  status: "completed" | "voided";
  profiles: Person;
};

type MovementRow = {
  id: string;
  movement_type: string;
  quantity_change: number;
  remaining_stock: number;
  reason: string | null;
  note: string | null;
  movement_date: string;
  products: { name: string } | { name: string }[] | null;
  profiles: Person;
};

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; product?: string; type?: string }>;
}) {
  const staff = await getStaff();
  const isManager = staff.role === "manager";
  const mine = isManager ? "" : "Your ";

  // Read the filters from the address; anything odd falls back to a default.
  const sp = await searchParams;
  let from = sp.from && isValidDate(sp.from) ? sp.from : daysAgoManila(6);
  let to = sp.to && isValidDate(sp.to) ? sp.to : todayManila();
  if (from > to) [from, to] = [to, from];
  const productId = /^[0-9a-f-]{36}$/i.test(sp.product ?? "") ? sp.product! : "";
  const type = sp.type && TYPE_LABELS[sp.type] ? sp.type : "";
  const start = manilaDayStart(from);
  const end = manilaNextDayStart(to);

  // Row Level Security decides what each person may see: a manager's
  // queries return everyone's rows, an employee's only their own.
  const supabase = await createClient();
  let movementQuery = supabase
    .from("inventory_movements")
    .select(
      "id, movement_type, quantity_change, remaining_stock, reason, note, movement_date, products(name), profiles(full_name)",
    )
    .gte("movement_date", from)
    .lte("movement_date", to)
    .order("created_at", { ascending: false })
    .limit(MOVEMENTS_SHOWN + 1);
  if (productId) movementQuery = movementQuery.eq("product_id", productId);
  if (type) movementQuery = movementQuery.eq("movement_type", type);

  const [salesResult, movementsResult, soldResult, productsResult, alerts] =
    await Promise.all([
      supabase
        .from("sales")
        .select("id, receipt_number, created_at, total_amount, payment_method, status, profiles(full_name)")
        .gte("created_at", start)
        .lt("created_at", end)
        .order("created_at", { ascending: false })
        .limit(1000),
      movementQuery,
      supabase
        .from("sale_items")
        .select("product_name, quantity, sales!inner(created_at, status)")
        .gte("sales.created_at", start)
        .lt("sales.created_at", end)
        .eq("sales.status", "completed")
        .limit(5000),
      supabase.from("products").select("id, name").order("name"),
      getLowStockAlerts(),
    ]);

  const sales = (salesResult.data ?? []) as SaleRow[];
  const movements = (movementsResult.data ?? []) as MovementRow[];
  const products = (productsResult.data ?? []) as { id: string; name: string }[];

  // Summary. Voided sales never count toward the totals.
  const completed = sales.filter((s) => s.status === "completed");
  const totalCents = completed.reduce(
    (sum, s) => sum + Math.round(Number(s.total_amount) * 100),
    0,
  );
  const soldByProduct = new Map<string, number>();
  for (const item of (soldResult.data ?? []) as { product_name: string; quantity: number }[]) {
    soldByProduct.set(
      item.product_name,
      (soldByProduct.get(item.product_name) ?? 0) + item.quantity,
    );
  }
  const topSellers = [...soldByProduct.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">History &amp; reports</h1>
        <p className="text-muted-foreground">
          {formatDateOnly(from)} to {formatDateOnly(to)}
          {!isManager && " · only your own records"}
        </p>
      </header>

      {/* A plain form that reloads the page with the filters in the address. */}
      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="from">From</Label>
          <Input id="from" name="from" type="date" max={todayManila()} defaultValue={from} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="to">To</Label>
          <Input id="to" name="to" type="date" max={todayManila()} defaultValue={to} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="product">Product (stock movements)</Label>
          <select id="product" name="product" defaultValue={productId} className={selectClass}>
            <option value="">All products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="type">Type (stock movements)</Label>
          <select id="type" name="type" defaultValue={type} className={selectClass}>
            <option value="">All types</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="secondary">
          Apply
        </Button>
        <Link href="/history" className={buttonVariants({ variant: "ghost" })}>
          Reset
        </Link>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title={`${mine}total sales`} value={formatPeso(totalCents / 100)} />
        <Stat title={`${mine}number of sales`} value={String(completed.length)} />
        <Stat title="Running low now" value={String(alerts.length)} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">Most sold products</CardTitle>
          </CardHeader>
          <CardContent>
            {topSellers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales in these dates.</p>
            ) : (
              <ol className="flex flex-col gap-1 text-sm">
                {topSellers.map(([name, quantity]) => (
                  <li key={name} className="flex justify-between gap-3">
                    <span>{name}</span>
                    <span className="font-semibold">{quantity}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">{mine}Sales</h2>
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Receipt</th>
                  <th className="px-4 py-3 font-medium">Date and time</th>
                  <th className="px-4 py-3 font-medium">Cashier</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sales.slice(0, SALES_SHOWN).map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono">{s.receipt_number}</td>
                    <td className="px-4 py-3">{formatManila(s.created_at)}</td>
                    <td className="px-4 py-3">{nameOf(s.profiles)}</td>
                    <td className="px-4 py-3 text-right">{formatPeso(s.total_amount)}</td>
                    <td className="px-4 py-3 capitalize">{s.payment_method}</td>
                    <td className={cn("px-4 py-3", s.status === "voided" && "text-destructive")}>
                      {s.status === "voided" ? "Voided" : "Completed"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/history/sales/${s.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Receipt
                      </Link>
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No sales in these dates.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
        {sales.length > SALES_SHOWN && (
          <p className="text-sm text-muted-foreground">
            Showing the latest {SALES_SHOWN} of {sales.length} sales. Narrow the dates to see others.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">{mine}Stock movements</h2>
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 text-right font-medium">Change</th>
                  <th className="px-4 py-3 text-right font-medium">Remaining</th>
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Reason or note</th>
                </tr>
              </thead>
              <tbody>
                {movements.slice(0, MOVEMENTS_SHOWN).map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">{formatDateOnly(m.movement_date)}</td>
                    <td className="px-4 py-3 font-medium">
                      {(Array.isArray(m.products) ? m.products[0]?.name : m.products?.name) ?? "Unknown"}
                    </td>
                    <td className="px-4 py-3">{TYPE_LABELS[m.movement_type] ?? m.movement_type}</td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-semibold",
                        m.quantity_change < 0 ? "text-destructive" : "text-green-700",
                      )}
                    >
                      {m.quantity_change > 0 ? "+" : ""}
                      {m.quantity_change}
                    </td>
                    <td className="px-4 py-3 text-right">{m.remaining_stock}</td>
                    <td className="px-4 py-3">{nameOf(m.profiles)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {[m.reason && m.reason[0].toUpperCase() + m.reason.slice(1), m.note]
                        .filter(Boolean)
                        .join(": ") || "—"}
                    </td>
                  </tr>
                ))}
                {movements.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No stock movements match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
        {movements.length > MOVEMENTS_SHOWN && (
          <p className="text-sm text-muted-foreground">
            Showing the latest {MOVEMENTS_SHOWN} movements. Narrow the dates or pick a product to see others.
          </p>
        )}
      </section>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-3xl font-semibold">{value}</CardContent>
    </Card>
  );
}
