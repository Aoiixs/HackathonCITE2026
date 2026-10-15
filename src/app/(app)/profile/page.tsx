import Link from "next/link";
import { ShieldCheck, Mail } from "lucide-react";
import { getStaff } from "@/lib/auth";
import { Avatar } from "@/components/avatar";
import { PageLabel } from "@/components/page-label";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// View only. The picture is set in the database for now (SQL 012 and 013).
export default async function ProfilePage() {
  const staff = await getStaff();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <PageLabel>My profile</PageLabel>
          <h1 className="text-3xl font-semibold tracking-tight">My profile</h1>
          <p className="text-muted-foreground">Your StockWise account.</p>
        </div>
        <Link
          href="/"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          ← Back to dashboard
        </Link>
      </header>

      <Card className="max-w-xl">
        <CardContent className="flex flex-wrap items-center gap-6 p-6">
          <Avatar name={staff.fullName} avatarUrl={staff.avatarUrl} size={96} />
          <dl className="flex min-w-0 flex-col gap-3">
            <div>
              <dt className="sr-only">Full name</dt>
              <dd className="text-2xl font-semibold">{staff.fullName}</dd>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="size-4" aria-hidden="true" />
              <dt className="sr-only">Role</dt>
              <dd className="capitalize">{staff.role}</dd>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="size-4" aria-hidden="true" />
              <dt className="sr-only">Email</dt>
              <dd className="break-all">{staff.email}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
