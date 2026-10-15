import { createClient } from "@/lib/supabase/server";

export type LowStockAlert = {
  id: string;
  status: "open" | "flagged";
  createdAt: string;
  product: {
    id: string;
    name: string;
    category: string;
    currentStock: number;
    minimumStock: number;
  };
};

type Row = {
  id: string;
  status: "open" | "flagged";
  created_at: string;
  products: {
    id: string;
    name: string;
    category: string;
    current_stock: number;
    minimum_stock: number;
    is_active: boolean;
  };
};

/**
 * Open and flagged alerts for products that are still on sale, furthest
 * below their minimum first (a product at 1 of 10 comes before 4 of 5).
 * Row Level Security lets both roles read these.
 */
export async function getLowStockAlerts(): Promise<LowStockAlert[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("low_stock_alerts")
    .select(
      "id, status, created_at, products!inner(id, name, category, current_stock, minimum_stock, is_active)",
    )
    .in("status", ["open", "flagged"])
    .eq("products.is_active", true);

  if (error) {
    console.error("Could not load low-stock alerts:", error.message);
    return [];
  }

  return (data as unknown as Row[])
    .map((r) => ({
      id: r.id,
      status: r.status,
      createdAt: r.created_at,
      product: {
        id: r.products.id,
        name: r.products.name,
        category: r.products.category,
        currentStock: r.products.current_stock,
        minimumStock: r.products.minimum_stock,
      },
    }))
    .sort((a, b) => {
      const ratio = (x: LowStockAlert) =>
        x.product.currentStock / Math.max(x.product.minimumStock, 1);
      return (
        ratio(a) - ratio(b) || a.product.name.localeCompare(b.product.name)
      );
    });
}
