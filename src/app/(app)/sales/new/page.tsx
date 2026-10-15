import { getStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
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
      <h1 className="text-3xl font-semibold tracking-tight">New sale</h1>
      <PosScreen products={products} />
    </div>
  );
}
