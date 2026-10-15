import Link from "next/link";
import { PackageMinus, PackagePlus } from "lucide-react";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { todayManila } from "@/lib/time";
import { cn } from "@/lib/utils";
import { recordStockIn, recordStockOut } from "./actions";
import { StockForm, type StockProduct } from "./stock-form";

export default async function ManageStocksPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  await requireManager(); // an employee is sent back to the Dashboard

  // "?mode=out" shows Stock out; anything else shows Stock in.
  const { mode: requested } = await searchParams;
  const mode = requested === "out" ? "out" : "in";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, current_stock, minimum_stock")
    .eq("is_active", true)
    .order("name");
  if (error) console.error("Could not load products:", error.message);

  const options = [
    { value: "in", label: "Stock in", icon: PackagePlus },
    { value: "out", label: "Stock out", icon: PackageMinus },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Manage Stocks</h1>
        <p className="text-muted-foreground">
          {mode === "in"
            ? "Record products that arrived, such as a delivery."
            : "Record products lost to spoilage or damage, or used in the kitchen. Sales are recorded automatically, so don't enter them here."}
        </p>
      </header>

      <nav aria-label="Stock option" className="flex gap-2">
        {options.map(({ value, label, icon: Icon }) => (
          <Link
            key={value}
            href={`/stock?mode=${value}`}
            aria-current={mode === value ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-medium",
              mode === value
                ? "bg-primary text-primary-foreground"
                : "hover:bg-secondary",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>

      {/* key={mode} gives each option its own fresh form, so switching never
          carries what was typed in one into the other. */}
      <StockForm
        key={mode}
        mode={mode}
        action={mode === "in" ? recordStockIn : recordStockOut}
        products={(data ?? []) as StockProduct[]}
        today={todayManila()}
      />
    </div>
  );
}
