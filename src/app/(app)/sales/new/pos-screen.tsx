"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatPeso } from "@/lib/format";
import { formatManila } from "@/lib/time";
import { completeSale, type Receipt } from "./actions";

export type PosProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  current_stock: number;
  minimum_stock: number;
};

const stockMessage = (left: number) =>
  left <= 0 ? "Out of stock" : `Only ${left} left in stock`;

// Money is added up in centavos (whole numbers) so 0.1 + 0.2 style rounding
// errors can never make a total or the change wrong by a centavo.
const toCents = (pesos: number) => Math.round(pesos * 100);

export function PosScreen({ products }: { products: PosProduct[] }) {
  const [cart, setCart] = useState<Record<string, number>>({}); // product id -> quantity
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [received, setReceived] = useState("");
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  // The same window shows the receipt first, then (only if something is
  // running low) the amber low-stock warning.
  const [phase, setPhase] = useState<"receipt" | "low">("receipt");
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const categories = [...new Set(products.map((p) => p.category))].sort();
  const needle = query.trim().toLowerCase();
  const visible = products.filter(
    (p) =>
      (!category || p.category === category) &&
      (!needle || p.name.toLowerCase().includes(needle)),
  );

  const lines = products
    .filter((p) => cart[p.id])
    .map((p) => {
      const quantity = cart[p.id];
      const error =
        quantity > p.current_stock
          ? stockMessage(p.current_stock)
          : serverErrors[p.id];
      return { product: p, quantity, error };
    });

  const totalCents = lines.reduce(
    (sum, l) => sum + toCents(l.product.price) * l.quantity,
    0,
  );
  const receivedValid = /^\d{1,8}(\.\d{1,2})?$/.test(received.trim());
  const receivedCents = receivedValid ? toCents(Number(received)) : 0;
  const enough = receivedValid && receivedCents >= totalCents;
  const hasStockError = lines.some((l) => l.error);
  const canConfirm =
    lines.length > 0 && enough && !hasStockError && !pending;

  function setQuantity(id: string, quantity: number) {
    setServerErrors((e) => ({ ...e, [id]: "" }));
    setFormError(null);
    setCart((c) => {
      const next = { ...c };
      if (quantity <= 0) delete next[id];
      else next[id] = quantity;
      return next;
    });
  }

  function confirm() {
    setFormError(null);
    startTransition(async () => {
      const result = await completeSale(
        lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        received,
      );
      if (result.ok) {
        setReceipt(result.receipt);
        setPhase("receipt");
        dialogRef.current?.showModal();
      } else {
        setServerErrors(result.lineErrors);
        setFormError(result.formError);
      }
    });
  }

  // Runs whenever the receipt closes (the button OR the Escape key), so the
  // old order can never be confirmed a second time by accident.
  function startFresh() {
    setCart({});
    setReceived("");
    setServerErrors({});
    setFormError(null);
    setReceipt(null);
    setPhase("receipt");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_26rem]">
      {/* Left: the products */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="search">Search products</Label>
          <Input
            id="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a product name"
          />
        </div>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Categories">
          {["", ...categories].map((c) => (
            <button
              key={c || "all"}
              type="button"
              role="tab"
              aria-selected={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full border border-border px-4 py-2 text-sm font-medium",
                category === c
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary",
              )}
            >
              {c || "All"}
            </button>
          ))}
        </div>

        {products.length === 0 ? (
          <p className="text-muted-foreground">
            No active products yet. The manager can add some under Manage products.
          </p>
        ) : visible.length === 0 ? (
          <p className="text-muted-foreground">No products match.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {visible.map((p) => {
              const low = p.current_stock < p.minimum_stock;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setQuantity(p.id, (cart[p.id] ?? 0) + 1)}
                  className={cn(
                    "flex min-h-28 flex-col justify-between rounded-[var(--radius)] border p-3 text-left shadow-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    low
                      ? "border-amber-500 bg-amber-50 text-amber-950"
                      : "border-border bg-card",
                  )}
                >
                  <span className="text-base font-semibold leading-tight">
                    {p.name}
                  </span>
                  <span className="flex items-end justify-between text-sm">
                    <span className="font-medium">{formatPeso(p.price)}</span>
                    <span>{p.current_stock} left</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Right: the order */}
      <Card className="h-fit lg:sticky lg:top-6">
        <CardHeader>
          <CardTitle>Order</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tap a product to add it.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {lines.map(({ product, quantity, error }) => (
                <li key={product.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-sm">
                      {formatPeso((toCents(product.price) * quantity) / 100)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={`One less ${product.name}`}
                      onClick={() => setQuantity(product.id, quantity - 1)}
                    >
                      −
                    </Button>
                    <span className="w-8 text-center text-lg font-semibold">
                      {quantity}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={`One more ${product.name}`}
                      onClick={() => setQuantity(product.id, quantity + 1)}
                    >
                      +
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(product.id, 0)}
                    >
                      Remove
                    </Button>
                  </div>
                  {error && (
                    <p role="alert" className="text-sm font-medium text-destructive">
                      {error}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between border-t border-border pt-4 text-lg font-semibold">
            <span>Total</span>
            <span>{formatPeso(totalCents / 100)}</span>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="received">Payment: cash. Amount received (₱)</Label>
            <Input
              id="received"
              inputMode="decimal"
              value={received}
              onChange={(e) => {
                setReceived(e.target.value);
                setFormError(null);
              }}
              className="h-12 text-lg"
            />
            {received && !receivedValid && (
              <p role="alert" className="text-sm font-medium text-destructive">
                Enter an amount like 100 or 100.50.
              </p>
            )}
            {receivedValid && lines.length > 0 && !enough && (
              <p role="alert" className="text-sm font-medium text-destructive">
                That is less than the total.
              </p>
            )}
            {enough && lines.length > 0 && (
              <p className="text-lg font-semibold">
                Change: {formatPeso((receivedCents - totalCents) / 100)}
              </p>
            )}
          </div>

          {formError && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {formError}
            </p>
          )}

          <Button size="lg" disabled={!canConfirm} onClick={confirm}>
            {pending ? "Saving…" : "Confirm order"}
          </Button>
        </CardContent>
      </Card>

      {/* The receipt */}
      <dialog
        ref={dialogRef}
        onClose={startFresh}
        className="m-auto w-full max-w-md rounded-[var(--radius)] border border-border bg-card p-6 text-card-foreground backdrop:bg-black/40"
      >
        {receipt && phase === "low" && (
          <div className="flex flex-col gap-4">
            <div className="rounded-[var(--radius)] border border-amber-500 bg-amber-50 p-4 text-amber-950">
              <h2 className="text-xl font-semibold">Running low</h2>
              <p className="mt-1 text-sm">
                This sale took these products below their minimum. Tell the
                manager.
              </p>
              <ul className="mt-3 flex flex-col gap-1 text-sm font-medium">
                {receipt.lowStock.map((l, index) => (
                  <li key={index} className="flex justify-between gap-3">
                    <span>{l.productName}</span>
                    <span>
                      {l.currentStock} left (minimum {l.minimumStock})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button size="lg" onClick={() => dialogRef.current?.close()}>
                New sale
              </Button>
              <Link
                href="/"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        )}
        {receipt && phase === "receipt" && (
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

            <p className="text-center text-sm text-muted-foreground">
              Stock updated automatically
            </p>

            {receipt.lowStock.length > 0 ? (
              <div className="flex justify-center">
                <Button size="lg" onClick={() => setPhase("low")}>
                  Continue
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button size="lg" onClick={() => dialogRef.current?.close()}>
                  New sale
                </Button>
                <Link
                  href="/"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                >
                  Back to dashboard
                </Link>
              </div>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}
