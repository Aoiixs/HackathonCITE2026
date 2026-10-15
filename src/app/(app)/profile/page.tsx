import Link from "next/link";
import { Building2, Clock, Mail, Phone, ShieldCheck } from "lucide-react";
import { getStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// A MOCK-UP profile. The name, role and email are real (from the signed-in
// account). Everything under "Sample details" is placeholder text: nothing
// is saved, and there is no edit form yet.
export default async function ProfilePage() {
  const staff = await getStaff();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isManager = staff.role === "manager";
  const initials = staff.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const details = [
    { icon: Mail, label: "Email", value: user?.email ?? "—" },
    { icon: Building2, label: "Branch", value: "Nexora, Ortiz branch" },
    { icon: Phone, label: "Phone", value: "0917 000 0000" },
    {
      icon: Clock,
      label: "Shift",
      value: isManager ? "Mon–Sat, 8:00 AM – 5:00 PM" : "Mon–Sat, 9:00 AM – 6:00 PM",
    },
  ];

  const duties = isManager
    ? ["Manage products", "Manage stocks and restocking", "Review history and reports"]
    : ["Take customer orders from the Menu", "Give receipts", "Watch low-stock warnings"];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">My profile</h1>
        <Link
          href="/"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          ← Back to dashboard
        </Link>
      </header>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-6">
          {/* aria-hidden: the name beside it already says who this is. */}
          <div
            aria-hidden="true"
            className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground"
          >
            {initials || "?"}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-2xl font-semibold">{staff.fullName}</p>
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <ShieldCheck className="size-4" aria-hidden="true" />
              {isManager ? "Manager" : "Employee"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sample details</CardTitle>
            <p className="text-sm text-muted-foreground">
              Placeholder text for the mock-up. Not saved yet.
            </p>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-4">
              {details.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isManager ? "Manager duties" : "Employee duties"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex list-disc flex-col gap-2 pl-5">
              {duties.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
