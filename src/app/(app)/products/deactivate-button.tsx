"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { deactivateProduct } from "./actions";

export function DeactivateButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => dialogRef.current?.showModal()}
      >
        Deactivate
      </Button>
      <dialog
        ref={dialogRef}
        className="m-auto max-w-sm rounded-[var(--radius)] border border-border bg-card p-6 text-card-foreground backdrop:bg-black/40"
      >
        <form action={deactivateProduct} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={productId} />
          <p className="font-medium">Deactivate {productName}?</p>
          <p className="text-sm text-muted-foreground">
            It will disappear from the employee Menu. Past sales and history keep it.
            Nothing is deleted.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </Button>
            <SubmitButton variant="destructive" pendingLabel="Deactivating…">
              Deactivate
            </SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
