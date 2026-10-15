import Link from "next/link";
import { getStaff } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { Avatar } from "@/components/avatar";
import { LogoutButton } from "./logout-button";
import { SidebarNav } from "./sidebar-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await getStaff();

  // Managers get a full-height green sidebar (name, role and Log out at the
  // bottom). Employees have no sidebar, so they get a green top bar instead.
  if (staff.role === "manager") {
    return (
      <div className="flex min-h-screen flex-1 flex-col md:flex-row">
        <aside className="flex flex-col justify-between gap-6 bg-sidebar p-4 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:overflow-y-auto">
          <div className="flex flex-col gap-6">
            <div>
              <Logo variant="dark" height={32} />
              <p className="mt-1 text-xs text-sidebar-muted">
                Nexora · Ortiz Branch
              </p>
            </div>
            <SidebarNav />
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/profile"
              title="My profile"
              className="flex items-center gap-3 rounded-lg hover:opacity-80"
            >
              <Avatar name={staff.fullName} avatarUrl={staff.avatarUrl} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-white">
                  {staff.fullName}
                </span>
                <span className="text-xs capitalize text-sidebar-muted">
                  {staff.role}
                </span>
              </span>
            </Link>
            <LogoutButton onGreen />
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-sidebar px-4 py-3 md:px-6">
        <Logo variant="dark" height={32} />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href="/profile"
            title="My profile"
            className="flex items-center gap-3 hover:opacity-80"
          >
            <Avatar name={staff.fullName} avatarUrl={staff.avatarUrl} />
            <span className="flex flex-col text-sm leading-tight">
              <span className="font-medium text-sidebar-foreground">
                {staff.fullName}
              </span>
              <span className="capitalize text-sidebar-muted">{staff.role}</span>
            </span>
          </Link>
          <LogoutButton onGreen />
        </div>
      </header>
      <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
