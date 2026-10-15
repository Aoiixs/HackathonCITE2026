"use client";

import { useEffect, useRef } from "react";

// A filter form with no Apply button. It is still a plain GET form, so the
// filters stay in the address and can be shared.
// - Dropdowns reload the list straight away.
// - Date boxes wait half a second after the last change, so typing a date
//   does not reload the page on every digit.
// - In a text box, press Enter. The hidden button is what makes that work.
export function FilterForm({ children }: { children: React.ReactNode }) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-3"
      onChange={(e) => {
        const form = e.currentTarget;
        const target = e.target;
        if (target instanceof HTMLSelectElement) {
          form.requestSubmit();
        } else if (target instanceof HTMLInputElement && target.type === "date") {
          clearTimeout(timer.current);
          timer.current = setTimeout(() => form.requestSubmit(), 500);
        }
      }}
    >
      {children}
      <button type="submit" className="sr-only" tabIndex={-1}>
        Apply filters
      </button>
    </form>
  );
}
