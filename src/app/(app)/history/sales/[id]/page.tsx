import Link from "next/link";
import { notFound } from "next/navigation";
import { getStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReceiptView } from "@/components/receipt";

type SaleLine = {
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export default async function SaleReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await getStaff();
  const { id } = await params;

  // Row Level Security hides other employees' sales, so an employee who
  // guesses another receipt's address simply gets "not found".
  const supabase = await createClient();
  const { data: sale } = await supabase
    .from("sales")
    .select(
      "id, receipt_number, created_at, total_amount, amount_received, change_amount, status, profiles(full_name), sale_items(product_name, quantity, unit_price, line_total)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!sale) notFound();

  const cashier = Array.isArray(sale.profiles) ? sale.profiles[0] : sale.profiles;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/history"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          ← Back to history
        </Link>
      </div>

      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-4 p-6">
          {sale.status === "voided" && (
            <p
              role="status"
              className="rounded-[var(--radius)] border border-destructive p-2 text-center text-sm font-semibold text-destructive"
            >
              This sale was voided
            </p>
          )}
          <ReceiptView
            receipt={{
              receiptNumber: sale.receipt_number,
              createdAt: sale.created_at,
              cashierName: cashier?.full_name ?? "Unknown",
              items: (sale.sale_items as SaleLine[]).map((i) => ({
                productName: i.product_name,
                quantity: i.quantity,
                unitPrice: Number(i.unit_price),
                lineTotal: Number(i.line_total),
              })),
              totalAmount: Number(sale.total_amount),
              amountReceived: Number(sale.amount_received),
              changeAmount: Number(sale.change_amount),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
