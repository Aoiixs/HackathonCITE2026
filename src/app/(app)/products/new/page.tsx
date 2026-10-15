import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createProduct } from "../actions";
import { ProductForm } from "../product-form";
import { PageLabel } from "@/components/page-label";

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
      <header className="flex flex-col gap-1">
        <PageLabel>Manage products</PageLabel>
        <h1 className="text-3xl font-semibold tracking-tight">Add product</h1>
        <p className="text-muted-foreground">
          Set the name, price and starting stock.
        </p>
      </header>
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
