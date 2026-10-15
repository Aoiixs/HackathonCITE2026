"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Field =
  | "name"
  | "category"
  | "price"
  | "starting_stock"
  | "minimum_stock";

export type ProductFormState = {
  errors: Partial<Record<Field, string>>;
  formError: string | null;
  values: Record<string, string>;
  done?: boolean; // set when a save worked and the modal can close
  attempt: number; // counts submissions, so the form can reset to the values we send back
};

const WHOLE_NUMBER = "Enter a whole number, 0 or more";

function readValues(formData: FormData) {
  const get = (key: string) => String(formData.get(key) ?? "").trim();
  return {
    name: get("name"),
    category: get("category"),
    price: get("price"),
    starting_stock: get("starting_stock"),
    minimum_stock: get("minimum_stock"),
  };
}

function validate(values: Record<string, string>, mode: "add" | "edit") {
  const errors: ProductFormState["errors"] = {};
  if (!values.name) errors.name = "Name is required";
  else if (values.name.length > 100) errors.name = "Keep the name under 100 characters";
  if (!values.category) errors.category = "Category is required";
  else if (values.category.length > 50) errors.category = "Keep the category under 50 characters";
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(values.price)) {
    errors.price = "Enter a price like 45 or 45.50";
  }
  if (mode === "add" && !/^\d{1,9}$/.test(values.starting_stock)) {
    errors.starting_stock = WHOLE_NUMBER;
  }
  if (!/^\d{1,9}$/.test(values.minimum_stock)) {
    errors.minimum_stock = WHOLE_NUMBER;
  }
  return errors;
}

function fail(
  previous: ProductFormState,
  values: Record<string, string>,
  errors: ProductFormState["errors"],
  formError: string | null = null,
): ProductFormState {
  return { errors, formError, values, attempt: previous.attempt + 1 };
}

// Turns a database error into a message a person can act on.
function explain(error: { code?: string; message: string }) {
  if (error.code === "23505") {
    return { errors: { name: "A product with this name already exists" } };
  }
  if (error.code === "42501") {
    return { formError: "You are not allowed to do this." };
  }
  console.error("Product save failed:", error.message);
  return { formError: "Could not save. Please try again." };
}

export async function createProduct(
  previous: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireManager();
  const values = readValues(formData);
  const errors = validate(values, "add");
  if (Object.keys(errors).length) return fail(previous, values, errors);

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_product", {
    p_name: values.name,
    p_category: values.category,
    p_price: Number(values.price),
    p_starting_stock: Number(values.starting_stock),
    p_minimum_stock: Number(values.minimum_stock),
  });
  if (error) {
    const { errors: e = {}, formError = null } = explain(error);
    return fail(previous, values, e, formError);
  }

  revalidatePath("/products");
  return { errors: {}, formError: null, values: {}, attempt: previous.attempt + 1, done: true };
}

export async function updateProduct(
  previous: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireManager();
  const id = String(formData.get("id") ?? "");
  const values = readValues(formData);
  const errors = validate(values, "edit");
  if (Object.keys(errors).length) return fail(previous, values, errors);

  // Stock is deliberately not in this list: the database refuses it.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update({
      name: values.name,
      category: values.category,
      price: Number(values.price),
      minimum_stock: Number(values.minimum_stock),
    })
    .eq("id", id)
    .select("id");

  if (error) {
    const { errors: e = {}, formError = null } = explain(error);
    return fail(previous, values, e, formError);
  }
  // Row Level Security does not raise an error when it hides a row; the
  // update just touches zero rows. So check that something changed.
  if (!data?.length) {
    return fail(previous, values, {}, "Could not find that product.");
  }

  redirect("/products?saved=updated");
}

export type AdjustStockState = { error: string | null; done: boolean };

export async function adjustStock(
  _previous: AdjustStockState,
  formData: FormData,
): Promise<AdjustStockState> {
  await requireManager();
  const id = String(formData.get("id") ?? "");
  const counted = String(formData.get("counted") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!/^\d{1,9}$/.test(counted)) {
    return { error: "Enter the counted stock as a whole number, 0 or more.", done: false };
  }
  if (!note) return { error: "Please write a note explaining the change.", done: false };
  if (note.length > 500) {
    return { error: "Keep the note under 500 characters.", done: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("adjust_stock", {
    p_product_id: id,
    p_new_stock: Number(counted),
    p_note: note,
  });

  if (error) {
    // 22023 messages are written for people ("…same as the current stock").
    if (error.code === "22023") return { error: error.message, done: false };
    if (error.code === "42501") {
      return { error: "You are not allowed to do this.", done: false };
    }
    console.error("Adjust stock failed:", error.message);
    return { error: "Could not save. Nothing was changed. Please try again.", done: false };
  }

  // Stock changed, so every screen that shows it must be rebuilt.
  revalidatePath("/products");
  revalidatePath("/");
  revalidatePath("/low-stock");
  revalidatePath("/sales/new");
  return { error: null, done: true };
}

export async function deactivateProduct(formData: FormData) {
  await requireManager();
  const id = String(formData.get("id") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("id", id)
    .select("id");

  // Row Level Security hides a row without raising an error, so also check
  // that a row really changed before saying it worked.
  if (error || !data?.length) {
    if (error) console.error("Deactivate failed:", error.message);
    redirect("/products?failed=deactivate");
  }

  redirect("/products?saved=deactivated");
}
