import Link from "next/link";
import { getStaff } from "@/lib/auth";
import { LogoutButton } from "./logout-button";
import { SidebarNav } from "./sidebar-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await getStaff();

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border bg-card px-4 py-3 md:px-6">
        <span className="text-lg font-semibold tracking-tight text-sidebar">
          StockWise
        </span>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href="/profile"
            className="text-sm hover:underline"
            title="My profile"
          >
            <span className="text-muted-foreground">
              <span className="font-medium">{staff.fullName}</span> · {staff.role}
            </span>
          </Link>
          <LogoutButton />
        </div>
      </header>

      {/* On a phone the menu sits above the page; from tablet width up it
          becomes a sidebar. */}
      <div className="flex flex-1 flex-col md:flex-row">
        {staff.role === "manager" && (
          <aside className="bg-sidebar p-2 md:w-56 md:p-4">
            <SidebarNav />
          </aside>
        )}
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
