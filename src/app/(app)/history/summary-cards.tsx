import { formatDateOnly } from "@/lib/time";
import { formatPeso } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  mine: string; // "" for the manager, "Your " for an employee
  totalCents: number;
  orders: number;
  daily: { date: string; cents: number }[];
  today: string;
  topSellers: [name: string, quantity: number][];
  lowProducts: { id: string; name: string; stock: number; minimum: number }[];
};

export function SummaryCards({
  mine,
  totalCents,
  orders,
  daily,
  today,
  topSellers,
  lowProducts,
}: Props) {
  const average = orders > 0 ? totalCents / orders / 100 : 0;
  const tallest = Math.max(...daily.map((d) => d.cents), 1);
  const topQuantity = topSellers[0]?.[1] ?? 1;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">
            {mine ? `${mine}total sales` : "Total sales"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div>
            <p className="text-3xl font-semibold">{formatPeso(totalCents / 100)}</p>
            <p className="text-sm text-muted-foreground">
              {orders} {orders === 1 ? "order" : "orders"} · average{" "}
              {formatPeso(average)} per order
            </p>
          </div>

          {/* One bar per day. Today's bar is the darker one. */}
          <div
            role="img"
            aria-label={`Daily sales from ${formatDateOnly(daily[0].date)} to ${formatDateOnly(
              daily[daily.length - 1].date,
            )}`}
            className="flex h-24 items-end gap-0.5"
          >
            {daily.map((d) => (
              <div
                key={d.date}
                title={`${formatDateOnly(d.date)}: ${formatPeso(d.cents / 100)}`}
                className={cn(
                  "min-w-px flex-1 rounded-t-sm",
                  d.date === today ? "bg-primary" : "bg-bar",
                )}
                style={{
                  height: d.cents > 0 ? `${Math.max((d.cents / tallest) * 100, 4)}%` : "2px",
                }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatDateOnly(daily[0].date)}</span>
            <span>{formatDateOnly(daily[daily.length - 1].date)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">
            Most sold products
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topSellers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales in these dates.</p>
          ) : (
            <ol className="flex flex-col gap-4">
              {topSellers.map(([name, quantity]) => (
                <li key={name} className="flex flex-col gap-1">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-medium">{name}</span>
                    <span className="text-muted-foreground">{quantity} sold</span>
                  </div>
                  <div className="h-2 rounded-full bg-track">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${(quantity / topQuantity) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <Card className="border-[#e9b949]">
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">
            Low-stock items
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lowProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing is running low.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {lowProducts.map((p) => (
                <li key={p.id} className="flex justify-between gap-3">
                  <span className="font-medium">{p.name}</span>
                  <span className="font-semibold text-[#8a5a0b]">
                    {p.stock} of {p.minimum}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
