"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  ChartColumn,
  LayoutDashboard,
  Package,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// The manager's menu. (Employees go straight to the Dashboard buttons.)
const menu: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Manage products", href: "/products", icon: Package },
  { label: "Manage Stocks", href: "/stock", icon: ArrowLeftRight },
  { label: "Low stock", href: "/low-stock", icon: TriangleAlert },
  { label: "History & reports", href: "/history", icon: ChartColumn },
];

// A client component only so it can ask "which page am I on?" and
// highlight that item.
export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main menu" className="flex flex-wrap gap-1 md:flex-col">
      {menu.map(({ label, href, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
              active
                ? "bg-sidebar-active text-white"
                : "text-sidebar-foreground hover:bg-sidebar-active/60",
            )}
          >
            {/* aria-hidden: the icon is decoration; the word is the label. */}
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
