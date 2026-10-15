"use client";

import { useRef } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/login/actions";

// Asks "Log out?" in a dialog first, so a stray tap can't end a busy shift.
export function LogoutButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => dialogRef.current?.showModal()}
      >
        <LogOut className="size-4" aria-hidden="true" />
        Log out
      </Button>
      <dialog
        ref={dialogRef}
        className="m-auto rounded-[var(--radius)] border border-border bg-card p-6 text-card-foreground backdrop:bg-black/40"
      >
        <form action={signOut} className="flex flex-col gap-4">
          <p className="font-medium">Log out of StockWise?</p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </Button>
            <Button type="submit">Log out</Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
