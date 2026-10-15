"use server";

import { revalidatePath } from "next/cache";
import { getStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type SaleItemInput = { productId: string; quantity: number };

export type Receipt = {
  receiptNumber: string;
  createdAt: string;
  cashierName: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  totalAmount: number;
  amountReceived: number;
  changeAmount: number;
  // Products on this order that ended up below their minimum.
  lowStock: { productName: string; currentStock: number; minimumStock: number }[];
};

export type SaleResult =
  | { ok: true; receipt: Receipt }
  | { ok: false; lineErrors: Record<string, string>; formError: string | null };

const failure = (
  formError: string | null,
  lineErrors: Record<string, string> = {},
): SaleResult => ({ ok: false, lineErrors, formError });

export async function completeSale(
  items: SaleItemInput[],
  amountReceived: string,
): Promise<SaleResult> {
  const staff = await getStaff();

  // The browser already checked all this. Check again: anyone can call a
  // server action with any values, so the server never trusts the screen.
  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > 100 ||
    items.some(
      (i) =>
        typeof i.productId !== "string" ||
        !Number.isInteger(i.quantity) ||
        i.quantity < 1 ||
        i.quantity > 999,
    )
  ) {
    return failure("Add at least one item to the order.");
  }
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(amountReceived.trim())) {
    return failure("Enter the amount received, like 100 or 100.50.");
  }

  // Prices, totals and change are NOT sent: the database works them out.
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_sale", {
    p_items: items.map((i) => ({
      product_id: i.productId,
      quantity: i.quantity,
    })),
    p_amount_received: Number(amountReceived),
    p_payment_method: "cash",
  });

  if (error) {
    // NX001: not enough stock. The database puts the product's id in `details`.
    if (error.code === "NX001" && error.details) {
      return failure(null, { [error.details]: error.message });
    }
    if (error.code === "NX002") return failure(error.message);
    if (error.code === "42501") return failure("You are not allowed to do this.");
    if (error.code === "22023") return failure(error.message);
    console.error("Sale failed:", error.message);
    return failure("Could not save the sale. Nothing was changed. Please try again.");
  }

  // Stock changed, so the Dashboard and this screen must be rebuilt fresh.
  revalidatePath("/");
  revalidatePath("/sales/new");
  revalidatePath("/low-stock");

  return {
    ok: true,
    receipt: {
      receiptNumber: data.receipt_number,
      createdAt: data.created_at,
      cashierName: staff.fullName,
      items: data.items.map(
        (i: {
          product_name: string;
          quantity: number;
          unit_price: number;
          line_total: number;
        }) => ({
          productName: i.product_name,
          quantity: i.quantity,
          unitPrice: Number(i.unit_price),
          lineTotal: Number(i.line_total),
        }),
      ),
      totalAmount: Number(data.total_amount),
      amountReceived: Number(data.amount_received),
      changeAmount: Number(data.change_amount),
      lowStock: (data.low_stock ?? []).map(
        (l: {
          product_name: string;
          current_stock: number;
          minimum_stock: number;
        }) => ({
          productName: l.product_name,
          currentStock: Number(l.current_stock),
          minimumStock: Number(l.minimum_stock),
        }),
      ),
    },
  };
}
