import Link from "next/link";
import { getLowStockAlerts } from "@/lib/low-stock";
import { cn } from "@/lib/utils";

// A small "Low stock: N" link, shown on the Dashboard and the New sale screen.
export async function LowStockBadge() {
  const count = (await getLowStockAlerts()).length;

  return (
    <Link
      href="/low-stock"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium",
        count > 0
          ? "border-amber-500 bg-amber-50 text-amber-950"
          : "border-border text-muted-foreground",
      )}
    >
      Low stock
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-semibold",
          count > 0 ? "bg-amber-500 text-white" : "bg-secondary",
        )}
      >
        {count}
      </span>
    </Link>
  );
}
