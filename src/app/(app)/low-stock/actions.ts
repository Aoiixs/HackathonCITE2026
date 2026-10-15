"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Both actions are manager-only, checked here AND inside the database
// functions. An employee has no buttons for them, but a hidden button is
// not security, so the server refuses too.

async function runAlertFunction(
  fn: "flag_low_stock_alert" | "resolve_low_stock_alert",
  formData: FormData,
) {
  await requireManager();
  const alertId = String(formData.get("alert_id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, { p_alert_id: alertId });
  if (error) {
    console.error(`${fn} failed:`, error.message);
    redirect("/low-stock?failed=1");
  }

  revalidatePath("/low-stock");
  revalidatePath("/");
}

export async function flagAlert(formData: FormData) {
  await runAlertFunction("flag_low_stock_alert", formData);
}

export async function resolveAlert(formData: FormData) {
  await runAlertFunction("resolve_low_stock_alert", formData);
}
