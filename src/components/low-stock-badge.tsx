import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { getLowStockCount } from "@/lib/low-stock";
import { cn } from "@/lib/utils";

// A small "Low stock: N" link, shown on the Dashboard and the Menu screen.
export async function LowStockBadge() {
  const count = await getLowStockCount();

  return (
    <Link
      href="/low-stock"
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-[var(--radius)] border px-4 text-base font-medium",
        count > 0
          ? "border-[#e9b949] bg-[#fdf0d5] text-[#8a5a0b]"
          : "border-input bg-card text-muted-foreground",
      )}
    >
      <TriangleAlert className="size-4" aria-hidden="true" />
      Low stock
      <span
        className={cn(
          "flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold",
          count > 0 ? "bg-[#e9b949] text-[#3d2a05]" : "bg-secondary",
        )}
      >
        {count}
      </span>
    </Link>
  );
}
