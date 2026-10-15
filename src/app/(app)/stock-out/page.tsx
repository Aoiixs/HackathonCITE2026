import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { todayManila } from "@/lib/time";
import { recordStockOut } from "../stock/actions";
import { StockForm, type StockProduct } from "../stock/stock-form";

export default async function StockOutPage() {
  await requireManager(); // an employee is sent back to the Dashboard

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, current_stock, minimum_stock")
    .eq("is_active", true)
    .order("name");
  if (error) console.error("Could not load products:", error.message);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Stock out</h1>
        <p className="text-muted-foreground">
          Record products lost to spoilage or damage, or used in the kitchen.
          Sales are recorded automatically, so don&apos;t enter them here.
        </p>
      </header>
      <StockForm
        mode="out"
        action={recordStockOut}
        products={(data ?? []) as StockProduct[]}
        today={todayManila()}
      />
    </div>
  );
}
