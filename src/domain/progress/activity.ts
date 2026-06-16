/**
 * Learner-activity tracking helpers.
 *
 * Tracks which distinct calendar days the learner was active, supporting the
 * 7-day activity strip in the streak popover.
 *
 * @module domain/progress/activity
 */

const MAX_ACTIVE_DATES = 90;

const MS_PER_DAY = 86_400_000;

/**
 * Appends a date to the active-dates array, idempotently for same-day activity,
 * and trims to the most recent 90 entries.
 *
 * @param dates - The current sorted active-dates array.
 * @param today - The local date to record (`YYYY-MM-DD`).
 * @returns A new sorted array with `today` appended and trimmed to the cap.
 */
export function recordActiveDate(dates: string[], today: string): string[] {
  if (dates.length > 0 && dates.at(-1) === today) {
    return dates;
  }
  const next = [...dates, today];
  if (next.length > MAX_ACTIVE_DATES) {
    return next.slice(next.length - MAX_ACTIVE_DATES);
  }
  return next;
}

/**
 * Returns a boolean array indicating which of the most recent `days` calendar
 * days the learner was active. Index 0 represents `days - 1` days ago; the
 * last index represents today.
 *
 * @param dates - The sorted active-dates array.
 * @param today - The reference local date (`YYYY-MM-DD`).
 * @param days - The number of recent days to evaluate.
 * @returns A boolean array of length `days`.
 */
export function recentActiveDays(
  dates: string[],
  today: string,
  days: number,
): boolean[] {
  const activeSet = new Set(dates);
  const result: boolean[] = [];
  const todayMs = Date.parse(`${today}T00:00:00Z`);
  for (let i = days - 1; i >= 0; i--) {
    const dayMs = todayMs - i * MS_PER_DAY;
    const dateStr = new Date(dayMs).toISOString().slice(0, 10);
    result.push(activeSet.has(dateStr));
  }
  return result;
}
