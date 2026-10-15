import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Staff = {
  id: string;
  fullName: string;
  role: "employee" | "manager";
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

  return {
    id: user.id,
    fullName: profile.full_name,
    role: profile.role as Staff["role"],
  };
});
