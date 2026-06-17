/**
 * Pure domain functions for computing derived progress statistics.
 *
 * These functions have no side effects and are suitable for unit testing.
 * They compute values that are not directly persisted but derived from
 * existing state.
 *
 * @module domain/progress/stats
 */

import { localDateIso } from "./dates";

/** A level message with range boundaries. */
export interface LevelMessage {
  /** Minimum level for this message range (inclusive). */
  from: number;
  /** Maximum level for this message range (inclusive). */
  to: number;
  /** Message text displayed to learner. */
  message: string;
}

/** All level message definitions, in display order. */
export const levelMessages: Readonly<LevelMessage[]> = [
  { from: 1, to: 4, message: "Just starting your journey" },
  { from: 5, to: 9, message: "You're on fire! 🔥" },
  { from: 10, to: 14, message: "Halfway to mastery!" },
  { from: 15, to: 19, message: "Getting there..." },
  { from: 20, to: 24, message: "Almost a master!" },
  { from: 25, to: 29, message: "Expert in training" },
  { from: 30, to: Infinity, message: "LEGENDARY! 🏆" },
];

/**
 * Parses a YYYY-MM-DD string to a Date object.
 *
 * @param dateStr - Date string in YYYY-MM-DD format.
 * @returns The parsed Date object (set to midnight UTC).
 */
function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  // Set to midnight UTC to ensure correct day comparison across months
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
}

/**
 * Computes the longest consecutive day streak from active dates.
 *
 * Two dates are consecutive if their absolute time difference is exactly one day.
 * This correctly handles month/year boundaries (e.g., Dec 31 -> Jan 1).
 *
 * @param dates - Array of active dates in YYYY-MM-DD format, sorted ascending.
 * @returns The longest consecutive streak length. Returns 0 for empty arrays.
 */
export function computeLongestStreak(dates: ReadonlyArray<string>): number {
  if (dates.length === 0) {
    return 0;
  }

  let currentStreak = 1;
  let maxStreak = 1;
  let previousDate = parseDate(dates[0]);

  for (let i = 1; i < dates.length; i++) {
    const currentDate = parseDate(dates[i]);

    // Check if consecutive by comparing actual time difference (24 hours = 1 day)
    const oneDayInMs = 24 * 60 * 60 * 1000;
    const diff = currentDate.getTime() - previousDate.getTime();
    const consecutive = Math.abs(diff) === oneDayInMs;

    if (consecutive) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      // Reset streak on gap
      currentStreak = 1;
    }

    previousDate = currentDate;
  }

  return maxStreak;
}

/**
 * Returns the first login date from active dates, or today if none exist.
 *
 * @param dates - Array of active dates in YYYY-MM-DD format.
 * @returns Date string in YYYY-MM-DD format, or today if dates is empty.
 */
export function computeFirstLogin(dates: ReadonlyArray<string>): string {
  if (dates.length === 0) {
    return localDateIso();
  }
  return dates[0];
}

/**
 * Finds the level message that matches the given level.
 *
 * @param level - The learner's current level (1-based).
 * @returns The LevelMessage object for that level range.
 */
export function findLevelMessage(level: number): LevelMessage {
  for (const message of levelMessages) {
    if (level >= message.from && level <= message.to) {
      return message;
    }
  }
  // Fallback to first message (should not happen with valid level ranges)
  return levelMessages[0];
}

/**
 * Counts the total number of completed lessons.
 *
 * @param lessons - Record of lessons with completion status.
 * @returns The count of lessons where completed is true.
 */
export function computeTotalLessonsCompleted(
  lessons: Readonly<Record<string, { completed: boolean }>>,
): number {
  let count = 0;
  for (const lesson of Object.values(lessons)) {
    if (lesson.completed) {
      count++;
    }
  }
  return count;
}

/**
 * Computes badge progress information.
 *
 * @param earned - Number of badges earned.
 * @param total - Total number of available badges (30).
 * @returns Object with earned, total, and percentage progress.
 */
export function computeBadgeProgress(
  earned: number,
  total: number,
): { earned: number; total: number; percentage: number } {
  const percentage = total > 0 ? Math.round((earned / total) * 100) : 0;
  return { earned, total, percentage };
}
