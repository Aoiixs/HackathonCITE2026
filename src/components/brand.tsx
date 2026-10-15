// The sidebar / top-bar brand: the icon on the left, then "StockWise" with
// an optional smaller line under it. The icon is the green-square mark; the
// words are live text so they stay sharp at any size.
export function Brand({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/stockwise-mark-dark.svg"
        alt=""
        width={40}
        height={40}
        className="size-10 shrink-0"
      />
      <div className="flex min-w-0 flex-col">
        <span className="text-xl font-bold leading-5 tracking-tight text-white">
          StockWise
        </span>
        {subtitle && (
          <span className="text-xs leading-4 text-sidebar-muted">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
