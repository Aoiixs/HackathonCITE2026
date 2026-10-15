import { formatPeso } from "@/lib/format";
import { formatManila } from "@/lib/time";

export type ReceiptData = {
  receiptNumber: string;
  createdAt: string;
  cashierName: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  totalAmount: number;
  amountReceived: number;
  changeAmount: number;
};

// The receipt itself. Used right after a sale (New sale) and when a past
// sale is opened again (History), so both always look the same.
export function ReceiptView({ receipt }: { receipt: ReceiptData }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 text-center">
        <h2 className="text-xl font-semibold">Receipt</h2>
        <p className="font-mono text-sm">{receipt.receiptNumber}</p>
        <p className="text-sm text-muted-foreground">
          {formatManila(receipt.createdAt)} · Cashier: {receipt.cashierName}
        </p>
      </div>

      <ul className="flex flex-col gap-1 border-y border-border py-3 text-sm">
        {receipt.items.map((i, index) => (
          <li key={index} className="flex justify-between gap-3">
            <span>
              {i.quantity} × {i.productName}
              <span className="text-muted-foreground">
                {" "}
                @ {formatPeso(i.unitPrice)}
              </span>
            </span>
            <span>{formatPeso(i.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <dl className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between text-base font-semibold">
          <dt>Total</dt>
          <dd>{formatPeso(receipt.totalAmount)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Cash received</dt>
          <dd>{formatPeso(receipt.amountReceived)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Change</dt>
          <dd>{formatPeso(receipt.changeAmount)}</dd>
        </div>
      </dl>
    </div>
  );
}
