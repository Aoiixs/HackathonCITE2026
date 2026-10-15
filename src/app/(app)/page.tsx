import { getStaff } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  // Every signed-in page checks for itself; see getStaff() for why.
  const staff = await getStaff();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, {staff.fullName}. You are signed in as{" "}
          {staff.role === "manager" ? "the manager" : "an employee"}.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Coming next</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Products, sales and low-stock alerts will appear here as they are
          built.
        </CardContent>
      </Card>
    </div>
  );
}
