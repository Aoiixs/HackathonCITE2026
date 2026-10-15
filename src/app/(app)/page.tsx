import Link from "next/link";
import { getStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatPeso } from "@/lib/format";
import { formatManila, startOfTodayManila } from "@/lib/time";
import { getLowStockAlerts, getLowStockCount } from "@/lib/low-stock";
import { StockStatusPill } from "@/components/status-pill";
import { LowStockBadge } from "@/components/low-stock-badge";
import {
  Banknote,
  Boxes,
  ChartColumn,
  Package,
  Receipt,
  ShoppingCart,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLabel } from "@/components/page-label";

// A card title with a small icon in front. The icon is decoration only
// (aria-hidden), so screen readers still hear just the words.
function IconTitle({
  icon: Icon,
  muted = false,
  children,
}: {
  icon: LucideIcon;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <CardTitle
      className={cn(
        "flex items-center gap-2",
        muted && "text-base text-muted-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {children}
    </CardTitle>
  );
}

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  current_stock: number;
  minimum_stock: number;
};

type Sale = { receipt_number: string; total_amount: number; created_at: string };

export default async function DashboardPage() {
  // Every signed-in page checks for itself; see getStaff() for why.
  const staff = await getStaff();
  const isManager = staff.role === "manager";

  // Row Level Security does the scoping: an employee's queries only ever
  // return their own sales, a manager's return everyone's. The same code
  // serves both, and the database decides what each person may see.
  const supabase = await createClient();
  const [productsResult, todayResult, recentResult, lowStockAlerts, lowStockCount] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, category, price, current_stock, minimum_stock")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("sales")
      .select("total_amount")
      .eq("status", "completed")
      .gte("created_at", startOfTodayManila()),
    supabase
      .from("sales")
      .select("receipt_number, total_amount, created_at")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(5),
    getLowStockAlerts(),
    getLowStockCount(),
  ]);

  const products = (productsResult.data ?? []) as Product[];
  const todaySales = (todayResult.data ?? []) as { total_amount: number }[];
  const recent = (recentResult.data ?? []) as Sale[];
  const todayCents = todaySales.reduce(
    (sum, s) => sum + Math.round(Number(s.total_amount) * 100),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <PageLabel>Dashboard</PageLabel>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome, {staff.fullName}. You are signed in as{" "}
            {isManager ? "the manager" : "an employee"}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LowStockBadge />
          {!isManager && (
            <Link
              href="/history"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              <ChartColumn className="size-4" aria-hidden="true" />
              History
            </Link>
          )}
          {!isManager && (
            <Link href="/sales/new" className={buttonVariants({ size: "lg" })}>
              <ShoppingCart className="size-4" aria-hidden="true" />
              New sale
            </Link>
          )}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <IconTitle icon={Banknote} muted>
              {isManager ? "Sales today (all staff)" : "Your sales today"}
            </IconTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {formatPeso(todayCents / 100)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <IconTitle icon={Receipt} muted>
              {isManager ? "Orders today (all staff)" : "Your orders today"}
            </IconTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {todaySales.length}
          </CardContent>
        </Card>
        <Card className={lowStockCount > 0 ? "border-[#e9b949]" : undefined}>
          <CardHeader>
            <IconTitle icon={TriangleAlert} muted>
              Low-stock items
            </IconTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {lowStockCount}
          </CardContent>
        </Card>
        {isManager && (
          <Card>
            <CardHeader>
              <IconTitle icon={Boxes} muted>
                Active products
              </IconTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">
              {products.length}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <IconTitle icon={Package}>Products</IconTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            {/* table-fixed + <colgroup>: set column widths, so headers and
                cells line up exactly. */}
            <table
              className={cn(
                "w-full table-fixed text-left text-sm",
                isManager ? "min-w-[760px]" : "min-w-[560px]",
              )}
            >
              <colgroup>
                {isManager ? (
                  <>
                    <col className="w-[22%]" />
                    <col className="w-[16%]" />
                    <col className="w-[12%]" />
                    <col className="w-[10%]" />
                    <col className="w-[12%]" />
                    <col className="w-[14%]" />
                    <col className="w-[14%]" />
                  </>
                ) : (
                  <>
                    <col className="w-[30%]" />
                    <col className="w-[22%]" />
                    <col className="w-[16%]" />
                    <col className="w-[14%]" />
                    <col className="w-[18%]" />
                  </>
                )}
              </colgroup>
              <thead className="border-y border-divider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 text-right font-medium">Stock</th>
                  {isManager && (
                    <th className="px-4 py-3 text-right font-medium">Minimum</th>
                  )}
                  <th className="px-4 py-3 font-medium">Status</th>
                  {isManager && (
                    <th className="px-4 py-3 text-center font-medium">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-divider last:border-0">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3">{p.category}</td>
                    <td className="px-4 py-3 text-right">{formatPeso(p.price)}</td>
                    <td className="px-4 py-3 text-right">{p.current_stock}</td>
                    {isManager && (
                      <td className="px-4 py-3 text-right">{p.minimum_stock}</td>
                    )}
                    <td className="px-4 py-3">
                      <StockStatusPill low={p.current_stock < p.minimum_stock} />
                    </td>
                    {isManager && (
                      <td className="px-4 py-2 text-center">
                        <Link
                          href={`/products/${p.id}/edit`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          Edit
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td
                      colSpan={isManager ? 7 : 5}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No active products yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
        {isManager && (
          <Card className="h-fit">
            <CardHeader>
              <IconTitle icon={TriangleAlert}>Open alerts</IconTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {lowStockAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing is running low.
                </p>
              ) : (
                <ul className="flex flex-col gap-3 text-sm">
                  {lowStockAlerts.slice(0, 5).map((a) => (
                    <li key={a.id} className="flex justify-between gap-3">
                      <span className="flex flex-col">
                        <span className="font-medium">{a.product.name}</span>
                        <span className="text-muted-foreground">
                          {a.status === "flagged" ? "Flagged for restocking" : "Open"}
                        </span>
                      </span>
                      <span className="font-semibold text-[#8a5a0b]">
                        {a.product.currentStock} / {a.product.minimumStock}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/low-stock"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Manage alerts
              </Link>
            </CardContent>
          </Card>
        )}

        <Card className="h-fit">
          <CardHeader>
            <IconTitle icon={Receipt}>
              {isManager ? "Latest 5 sales" : "Your latest 5 sales"}
            </IconTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales yet.</p>
            ) : (
              <ul className="flex flex-col gap-3 text-sm">
                {recent.map((s) => (
                  <li key={s.receipt_number} className="flex justify-between gap-3">
                    <span className="flex flex-col">
                      <span className="font-mono">{s.receipt_number}</span>
                      <span className="text-muted-foreground">
                        {formatManila(s.created_at)}
                      </span>
                    </span>
                    <span className="font-medium">{formatPeso(s.total_amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
