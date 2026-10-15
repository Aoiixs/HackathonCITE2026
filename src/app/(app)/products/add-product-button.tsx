"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createProduct } from "./actions";
import { ProductForm } from "./product-form";

const EMPTY = {
  name: "",
  category: "",
  price: "",
  starting_stock: "0",
  minimum_stock: "0",
};

export function AddProductButton({ categories }: { categories: string[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  // Changing the key gives a fresh, empty form each time the window opens.
  const [openCount, setOpenCount] = useState(0);

  function open() {
    setOpenCount((n) => n + 1);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <Button size="lg" onClick={open}>
        Add product
      </Button>
      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-md rounded-[var(--radius)] border border-border bg-card p-6 text-card-foreground backdrop:bg-black/40"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Add product</h2>
            <p className="text-sm text-muted-foreground">
              Set the name, price and starting stock.
            </p>
          </div>
          <ProductForm
            key={openCount}
            action={createProduct}
            mode="add"
            categories={categories}
            initialValues={EMPTY}
            onCancel={close}
            onSaved={() => {
              close();
              router.replace("/products?saved=added");
            }}
          />
        </div>
      </dialog>
    </>
  );
}
