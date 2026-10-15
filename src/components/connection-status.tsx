import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Temporary check for ticket 02. It asks the database how many profile
// rows a signed-out visitor can see. Row Level Security should make that 0,
// and "Connected" proves the app reached Supabase. Ticket 03 replaces it.
export async function ConnectionStatus() {
  let count: number | null = null;
  let error: { message: string } | null = null;

  // createClient() throws if the Supabase variables are missing, so it sits
  // inside the try: a broken setup shows "Not connected" instead of crashing
  // the whole page.
  try {
    const supabase = await createClient();
    ({ count, error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true }));
  } catch (e) {
    error = { message: e instanceof Error ? e.message : "unknown error" };
  }

  if (error) {
    console.error("Supabase check failed:", error.message);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database check</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm">
        {error ? (
          <p className="font-medium">Not connected. Check the Supabase variables in Vercel.</p>
        ) : (
          <>
            <p className="font-medium">Connected to Supabase.</p>
            <p className="text-muted-foreground">
              A signed-out visitor can see {count ?? 0} profile rows. It should be 0.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
