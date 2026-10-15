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

/** Today's date in Manila as "2026-10-15", the format a date input uses. */
export function todayManila(): string {
  return new Date(Date.now() + MANILA_OFFSET_MS).toISOString().slice(0, 10);
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Manila's date N days ago, as "2026-10-09". */
export function daysAgoManila(days: number): string {
  return new Date(Date.now() + MANILA_OFFSET_MS - days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** True for a real calendar date written "2026-10-15". */
export function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

/** The moment a Manila day began, for filtering timestamps. */
export function manilaDayStart(date: string): string {
  return new Date(`${date}T00:00:00+08:00`).toISOString();
}

/** The moment the NEXT Manila day began (use with "less than"). */
export function manilaNextDayStart(date: string): string {
  return new Date(
    new Date(`${date}T00:00:00+08:00`).getTime() + DAY_MS,
  ).toISOString();
}

/** A plain date like "2026-10-15" shown as "Oct 15, 2026". */
export function formatDateOnly(date: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
  }).format(new Date(`${date}T00:00:00+08:00`));
}

/** e.g. "Oct 15, 2026, 1:45 PM" in Manila time. */
export function formatManila(iso: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
