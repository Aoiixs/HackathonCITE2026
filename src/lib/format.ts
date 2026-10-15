const pesoFormat = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

/** 65 -> "₱65.00" */
export function formatPeso(amount: number | string): string {
  return pesoFormat.format(Number(amount));
}
