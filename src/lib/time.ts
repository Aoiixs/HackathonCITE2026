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

/** The first day of this month in Manila, as "2026-10-01". */
export function firstOfMonthManila(): string {
  return `${todayManila().slice(0, 8)}01`;
}

/** The Manila calendar date a moment fell on, as "2026-10-15". */
export function manilaDateOf(iso: string): string {
  return new Date(new Date(iso).getTime() + MANILA_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

/** Every date from `from` to `to` inclusive, as "YYYY-MM-DD" strings. */
export function eachDay(from: string, to: string): string[] {
  const days: string[] = [];
  const last = Date.parse(`${to}T00:00:00Z`);
  for (let t = Date.parse(`${from}T00:00:00Z`); t <= last; t += DAY_MS) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  return days;
}

/** e.g. "Oct 15, 2:45 PM" in Manila time (the year is added for other years). */
export function formatShortManila(iso: string): string {
  const thisYear = todayManila().slice(0, 4);
  const sameYear = manilaDateOf(iso).startsWith(thisYear);
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** e.g. "Oct 15, 2026, 1:45 PM" in Manila time. */
export function formatManila(iso: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
