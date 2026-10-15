"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// A small message that appears for a few seconds, then goes away.
// tone="error" is for "that did not work" messages, so a failed save can
// never look like a success.
export function Toast({
  message,
  tone = "success",
}: {
  message: string;
  tone?: "success" | "error";
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Drop "?saved=..." / "?failed=..." from the address so a refresh doesn't show it again.
    window.history.replaceState(null, "", window.location.pathname);
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "fixed bottom-6 right-6 z-50 max-w-sm rounded-[var(--radius)] px-4 py-3 text-sm font-medium shadow-lg",
        tone === "error"
          ? "bg-destructive text-destructive-foreground"
          : "bg-primary text-primary-foreground",
      )}
    >
      {message}
    </div>
  );
}
