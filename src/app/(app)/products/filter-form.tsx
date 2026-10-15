"use client";

// The Manage products filters. With no Apply button, changing a dropdown
// reloads the list straight away; in the Search box, press Enter. It is
// still a plain GET form, so the filters stay in the address and can be
// shared. The hidden button is what makes Enter work in the Search box.
export function FilterForm({ children }: { children: React.ReactNode }) {
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-3"
      onChange={(e) => {
        if (e.target instanceof HTMLSelectElement) {
          e.currentTarget.requestSubmit();
        }
      }}
    >
      {children}
      <button type="submit" className="sr-only" tabIndex={-1}>
        Search
      </button>
    </form>
  );
}
