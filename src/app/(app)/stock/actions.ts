"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { todayManila } from "@/lib/time";

type Field = "product" | "quantity" | "date" | "reason" | "note";

export type StockFormState = {
  errors: Partial<Record<Field, string>>;
  formError: string | null;
  values: Record<string, string>;
  attempt: number; // counts submissions, so the form can rebuild itself
  success: {
    message: string;
    // Set when stock out dropped the product below its minimum.
    low: { productName: string; currentStock: number; minimumStock: number } | null;
  } | null;
};

const REASONS = ["spoiled", "damaged", "used"];

function readValues(formData: FormData) {
  const get = (key: string) => String(formData.get(key) ?? "").trim();
  return {
    product: get("product"),
    quantity: get("quantity"),
    date: get("date"),
    reason: get("reason"),
    note: get("note"),
  };
}

function validate(values: Record<string, string>, mode: "in" | "out") {
  const errors: StockFormState["errors"] = {};
  if (!values.product) errors.product = "Choose a product";
  if (!/^\d{1,7}$/.test(values.quantity) || Number(values.quantity) < 1) {
    errors.quantity = "Enter a whole number, 1 or more";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date) || Number.isNaN(Date.parse(values.date))) {
    errors.date = "Choose a date";
  } else if (values.date > todayManila()) {
    errors.date = "The date can't be in the future";
  }
  if (mode === "out" && !REASONS.includes(values.reason)) {
    errors.reason = "Choose a reason";
  }
  if (values.note.length > 500) errors.note = "Keep the note under 500 characters";
  return errors;
}

async function save(
  mode: "in" | "out",
  previous: StockFormState,
  formData: FormData,
): Promise<StockFormState> {
  await requireManager();
  const values = readValues(formData);
  const errors = validate(values, mode);
  const again = (extra: Partial<StockFormState>): StockFormState => ({
    errors: {},
    formError: null,
    values,
    attempt: previous.attempt + 1,
    success: null,
    ...extra,
  });
  if (Object.keys(errors).length) return again({ errors });

  const supabase = await createClient();
  const note = values.note || null;
  const { data, error } =
    mode === "in"
      ? await supabase.rpc("record_stock_in", {
          p_product_id: values.product,
          p_quantity: Number(values.quantity),
          p_movement_date: values.date,
          p_note: note,
        })
      : await supabase.rpc("record_stock_out", {
          p_product_id: values.product,
          p_quantity: Number(values.quantity),
          p_reason: values.reason,
          p_movement_date: values.date,
          p_note: note,
        });

  if (error) {
    // NX001: more going out than is in stock; the message says how many.
    if (error.code === "NX001") return again({ errors: { quantity: error.message } });
    // 22023 messages are written for people ("The date cannot be in the future").
    if (error.code === "22023") return again({ formError: error.message });
    if (error.code === "42501") return again({ formError: "You are not allowed to do this." });
    console.error("Stock save failed:", error.message);
    return again({ formError: "Could not save. Nothing was changed. Please try again." });
  }

  // Stock changed, so every screen that shows it must be rebuilt.
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/low-stock");
  revalidatePath("/sales/new");

  const newStock = Number(data.new_stock);
  const minimum = Number(data.minimum_stock);
  return {
    errors: {},
    formError: null,
    // Keep the date for the next entry; clear everything else.
    values: { product: "", quantity: "", date: values.date, reason: "", note: "" },
    attempt: previous.attempt + 1,
    success: {
      message: `Stock ${mode} saved. ${data.product_name} now has ${newStock}.`,
      low:
        mode === "out" && newStock < minimum
          ? { productName: data.product_name, currentStock: newStock, minimumStock: minimum }
          : null,
    },
  };
}

export async function recordStockIn(previous: StockFormState, formData: FormData) {
  return save("in", previous, formData);
}

export async function recordStockOut(previous: StockFormState, formData: FormData) {
  return save("out", previous, formData);
}
