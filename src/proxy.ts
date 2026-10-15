import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Run on every page, but skip Next.js's own files, the favicon, the public
// folders (/brand, /avatars) and image files. Without this, a signed-out
// visitor's request for the logo was redirected to the Sign in page, so the
// browser got a web page instead of a picture and showed a broken image.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|avatars/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
