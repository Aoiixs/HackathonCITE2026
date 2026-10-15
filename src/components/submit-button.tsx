"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * A submit button that knows when its form is being sent. While it is, it
 * shows `pendingLabel` and is disabled, so a nervous double-tap cannot send
 * the same change twice. It must sit INSIDE the <form> it belongs to.
 */
export function SubmitButton({
  pendingLabel,
  children,
  disabled,
  ...props
}: ButtonProps & { pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
