"use client";

import { useRef } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SubmitButton } from "@/components/submit-button";
import { signOut } from "@/app/login/actions";

// Asks "Log out?" in a dialog first, so a stray tap can't end a busy shift.
// onGreen: styled for the green sidebar / top bar.
export function LogoutButton({ onGreen = false }: { onGreen?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          onGreen &&
            "border-[#4a6658] bg-transparent text-[#e8efea] hover:bg-sidebar-active",
        )}
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
            <SubmitButton pendingLabel="Logging out…">Log out</SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
