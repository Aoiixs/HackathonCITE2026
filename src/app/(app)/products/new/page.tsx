import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createProduct } from "../actions";
import { ProductForm } from "../product-form";

export default async function NewProductPage() {
  await requireManager();

  // Suggest the categories already in use while the manager types.
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("category");
  const categories = [
    ...new Set((data ?? []).map((row: { category: string }) => row.category)),
  ].sort();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">Add product</h1>
      <ProductForm
        action={createProduct}
        mode="add"
        categories={categories}
        initialValues={{
          name: "",
          category: "",
          price: "",
          starting_stock: "0",
          minimum_stock: "0",
        }}
      />
    </div>
  );
}
