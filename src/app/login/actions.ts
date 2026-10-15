"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SignInState = { error: string | null };

// Not exported: a "use server" file may only export async functions.
const INACTIVE_MESSAGE = "This account can't sign in. Please ask the manager.";

export async function signIn(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Invalid credentials" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Same message for a wrong email and a wrong password, on purpose:
  // it does not tell a stranger which emails have accounts.
  if (error || !data.user) return { error: "Invalid credentials" };

  // A correct password is not enough. The person must also have a profile
  // that is switched on.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    return { error: INACTIVE_MESSAGE };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
