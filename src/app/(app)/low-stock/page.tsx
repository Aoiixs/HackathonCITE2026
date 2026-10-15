import { getStaff } from "@/lib/auth";
import { getLowStockAlerts } from "@/lib/low-stock";
import { SubmitButton } from "@/components/submit-button";
import { Toast } from "@/components/toast";
import { Card, CardContent } from "@/components/ui/card";
import { flagAlert, resolveAlert } from "./actions";
import { PageLabel } from "@/components/page-label";

export default async function LowStockPage({
  searchParams,
}: {
  searchParams: Promise<{ failed?: string }>;
}) {
  const { failed } = await searchParams;
  const staff = await getStaff();
  const isManager = staff.role === "manager";
  const alerts = await getLowStockAlerts();

  return (
    <div className="flex flex-col gap-6">
      {failed && (
        <Toast
          message="Could not update that alert. Nothing was changed."
          tone="error"
        />
      )}
      <header className="flex flex-col gap-1">
        <PageLabel>Low stock</PageLabel>
        <h1 className="text-3xl font-semibold tracking-tight">Low stock</h1>
        <p className="text-muted-foreground">
          Products below their minimum level, furthest below first.
          {!isManager && " The manager decides when to restock."}
        </p>
      </header>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {/* Fixed column widths: headers and cells line up exactly. */}
          <table
            className={`w-full table-fixed text-left text-sm ${isManager ? "min-w-[820px]" : "min-w-[560px]"}`}
          >
            <colgroup>
              {isManager ? (
                <>
                  <col className="w-[28%]" />
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                  <col className="w-[20%]" />
                  <col className="w-[26%]" />
                </>
              ) : (
                <>
                  <col className="w-[38%]" />
                  <col className="w-[20%]" />
                  <col className="w-[16%]" />
                  <col className="w-[26%]" />
                </>
              )}
            </colgroup>
            <thead className="border-b border-divider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 text-right font-medium">Current stock</th>
                <th className="px-4 py-3 text-right font-medium">Minimum</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {isManager && (
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id} className="border-b border-divider last:border-0">
                  <td className="px-4 py-3">
                    <span className="font-medium">{a.product.name}</span>
                    <span className="block text-muted-foreground">
                      {a.product.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#8a5a0b]">
                    {a.product.currentStock}
                  </td>
                  <td className="px-4 py-3 text-right">{a.product.minimumStock}</td>
                  <td className="px-4 py-3">
                    {a.status === "flagged" ? "Flagged for restocking" : "Open"}
                  </td>
                  {isManager && (
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap justify-end gap-2">
                      {a.status === "open" && (
                        <form action={flagAlert}>
                          <input type="hidden" name="alert_id" value={a.id} />
                          <SubmitButton variant="outline" size="sm" pendingLabel="Flagging…">
                            Flag for restocking
                          </SubmitButton>
                        </form>
                      )}
                      <form action={resolveAlert}>
                        <input type="hidden" name="alert_id" value={a.id} />
                        <SubmitButton variant="ghost" size="sm" pendingLabel="Resolving…">
                          Mark resolved
                        </SubmitButton>
                      </form>
                      </div>
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
