import { getStaff } from "@/lib/auth";
import { getLowStockAlerts } from "@/lib/low-stock";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { flagAlert, resolveAlert } from "./actions";

export default async function LowStockPage() {
  const staff = await getStaff();
  const isManager = staff.role === "manager";
  const alerts = await getLowStockAlerts();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Low stock</h1>
        <p className="text-muted-foreground">
          Products below their minimum level, furthest below first.
          {!isManager && " The manager decides when to restock."}
        </p>
      </header>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 text-right font-medium">Current stock</th>
                <th className="px-4 py-3 text-right font-medium">Minimum</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {isManager && (
                  <th className="px-4 py-3 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <span className="font-medium">{a.product.name}</span>
                    <span className="block text-muted-foreground">
                      {a.product.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-amber-700">
                    {a.product.currentStock}
                  </td>
                  <td className="px-4 py-3 text-right">{a.product.minimumStock}</td>
                  <td className="px-4 py-3">
                    {a.status === "flagged" ? "Flagged for restocking" : "Open"}
                  </td>
                  {isManager && (
                    <td className="flex justify-end gap-2 px-4 py-2">
                      {a.status === "open" && (
                        <form action={flagAlert}>
                          <input type="hidden" name="alert_id" value={a.id} />
                          <Button type="submit" variant="outline" size="sm">
                            Flag for restocking
                          </Button>
                        </form>
                      )}
                      <form action={resolveAlert}>
                        <input type="hidden" name="alert_id" value={a.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Mark resolved
                        </Button>
                      </form>
                    </td>
                  )}
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr>
                  <td
                    colSpan={isManager ? 5 : 4}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Nothing is running low.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
