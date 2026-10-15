import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// getStaff() sends deactivated staff here. A page cannot clear the login
// cookie, but a route can: sign them out, then back to Sign in with a message.
export async function GET(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login?reason=inactive", request.url));
}
