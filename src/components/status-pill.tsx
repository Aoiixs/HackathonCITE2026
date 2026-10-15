import { cn } from "@/lib/utils";

// Small coloured labels. One place, so every page uses the same colours.
const base = "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium";

export function StockStatusPill({ low }: { low: boolean }) {
  return (
    <span
      className={cn(
        base,
        low ? "bg-[#fdf0d5] text-[#8a5a0b]" : "bg-[#dcefe6] text-[#1f6b4a]",
      )}
    >
      {low ? "Low stock" : "In stock"}
    </span>
  );
}
