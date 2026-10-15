import Link from "next/link";
import { formatPeso } from "@/lib/format";
import { formatManila } from "@/lib/time";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type SaleRow = {
  id: string;
  receiptNumber: string;
  createdAt: string;
  cashier: string;
  total: number;
  payment: string;
  status: "completed" | "voided";
};

export function SalesList({
  mine,
  sales,
  shown,
  total,
}: {
  mine: string;
  sales: SaleRow[];
  shown: number;
  total: number;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold">{mine}Sales</h2>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          {/* Fixed column widths: headers and cells line up exactly. */}
          <table className="w-full min-w-[880px] table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[16%]" />
              <col className="w-[22%]" />
              <col className="w-[16%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead className="border-b border-divider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Receipt</th>
                <th className="px-4 py-3 font-medium">Date and time</th>
                <th className="px-4 py-3 font-medium">Cashier</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} className="border-b border-divider last:border-0">
                  <td className="px-4 py-3 font-mono">{s.receiptNumber}</td>
                  <td className="px-4 py-3">{formatManila(s.createdAt)}</td>
                  <td className="px-4 py-3">{s.cashier}</td>
                  <td className="px-4 py-3 text-right">{formatPeso(s.total)}</td>
                  <td className="px-4 py-3 capitalize">{s.payment}</td>
                  <td className={cn("px-4 py-3", s.status === "voided" && "text-destructive")}>
                    {s.status === "voided" ? "Voided" : "Completed"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/history/sales/${s.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Receipt
                    </Link>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No sales in these dates.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
      {total > shown && (
        <p className="text-sm text-muted-foreground">
          Showing the latest {shown} of {total} sales. Narrow the dates to see others.
        </p>
      )}
    </section>
  );
}
