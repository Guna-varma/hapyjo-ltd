/**
 * One place for how dates and times are shown to people.
 *
 * All timestamps are displayed in the company's time zone (Kigali, UTC+2) rather
 * than the browser's: a supervisor checking trips from a laptop set to another
 * zone must see the same clock time the driver saw in the field.
 */

export const APP_TIME_ZONE = 'Africa/Kigali';

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value == null || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function safeFormat(d: Date, options: Intl.DateTimeFormatOptions): string {
  try {
    return d.toLocaleString(undefined, { ...options, timeZone: APP_TIME_ZONE });
  } catch {
    // Very old engines without IANA zone support: fall back to the local zone.
    return d.toLocaleString(undefined, options);
  }
}

/** "Sep 12, 2026, 3:22 PM" */
export function formatDateTime(value: string | number | Date | null | undefined, fallback = '—'): string {
  const d = toDate(value);
  return d ? safeFormat(d, { dateStyle: 'medium', timeStyle: 'short' }) : fallback;
}

/** "Sep 12, 2026" */
export function formatDate(value: string | number | Date | null | undefined, fallback = '—'): string {
  const d = toDate(value);
  return d ? safeFormat(d, { dateStyle: 'medium' }) : fallback;
}

/** "3:22 PM" */
export function formatTime(value: string | number | Date | null | undefined, fallback = '—'): string {
  const d = toDate(value);
  return d ? safeFormat(d, { timeStyle: 'short' }) : fallback;
}

/** "Today" / "Yesterday" / "Sep 12, 2026" — for grouping lists by day. */
export function formatDayLabel(
  value: string | number | Date,
  labels: { today: string; yesterday: string }
): string {
  const d = toDate(value);
  if (!d) return '—';
  const dayKey = (x: Date) => safeFormat(x, { year: 'numeric', month: '2-digit', day: '2-digit' });
  const key = dayKey(d);
  const now = new Date();
  if (key === dayKey(now)) return labels.today;
  if (key === dayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000))) return labels.yesterday;
  return formatDate(d);
}
