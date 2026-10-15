"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adjustStock, type AdjustStockState } from "./actions";

export function AdjustStockButton({
  productId,
  productName,
  currentStock,
}: {
  productId: string;
  productName: string;
  currentStock: number;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [counted, setCounted] = useState("");
  const [note, setNote] = useState("");
  const [state, formAction, pending] = useActionState<AdjustStockState, FormData>(
    adjustStock,
    { error: null, done: false },
  );

  // When the save succeeds, close the window and show the "saved" message.
  useEffect(() => {
    if (state.done) {
      dialogRef.current?.close();
      router.replace("/products?saved=adjusted");
    }
  }, [state, router]);

  // Controlled inputs keep what was typed if the save is refused.
  function open() {
    setCounted("");
    setNote("");
    dialogRef.current?.showModal();
  }

  return (
    <>
      <Button variant="outline" size="default" onClick={open}>
        Adjust stock
      </Button>
      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-xl rounded-[var(--radius)] border border-border bg-card p-8 text-card-foreground backdrop:bg-black/40"
      >
        <form action={formAction} className="flex flex-col gap-6">
          <input type="hidden" name="id" value={productId} />
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold">Adjust stock: {productName}</h2>
            <p className="text-base text-muted-foreground">
              System count: {currentStock}. Enter what is really on the shelf.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`counted-${productId}`}>Counted stock</Label>
            <Input
              id={`counted-${productId}`}
              name="counted"
              inputMode="numeric"
              className="h-12 text-base"
              value={counted}
              onChange={(e) => setCounted(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`note-${productId}`}>Note (required)</Label>
            <Textarea
              id={`note-${productId}`}
              name="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Shelf count after closing"
              className="min-h-[140px] text-base"
              required
            />
          </div>

          {state.error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {state.error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? "Saving…" : "Save adjustment"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
