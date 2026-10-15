"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductFormState } from "./actions";

type Props = {
  action: (
    previous: ProductFormState,
    formData: FormData,
  ) => Promise<ProductFormState>;
  mode: "add" | "edit";
  productId?: string;
  initialValues: Record<string, string>;
  categories: string[];
  onCancel?: () => void; // inside a modal: close it instead of navigating
  onSaved?: () => void;
};

export function ProductForm({
  action,
  mode,
  productId,
  initialValues,
  categories,
  onCancel,
  onSaved,
}: Props) {
  const [state, formAction, pending] = useActionState(action, {
    errors: {},
    formError: null,
    values: initialValues,
    attempt: 0,
  });
  // After a successful save: run onSaved (the modals close themselves), or,
  // on a full page, go back to the products list. The ref keeps the latest
  // onSaved without making this run again on every render.
  const router = useRouter();
  const savedRef = useRef(onSaved);
  useEffect(() => {
    savedRef.current = onSaved;
  });
  useEffect(() => {
    if (!state.done) return;
    if (savedRef.current) savedRef.current();
    else router.replace(`/products?saved=${mode === "add" ? "added" : "updated"}`);
  }, [state, router, mode]);
  const value = (key: string) => state.values[key] ?? "";

  // key={state.attempt} rebuilds the form after each submit, so what the
  // person typed comes back instead of being wiped by React's form reset.
  return (
    <form
      key={state.attempt}
      action={formAction}
      className="flex w-full max-w-xl flex-col gap-4"
      noValidate
    >
      {productId && <input type="hidden" name="id" value={productId} />}

      <Field label="Name" id="name" error={state.errors.name}>
        <Input id="name" name="name" defaultValue={value("name")} required />
      </Field>

      <Field label="Category" id="category" error={state.errors.category}>
        <Input
          id="category"
          name="category"
          list="category-options"
          defaultValue={value("category")}
          required
        />
        <datalist id="category-options">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>

      <Field label="Price (₱)" id="price" error={state.errors.price}>
        <Input
          id="price"
          name="price"
          inputMode="decimal"
          defaultValue={value("price")}
          required
        />
      </Field>

      {mode === "add" && (
        <Field
          label="Starting stock"
          id="starting_stock"
          error={state.errors.starting_stock}
        >
          <Input
            id="starting_stock"
            name="starting_stock"
            inputMode="numeric"
            defaultValue={value("starting_stock")}
            required
          />
        </Field>
      )}

      <Field
        label="Minimum stock"
        id="minimum_stock"
        error={state.errors.minimum_stock}
        hint="Below this number, the product counts as running low."
      >
        <Input
          id="minimum_stock"
          name="minimum_stock"
          inputMode="numeric"
          defaultValue={value("minimum_stock")}
          required
        />
      </Field>

      {state.formError && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.formError}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : mode === "add" ? "Add product" : "Save changes"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" size="lg" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <Link
            href="/products"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  id,
  error,
  hint,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && (
        <p className="text-sm text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
