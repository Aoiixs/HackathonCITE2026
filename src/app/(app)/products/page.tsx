import { AddProductButton } from "./add-product-button";
import Link from "next/link";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdjustStockButton } from "./adjust-stock-button";
import { ActivePill } from "@/components/status-pill";
import { FilterForm } from "@/components/filter-form";
import { DeactivateButton } from "./deactivate-button";
import { Toast } from "@/components/toast";
import { PageLabel } from "@/components/page-label";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  current_stock: number;
  minimum_stock: number;
  is_active: boolean;
};

const SAVED_MESSAGES: Record<string, string> = {
  added: "Product added.",
  updated: "Product updated.",
  adjusted: "Stock adjusted.",
  deactivated: "Product deactivated.",
};

const FAILED_MESSAGES: Record<string, string> = {
  deactivate: "Could not deactivate the product. Nothing was changed.",
};

const selectClass =
  "flex h-10 w-full rounded-[var(--radius)] border border-input bg-card px-3 py-2 text-base md:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    status?: string;
    saved?: string;
    failed?: string;
  }>;
}) {
  await requireManager(); // an employee is sent back to the Dashboard

  const {
    q = "",
    category = "",
    status = "active",
    saved,
    failed,
  } = await searchParams;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, category, price, current_stock, minimum_stock, is_active")
    .order("name");
  if (error) console.error("Could not load products:", error.message);

  const all = (data ?? []) as Product[];
  const categories = [...new Set(all.map((p) => p.category))].sort();
  const needle = q.trim().toLowerCase();

  const rows = all.filter(
    (p) =>
      (!needle || p.name.toLowerCase().includes(needle)) &&
      (!category || p.category === category) &&
      (status === "all" || (status === "inactive" ? !p.is_active : p.is_active)),
  );

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

      {/* A plain form that reloads the page with ?q=&category=&status= in
          the address (it submits itself when a dropdown changes). */}
      <FilterForm>
        <div className="flex flex-col gap-2">
          <Label htmlFor="q">Search</Label>
          <Input id="q" name="q" defaultValue={q} placeholder="Product name" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="category">Category</Label>
          <select id="category" name="category" defaultValue={category} className={selectClass}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status" defaultValue={status} className={selectClass}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All</option>
          </select>
        </div>
      </FilterForm>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {/* table-fixed + <colgroup>: every column has a set width, so the
              headers and the cells under them line up exactly. */}
          <table className="w-full min-w-[1150px] table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-[14%]" />
              <col className="w-[11%]" />
              <col className="w-[9%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[26%]" />
            </colgroup>
            <thead className="border-b border-divider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-right font-medium">Stock</th>
                <th className="px-4 py-3 text-right font-medium">Minimum</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-divider last:border-0">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3">{p.category}</td>
                  <td className="px-4 py-3 text-right">{peso.format(Number(p.price))}</td>
                  <td className="px-4 py-3 text-right">{p.current_stock}</td>
                  <td className="px-4 py-3 text-right">{p.minimum_stock}</td>
                  <td className="px-4 py-3">
                    <ActivePill active={p.is_active} />
                  </td>
                  <td className="px-4 py-2">
                    {/* The buttons sit in a div: making the <td> itself
                        flex would pull it out of the table's columns. */}
                    <div className="flex flex-nowrap items-center justify-center gap-2 whitespace-nowrap">
                    <Link
                      href={`/products/${p.id}/edit`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Edit
                    </Link>
                    {p.is_active && (
                      <AdjustStockButton
                        productId={p.id}
                        productName={p.name}
                        currentStock={p.current_stock}
                      />
                    )}
                    {p.is_active && (
                      <DeactivateButton productId={p.id} productName={p.name} />
                    )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    {all.length === 0
                      ? "No products yet. Add your first one."
                      : "No products match these filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
