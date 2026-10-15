"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toast } from "@/components/toast";
import type { StockFormState } from "./actions";

export type StockProduct = {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
};

type Props = {
  mode: "in" | "out";
  action: (
    previous: StockFormState,
    formData: FormData,
  ) => Promise<StockFormState>;
  products: StockProduct[];
  today: string; // "2026-10-15", the shop's date
  initialProduct?: string; // a product id to have chosen when the page opens
};

const selectClass =
  "flex h-10 w-full rounded-[var(--radius)] border border-input bg-card px-3 py-2 text-base md:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function StockForm({
  mode,
  action,
  products,
  today,
  initialProduct = "",
}: Props) {
  const [state, formAction, pending] = useActionState(action, {
    errors: {},
    formError: null,
    values: {
      product: products.some((p) => p.id === initialProduct) ? initialProduct : "",
      quantity: "",
      date: today,
      reason: "",
      note: "",
    },
    attempt: 0,
    success: null,
  } satisfies StockFormState);

  return (
    <>
      {state.success && <Toast key={state.attempt} message={state.success.message} />}
      {state.success?.low && (
        <LowStockNotice key={state.attempt} low={state.success.low} />
      )}

      <form action={formAction} noValidate className="flex max-w-xl flex-col gap-4">
        {/* key={state.attempt} rebuilds the fields after every save, so what
            was typed comes back after an error and clears after a success. */}
        <Fields
          key={state.attempt}
          mode={mode}
          products={products}
          today={today}
          state={state}
        />

        {state.formError && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {state.formError}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Saving…" : mode === "in" ? "Save stock in" : "Save stock out"}
          </Button>
          <Link href="/" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}

function Fields({
  mode,
  products,
  today,
  state,
}: {
  mode: "in" | "out";
  products: StockProduct[];
  today: string;
  state: StockFormState;
}) {
  const [productId, setProductId] = useState(state.values.product);
  const chosen = products.find((p) => p.id === productId);
  // The Category select is only a filter for the Product list. It has no
  // name="...", so it is never sent with the form or saved.
  const [category, setCategory] = useState(chosen?.category ?? "");
  const categories = [...new Set(products.map((p) => p.category))].sort((a, b) =>
    a.localeCompare(b),
  );
  const visible = category ? products.filter((p) => p.category === category) : products;
  const { errors, values } = state;

  function changeCategory(next: string) {
    setCategory(next);
    // A product from another category can't stay chosen.
    if (next && chosen && chosen.category !== next) setProductId("");
  }

  return (
    <>
      <Field label="Category" id="category">
        <select
          id="category"
          value={category}
          onChange={(e) => changeCategory(e.target.value)}
          className={selectClass}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Product" id="product" error={errors.product}>
        <select
          id="product"
          name="product"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className={selectClass}
        >
          <option value="">Choose a product</option>
          {visible.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.current_stock} in stock
            </option>
          ))}
        </select>
        {chosen && (
          <p className="text-sm text-muted-foreground">
            Current stock: <span className="font-semibold">{chosen.current_stock}</span>
            {" · "}Minimum: <span className="font-semibold">{chosen.minimum_stock}</span>
          </p>
        )}
      </Field>

      <Field
        label={mode === "in" ? "Quantity received" : "Quantity"}
        id="quantity"
        error={errors.quantity}
      >
        <Input
          id="quantity"
          name="quantity"
          inputMode="numeric"
          defaultValue={values.quantity}
        />
      </Field>

      <Field label="Date" id="date" error={errors.date}>
        <Input
          id="date"
          name="date"
          type="date"
          max={today}
          defaultValue={values.date || today}
        />
      </Field>

      {mode === "out" && (
        <Field label="Reason" id="reason" error={errors.reason}>
          <select
            id="reason"
            name="reason"
            defaultValue={values.reason}
            className={selectClass}
          >
            <option value="">Choose a reason</option>
            <option value="spoiled">Spoiled</option>
            <option value="damaged">Damaged</option>
            <option value="used">Used</option>
          </select>
        </Field>
      )}

      <Field label="Note (optional)" id="note" error={errors.note}>
        <Textarea id="note" name="note" defaultValue={values.note} />
      </Field>
    </>
  );
}

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

// The amber warning after a stock out that left a product below its minimum.
function LowStockNotice({
  low,
}: {
  low: { productName: string; currentStock: number; minimumStock: number };
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-md rounded-[var(--radius)] border border-border bg-card p-6 text-card-foreground backdrop:bg-black/40"
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-[var(--radius)] border border-amber-500 bg-amber-50 p-4 text-amber-950">
          <h2 className="text-xl font-semibold">Running low</h2>
          <p className="mt-1 text-sm">
            {low.productName} is now below its minimum: {low.currentStock} left
            (minimum {low.minimumStock}).
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" onClick={() => dialogRef.current?.close()}>
            OK
          </Button>
          <Link
            href="/low-stock"
            className={buttonVariants({ variant: "outline" })}
          >
            See low stock
          </Link>
        </div>
      </div>
    </dialog>
  );
}
