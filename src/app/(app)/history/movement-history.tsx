import Link from "next/link";
import { formatDateOnly, formatShortManila, manilaDateOf } from "@/lib/time";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { FilterForm } from "@/components/filter-form";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type Movement = {
  id: string;
  createdAt: string;
  movementDate: string;
  productName: string;
  productInactive: boolean;
  type: string;
  reason: string | null;
  note: string | null;
  change: number;
  remaining: number;
  employee: string;
};

export type Filters = {
  from: string;
  to: string;
  product: string;
  type: string; // "" (all), or one of the CHIPS values below
};

const CHIPS = [
  { value: "", label: "All" },
  { value: "sale", label: "Sale" },
  { value: "stock_in", label: "Stock-in" },
  { value: "stock_out", label: "Stock-out" },
  { value: "adjustment", label: "Adjustment" },
  { value: "initial", label: "Initial" },
];

const selectClass =
  "flex h-10 w-full rounded-[var(--radius)] border border-input bg-card px-3 py-2 text-base md:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// The address a link should open: the current filters, with some changed.
function hrefFor(filters: Filters, changes: Partial<Filters> & { shown?: number }) {
  const merged = { ...filters, ...changes };
  const params = new URLSearchParams();
  if (merged.from) params.set("from", merged.from);
  if (merged.to) params.set("to", merged.to);
  if (merged.product) params.set("product", merged.product);
  if (merged.type) params.set("type", merged.type);
  if (merged.shown) params.set("shown", String(merged.shown));
  return `/history?${params.toString()}`;
}

function TypePill({ movement }: { movement: Movement }) {
  const { type, reason } = movement;
  const [label, tone] =
    type === "sale"
      ? ["Sale", "bg-[#dcefe6] text-[#1f6b4a]"]
      : type === "stock_in"
        ? ["Stock-in", "bg-[#dcebfa] text-[#1e4e8c]"]
        : type === "stock_out"
          ? [
              reason ? `Stock-out · ${reason[0].toUpperCase()}${reason.slice(1)}` : "Stock-out",
              "bg-[#fbe3de] text-[#a33a26]",
            ]
          : [
              // Voids have no colour of their own.
              { adjustment: "Adjustment", initial: "Initial", void: "Void" }[type] ?? type,
              type === "initial"
                ? "bg-[#e6e9f2] text-[#3b4a6b]"
                : type === "adjustment"
                  ? "bg-[#f1e8fa] text-[#5b3a8a]"
                  : "bg-secondary text-secondary-foreground",
            ];
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", tone)}>
      {label}
    </span>
  );
}

export function MovementHistory({
  filters,
  today,
  products,
  movements,
  hasMore,
  shown,
  pageSize,
}: {
  filters: Filters;
  today: string;
  products: { id: string; name: string; inactive: boolean }[];
  movements: Movement[];
  hasMore: boolean;
  shown: number;
  pageSize: number;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Stock movement history</h2>

      {/* A plain form that reloads the page with the filters in the address.
          The From and To dates also drive the three cards above. It submits
          itself when a filter changes, so there is no Apply button. */}
      <FilterForm>
        <input type="hidden" name="type" value={filters.type} />
        <div className="flex flex-col gap-2">
          <Label htmlFor="from">From</Label>
          <Input id="from" name="from" type="date" max={today} defaultValue={filters.from} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="to">To</Label>
          <Input id="to" name="to" type="date" max={today} defaultValue={filters.to} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="product">Product</Label>
          <select id="product" name="product" defaultValue={filters.product} className={selectClass}>
            <option value="">All products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.inactive ? " (inactive)" : ""}
              </option>
            ))}
          </select>
        </div>
        <Link href="/history" className={buttonVariants({ variant: "ghost" })}>
          Reset
        </Link>
      </FilterForm>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Movement type">
        {CHIPS.map((chip) => (
          <Link
            key={chip.value || "all"}
            href={hrefFor(filters, { type: chip.value })}
            aria-current={filters.type === chip.value ? "true" : undefined}
            className={cn(
              "rounded-full border border-input px-4 py-2 text-sm font-medium",
              filters.type === chip.value
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card hover:bg-secondary",
            )}
          >
            {chip.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {/* Fixed column widths: headers and cells line up exactly. */}
          <table className="w-full min-w-[980px] table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[14%]" />
              <col className="w-[17%]" />
              <col className="w-[15%]" />
              <col className="w-[9%]" />
              <col className="w-[10%]" />
              <col className="w-[14%]" />
              <col className="w-[21%]" />
            </colgroup>
            <thead className="border-b border-divider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 text-right font-medium">Quantity</th>
                <th className="px-4 py-3 text-right font-medium">Remaining</th>
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-b border-divider last:border-0">
                  <td className="px-4 py-3">
                    {formatShortManila(m.createdAt)}
                    {/* Stock in and out can be dated earlier than when they were typed in. */}
                    {m.movementDate !== manilaDateOf(m.createdAt) && (
                      <span className="block text-xs text-muted-foreground">
                        Dated {formatDateOnly(m.movementDate)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {m.productName}
                    {m.productInactive && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (inactive)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <TypePill movement={m} />
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-semibold",
                      m.change > 0 && "text-primary",
                    )}
                  >
                    {m.change > 0 ? "+" : "−"}
                    {Math.abs(m.change)}
                  </td>
                  <td className="px-4 py-3 text-right">{m.remaining}</td>
                  <td className="px-4 py-3">{m.employee}</td>
                  <td className="break-words px-4 py-3 text-muted-foreground">
                    {m.note || "—"}
                  </td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No movements for these filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {hasMore && (
        <div>
          <Link
            href={hrefFor(filters, { shown: shown + pageSize })}
            scroll={false}
            className={buttonVariants({ variant: "outline" })}
          >
            Load more
          </Link>
        </div>
      )}
    </section>
  );
}
