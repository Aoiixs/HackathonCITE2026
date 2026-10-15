import Link from "next/link";
import { getStaff } from "@/lib/auth";
import { LogoutButton } from "./logout-button";

// Sidebar for managers. Only Dashboard exists so far; the rest are shown
// greyed out so the menu is visible, and become links as each ticket ships.
const menu = [
  { label: "Dashboard", href: "/" },
  { label: "New sale", href: null },
  { label: "Manage products", href: "/products" },
  { label: "Low stock", href: null },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await getStaff();

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-3">
        <span className="text-lg font-semibold tracking-tight">StockWise</span>
        <div className="flex items-center gap-4">
          <p className="text-sm">
            <span className="font-medium">{staff.fullName}</span>
            <span className="text-muted-foreground"> · {staff.role}</span>
          </p>
          <LogoutButton />
        </div>
      </header>

      <div className="flex flex-1">
        {staff.role === "manager" && (
          <aside className="w-56 border-r border-border p-4">
            <nav aria-label="Main menu" className="flex flex-col gap-1">
              {menu.map((item) =>
                item.href ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="rounded-[var(--radius)] px-3 py-2 text-sm font-medium hover:bg-secondary"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    key={item.label}
                    aria-disabled="true"
                    className="rounded-[var(--radius)] px-3 py-2 text-sm text-muted-foreground"
                  >
                    {item.label} <span className="text-xs">(soon)</span>
                  </span>
                ),
              )}
            </nav>
          </aside>
        )}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
