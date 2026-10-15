// Nexora is in the Philippines (UTC+8, no daylight saving). Vercel's servers
// run on UTC, so "today" and clock times must be worked out for Manila on
// purpose, or a sale at 7am would count as yesterday.
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

/** The moment today began in Manila, as an ISO string for database filters. */
export function startOfTodayManila(): string {
  const manilaNow = new Date(Date.now() + MANILA_OFFSET_MS);
  const startUtc =
    Date.UTC(
      manilaNow.getUTCFullYear(),
      manilaNow.getUTCMonth(),
      manilaNow.getUTCDate(),
    ) - MANILA_OFFSET_MS;
  return new Date(startUtc).toISOString();
}

/** e.g. "Oct 15, 2026, 1:45 PM" in Manila time. */
export function formatManila(iso: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
