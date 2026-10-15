import Link from "next/link";
import { getStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatPeso } from "@/lib/format";
import { formatManila, startOfTodayManila } from "@/lib/time";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const [productsResult, todayResult, recentResult] = await Promise.all([
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
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome, {staff.fullName}. You are signed in as{" "}
            {isManager ? "the manager" : "an employee"}.
          </p>
        </div>
        <Link href="/sales/new" className={buttonVariants({ size: "lg" })}>
          New sale
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">
              {isManager ? "Sales today (all staff)" : "Your sales today"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {formatPeso(todayCents / 100)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">
              {isManager ? "Orders today (all staff)" : "Your orders today"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {todaySales.length}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-border text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 text-right font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3">{p.category}</td>
                    <td className="px-4 py-3 text-right">{formatPeso(p.price)}</td>
                    <td className="px-4 py-3 text-right">{p.current_stock}</td>
                    <td className="px-4 py-3">
                      {p.current_stock < p.minimum_stock ? (
                        <span className="font-medium text-amber-700">Low stock</span>
                      ) : (
                        "In stock"
                      )}
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No active products yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>
              {isManager ? "Latest 5 sales" : "Your latest 5 sales"}
            </CardTitle>
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
  );
}
