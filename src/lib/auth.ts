import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Staff = {
  id: string;
  fullName: string;
  role: "employee" | "manager";
  email: string;
  avatarUrl: string | null;
};

/**
 * Who is signed in? Call this at the top of EVERY page that needs a
 * signed-in user. Do not rely on a shared layout alone: Next.js does not
 * re-run a layout when you move between pages inside it.
 *
 * - Signed out: sends the visitor to Sign in.
 * - Signed in but switched off (is_active = false), or no profile: signs
 *   them out and sends them to Sign in with a message. This is how a
 *   deactivated person is blocked even though their password still works.
 *
 * cache() means the layout and the page can both call it and the database
 * is only asked once per request.
 */
export const getStaff = cache(async (): Promise<Staff> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) redirect("/auth/inactive");

  // Read on its own so that a missing avatar_url column (012 not run yet)
  // can never lock anyone out: on any error we just show initials.
  const { data: avatar } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? "",
    avatarUrl: (avatar?.avatar_url as string | null | undefined) ?? null,
    fullName: profile.full_name,
    role: profile.role as Staff["role"],
  };
});

/**
 * Like getStaff(), but only managers get through; an employee is sent back
 * to the Dashboard. Use it at the top of every manager-only page AND every
 * manager-only server action: hiding a menu item is not security.
 */
export async function requireManager(): Promise<Staff> {
  const staff = await getStaff();
  if (staff.role !== "manager") redirect("/");
  return staff;
}
