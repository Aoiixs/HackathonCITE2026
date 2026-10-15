import Link from "next/link";
import { getStaff } from "@/lib/auth";
import { LogoutButton } from "./logout-button";

// The manager's menu. (Employees go straight to the Dashboard buttons.)
const menu = [
  { label: "Dashboard", href: "/" },
  { label: "New sale", href: "/sales/new" },
  { label: "Manage products", href: "/products" },
  { label: "Stock in", href: "/stock-in" },
  { label: "Stock out", href: "/stock-out" },
  { label: "Low stock", href: "/low-stock" },
  { label: "History & reports", href: "/history" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await getStaff();

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-4 py-3 md:px-6">
        <span className="text-lg font-semibold tracking-tight">StockWise</span>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-sm">
            <span className="font-medium">{staff.fullName}</span>
            <span className="text-muted-foreground"> · {staff.role}</span>
          </p>
          <LogoutButton />
        </div>
      </header>

      {/* On a phone the menu sits above the page; from tablet width up it
          becomes a sidebar. */}
      <div className="flex flex-1 flex-col md:flex-row">
        {staff.role === "manager" && (
          <aside className="border-b border-border p-2 md:w-56 md:border-b-0 md:border-r md:p-4">
            <nav
              aria-label="Main menu"
              className="flex flex-wrap gap-1 md:flex-col"
            >
              {menu.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-[var(--radius)] px-3 py-2 text-sm font-medium hover:bg-secondary"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        )}
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
