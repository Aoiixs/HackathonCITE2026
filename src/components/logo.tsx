// The StockWise logo. "light" is for white pages (dark text); "dark" is for
// the green sidebar and top bar (white text). Plain <img> because these are
// small local SVG files.
export function Logo({
  variant,
  height,
}: {
  variant: "light" | "dark";
  height: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/brand/stockwise-logo-${variant}.svg`}
      alt="StockWise"
      height={height}
      style={{ height, width: "auto" }}
    />
  );
}
