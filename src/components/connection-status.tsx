import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Temporary check for ticket 02. It asks the database how many profile
// rows a signed-out visitor can see. Row Level Security should make that 0,
// and "Connected" proves the app reached Supabase. Ticket 03 replaces it.
export async function ConnectionStatus() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

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
