import Link from "next/link";
import { getStaff } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { LowStockBadge } from "@/components/low-stock-badge";
import { PosScreen, type PosProduct } from "./pos-screen";

export default async function NewSalePage() {
  await getStaff(); // signed in and active, or sent away

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, category, price, current_stock, minimum_stock")
    .eq("is_active", true)
    .order("name");
  if (error) console.error("Could not load products:", error.message);

  const products = ((data ?? []) as PosProduct[]).map((p) => ({
    ...p,
    price: Number(p.price),
  }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Employees have no sidebar, so this is their way back. */}
          <Link
            href="/"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            ← Back to dashboard
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">New sale</h1>
        </div>
        <LowStockBadge />
      </header>
      <PosScreen products={products} />
    </div>
  );
}
