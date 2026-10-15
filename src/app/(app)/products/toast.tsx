"use client";

import { useEffect, useState } from "react";

// A small message that appears for a few seconds, then goes away.
export function Toast({ message }: { message: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Drop "?saved=..." from the address so a refresh doesn't show it again.
    window.history.replaceState(null, "", window.location.pathname);
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;
  return (
    <div
      role="status"
      className="fixed bottom-6 right-6 rounded-[var(--radius)] bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg"
    >
      {message}
    </div>
  );
}
