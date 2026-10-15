"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateProduct } from "./actions";
import { ProductForm } from "./product-form";

export function EditProductButton({
  product,
  categories,
}: {
  product: {
    id: string;
    name: string;
    category: string;
    price: number;
    current_stock: number;
    minimum_stock: number;
  };
  categories: string[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  // Changing the key gives a fresh form, with the product's current values,
  // each time the window opens.
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
      <Button variant="outline" size="default" onClick={open}>
        Edit
      </Button>
      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-md rounded-[var(--radius)] border border-border bg-card p-6 text-card-foreground backdrop:bg-black/40"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Edit product: {product.name}</h2>
            <p className="text-sm text-muted-foreground">
              Current stock: {product.current_stock}. Stock changes through
              sales and Adjust stock, not here.
            </p>
          </div>
          <ProductForm
            key={openCount}
            action={updateProduct}
            mode="edit"
            productId={product.id}
            categories={categories}
            initialValues={{
              name: product.name,
              category: product.category,
              price: String(product.price),
              minimum_stock: String(product.minimum_stock),
            }}
            onCancel={close}
            onSaved={() => {
              close();
              router.replace("/products?saved=updated");
            }}
          />
        </div>
      </dialog>
    </>
  );
}
