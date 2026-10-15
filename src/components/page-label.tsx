// The small uppercase grey label above each page title ("DASHBOARD").
export function PageLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </p>
  );
}
