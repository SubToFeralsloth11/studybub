/**
 * Daily-streak transitions.
 *
 * Streak boundaries follow the learner's local calendar day (dates are
 * `YYYY-MM-DD` strings). This module is pure and date-injected: the "today"
 * value is always passed in, never read from the clock, so transitions are
 * fully testable.
 *
 * @module domain/progress/streak
 */

import type { Streak } from "../persistence/schema";

const MS_PER_DAY = 86_400_000;

/**
 * The whole number of calendar days from one local date to another.
 *
 * @param from - The earlier local date (`YYYY-MM-DD`).
 * @param to - The later local date (`YYYY-MM-DD`).
 * @returns The signed difference in days.
 */
function daysBetween(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  return Math.round((end - start) / MS_PER_DAY);
}

/**
 * Computes the streak after activity on a given day.
 *
 * - First-ever activity (or empty state) sets the streak to 1.
 * - Activity on the same day leaves the streak unchanged.
 * - Activity on the next consecutive day increments the streak.
 * - Activity after a gap of two or more days resets the streak to 1.
 *
 * @param current - The current streak state.
 * @param today - The local date of the activity (`YYYY-MM-DD`).
 * @returns The updated {@link Streak}.
 */
export function nextStreak(current: Streak, today: string): Streak {
  if (current.count === 0 || current.lastActiveDate === "") {
    return { count: 1, lastActiveDate: today };
  }
  const diff = daysBetween(current.lastActiveDate, today);
  if (diff === 0) return current;
  if (diff === 1) return { count: current.count + 1, lastActiveDate: today };
  return { count: 1, lastActiveDate: today };
}

/**
 * Returns a contextual message for the streak popover based on the current
 * streak state.
 *
 * @param count - The current streak count in days.
 * @param isTodayActive - Whether the learner was active today.
 * @param lastActiveIsYesterday - Whether the last active date was yesterday.
 * @returns A human-readable message string.
 */
export function streakMessage(
  count: number,
  isTodayActive: boolean,
  lastActiveIsYesterday: boolean,
): string {
  if (count === 0) {
    return "Complete a lesson to start your streak!";
  }
  if (isTodayActive) {
    return "Active today — come back tomorrow to keep it going!";
  }
  if (!lastActiveIsYesterday) {
    return "Your streak has reset. Start a new one today!";
  }
  return `You haven't practised today. Come back to keep your ${count}-day streak!`;
}
