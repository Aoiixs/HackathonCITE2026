import { AddProductButton } from "./add-product-button";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProductsList, type Product } from "./products-list";
import { Toast } from "@/components/toast";
import { PageLabel } from "@/components/page-label";

const SAVED_MESSAGES: Record<string, string> = {
  added: "Product added.",
  updated: "Product updated.",
  adjusted: "Stock adjusted.",
  deactivated: "Product deactivated.",
};

const FAILED_MESSAGES: Record<string, string> = {
  deactivate: "Could not deactivate the product. Nothing was changed.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string;
    failed?: string;
  }>;
}) {
  await requireManager(); // an employee is sent back to the Dashboard

  const { saved, failed } = await searchParams;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, category, price, current_stock, minimum_stock, is_active")
    .order("name");
  if (error) console.error("Could not load products:", error.message);

  const all = (data ?? []) as Product[];
  const categories = [...new Set(all.map((p) => p.category))].sort();

  return (
    <div className="flex flex-col gap-6">
      {saved && SAVED_MESSAGES[saved] && <Toast message={SAVED_MESSAGES[saved]} />}
      {failed && FAILED_MESSAGES[failed] && (
        <Toast message={FAILED_MESSAGES[failed]} tone="error" />
      )}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <PageLabel>Manage products</PageLabel>
          <h1 className="text-3xl font-semibold tracking-tight">Manage products</h1>
          <p className="text-muted-foreground">
            Add, edit and switch off the products you sell.
          </p>
        </div>
        <AddProductButton categories={categories} />
      </header>

      <ProductsList products={all} categories={categories} />
    </div>
  );
}
