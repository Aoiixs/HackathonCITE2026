import { notFound } from "next/navigation";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateProduct } from "../../actions";
import { ProductForm } from "../../product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireManager();
  const { id } = await params;

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("id, name, category, price, current_stock, minimum_stock")
    .eq("id", id)
    .maybeSingle();
  if (!product) notFound();

  const { data: all } = await supabase.from("products").select("category");
  const categories = [
    ...new Set((all ?? []).map((row: { category: string }) => row.category)),
  ].sort();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Edit product</h1>
        <p className="text-sm text-muted-foreground">
          Current stock: {product.current_stock}. Stock can&apos;t be changed
          here; it moves through sales and, later, stock adjustments.
        </p>
      </header>
      <ProductForm
        action={updateProduct}
        mode="edit"
        productId={product.id}
        categories={categories}
        initialValues={{
          name: product.name,
          category: product.category,
          price: String(product.price),
          minimum_stock: String(product.minimum_stock),
        }}
      />
    </div>
  );
}
