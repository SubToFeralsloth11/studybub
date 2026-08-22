/**
 * Pure domain logic for ntfy streak notifications.
 *
 * Subject-agnostic, zero-dependency domain module handling:
 * - Topic, reminder time, and timezone validation
 * - Injected-instant local date and time projection
 * - Reminder eligibility and milestone evaluation
 * - Deduplication logical key formats
 * - Notification message copy generation
 * - Failure classification and progressive retry delays
 *
 * @module domain/notifications/notifications
 */

import type { Streak } from "../persistence/schema";

/** Valid ntfy topic pattern: 1-64 chars of `-_A-Za-z0-9`. */
const TOPIC_REGEX = /^[-_A-Za-z0-9]{1,64}$/;

/** Valid 24-hour reminder time pattern: HH:mm from 00:00 to 23:59. */
const REMINDER_TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Milestone streak day thresholds. */
const FIXED_MILESTONES = [3, 7, 14, 30, 50, 100] as const;

export type NotificationKind = "test" | "reminder" | "milestone";

export type NotificationDeliveryStatus =
  | "pending"
  | "claimed"
  | "succeeded"
  | "failed"
  | "expired"
  | "suppressed";

export type NotificationDeliveryFailureClassification =
  | "timeout"
  | "network"
  | "rate-limited"
  | "service-unavailable"
  | "rejected";

export interface DraftNotificationConfig {
  topic: string;
  reminderTime: string;
  timezone: string;
}

export interface ActiveNotificationConfig {
  reminderTime: string;
  timezone: string;
  activatedAt: string;
}

export interface LocalDateProjection {
  localDate: string;
  localTime: string;
  hour: number;
  minute: number;
  localDayEndUtc: Date;
}

export interface NotificationCopy {
  title: string;
  body: string;
  priority: 2 | 3;
  tags?: string[];
}

/**
 * Validates whether a topic matches ntfy.sh requirements (`[-_A-Za-z0-9]{1,64}`).
 */
export function validateTopic(topic: string): boolean {
  return TOPIC_REGEX.test(topic);
}

/**
 * Validates whether a reminder time is in 24-hour HH:mm format between 00:00 and 23:59.
 */
export function validateReminderTime(time: string): boolean {
  return REMINDER_TIME_REGEX.test(time);
}

/**
 * Validates whether a timezone is a valid named IANA timezone supported by Intl.
 */
export function validateTimezone(timezone: string): boolean {
  if (!timezone || typeof timezone !== "string") {
    return false;
  }
  // Filter out legacy abbreviations or simple offset strings if not supported as canonical IANA named zones
  if (
    timezone === "EST" ||
    timezone.startsWith("GMT+") ||
    timezone.startsWith("UTC+")
  ) {
    return false;
  }
  try {
    const formatter = new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    const resolved = formatter.resolvedOptions().timeZone;
    return typeof resolved === "string" && resolved.length > 0;
  } catch {
    return false;
  }
}

/**
 * Validates all fields of a draft notification configuration.
 */
export function validateDraftNotificationConfig(
  config: DraftNotificationConfig,
): boolean {
  return (
    validateTopic(config.topic) &&
    validateReminderTime(config.reminderTime) &&
    validateTimezone(config.timezone)
  );
}

/**
 * Projects a UTC instant into the learner's local date (`YYYY-MM-DD`), local time (`HH:mm`),
 * and calculates the local day end (midnight) instant in UTC.
 */
export function projectLocalTimeAndDate(
  instant: Date,
  timezone: string,
): LocalDateProjection {
  // Use Intl.DateTimeFormat to get date parts in the given timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(instant);
  const getPart = (type: string): string =>
    parts.find((p) => p.type === type)?.value ?? "00";

  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  let hourStr = getPart("hour");
  if (hourStr === "24") hourStr = "00";
  const minuteStr = getPart("minute");

  const localDate = `${year}-${month}-${day}`;
  const localTime = `${hourStr.padStart(2, "0")}:${minuteStr.padStart(2, "0")}`;
  const hour = Number.parseInt(hourStr, 10);
  const minute = Number.parseInt(minuteStr, 10);

  // Compute end of local day (the next midnight in this timezone).
  // Strategy: calculate tomorrow's local date, and search around +24h to find the exact instant tomorrow starts.
  // Next local day date:
  const approxNextDay = new Date(
    instant.getTime() + (24 - hour + 1) * 3_600_000,
  );
  const nextDayParts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(approxNextDay);
  const nextYear = nextDayParts.find((p) => p.type === "year")?.value ?? year;
  const nextMonth =
    nextDayParts.find((p) => p.type === "month")?.value ?? month;
  const nextDay = nextDayParts.find((p) => p.type === "day")?.value ?? day;
  const targetNextDate = `${nextYear}-${nextMonth}-${nextDay}`;

  // Binary search or bounded search for the exact millisecond when local date becomes targetNextDate at 00:00:00.
  // Start window: from instant to instant + 30 hours
  let low = instant.getTime();
  let high = instant.getTime() + 30 * 3_600_000;
  // Narrow down to second resolution
  while (high - low > 1000) {
    const mid = Math.floor((low + high) / 2);
    const testParts = formatter.formatToParts(new Date(mid));
    const testYear = testParts.find((p) => p.type === "year")?.value;
    const testMonth = testParts.find((p) => p.type === "month")?.value;
    const testDay = testParts.find((p) => p.type === "day")?.value;
    const testDate = `${testYear}-${testMonth}-${testDay}`;

    if (testDate < targetNextDate) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  // Snap to second boundary
  const localDayEndUtc = new Date(Math.floor(high / 1000) * 1000);

  return {
    localDate,
    localTime,
    hour,
    minute,
    localDayEndUtc,
  };
}

/**
 * Checks if the whole number of calendar days between two local dates is exactly 1 (yesterday).
 */
function isYesterday(lastActiveDate: string, todayLocalDate: string): boolean {
  if (!lastActiveDate || !todayLocalDate) return false;
  const start = Date.parse(`${lastActiveDate}T00:00:00Z`);
  const end = Date.parse(`${todayLocalDate}T00:00:00Z`);
  const diffDays = Math.round((end - start) / 86_400_000);
  return diffDays === 1;
}

export interface ReminderEligibilityInput {
  now: Date;
  config: ActiveNotificationConfig;
  streak: Streak;
  todayActive: boolean;
}

/**
 * Pure rule for at-risk streak reminder eligibility:
 * 1. Streak count > 0
 * 2. Last active date was yesterday in the configured timezone
 * 3. No qualifying activity recorded today
 * 4. Current local time is at or after configured reminder time
 * 5. Configuration was activated before today's reminder time (no catch-up reminder on late activation)
 */
export function isReminderEligible(input: ReminderEligibilityInput): boolean {
  const { now, config, streak, todayActive } = input;

  if (streak.count <= 0 || !streak.lastActiveDate) {
    return false;
  }

  if (todayActive) {
    return false;
  }

  const projection = projectLocalTimeAndDate(now, config.timezone);

  if (!isYesterday(streak.lastActiveDate, projection.localDate)) {
    return false;
  }

  if (projection.localTime < config.reminderTime) {
    return false;
  }

  // Check activation time: if activated today, was it activated after reminder time?
  const activationInstant = new Date(config.activatedAt);
  const activationProjection = projectLocalTimeAndDate(
    activationInstant,
    config.timezone,
  );

  if (
    activationProjection.localDate === projection.localDate &&
    activationProjection.localTime >= config.reminderTime
  ) {
    return false;
  }

  return true;
}

/**
 * Checks whether a streak count is a milestone celebration threshold (3, 7, 14, 30, 50, 100, 200, 300, ...).
 */
export function isMilestoneThreshold(count: number): boolean {
  if (count <= 0) return false;
  if ((FIXED_MILESTONES as readonly number[]).includes(count)) {
    return true;
  }
  return count > 100 && count % 100 === 0;
}

/**
 * Returns the milestone threshold reached if streak count advanced to a threshold, or null otherwise.
 */
export function getMilestoneForStreak(
  oldCount: number,
  newCount: number,
): number | null {
  if (newCount <= oldCount) {
    return null;
  }
  if (isMilestoneThreshold(newCount)) {
    return newCount;
  }
  return null;
}

/**
 * Creates internal idempotency key for reminder delivery (`reminder:{localDate}`).
 */
export function makeReminderLogicalKey(localDate: string): string {
  return `reminder:${localDate}`;
}

/**
 * Creates internal idempotency key for milestone delivery (`milestone:{lastActiveDate}:{streakCount}`).
 */
export function makeMilestoneLogicalKey(
  lastActiveDate: string,
  streakCount: number,
): string {
  return `milestone:${lastActiveDate}:${streakCount}`;
}

export type NotificationCopyInput =
  | { kind: "test" }
  | { kind: "reminder"; streakCount: number }
  | { kind: "milestone"; streakCount: number };

/**
 * Builds generic subject-agnostic notification title, body, priority, and tags.
 */
export function formatNotificationCopy(
  input: NotificationCopyInput,
): NotificationCopy {
  if (input.kind === "test") {
    return {
      title: "StudyBub notifications",
      body: "Your StudyBub streak notifications are connected.",
      priority: 2,
    };
  }

  if (input.kind === "reminder") {
    return {
      title: `Keep your ${input.streakCount}-day streak`,
      body: "Study today to keep it going.",
      priority: 3,
      tags: ["fire"],
    };
  }

  return {
    title: `${input.streakCount}-day streak`,
    body: `You reached a ${input.streakCount}-day streak. Keep it going!`,
    priority: 2,
    tags: ["tada"],
  };
}

export interface FailureClassificationInput {
  status?: number;
  errorName?: string;
  isTimeout?: boolean;
}

/**
 * Classifies HTTP/network/timeout results according to the ntfy publish contract.
 */
export function classifyDeliveryFailure(
  input: FailureClassificationInput,
): NotificationDeliveryFailureClassification {
  if (input.isTimeout || input.status === 408) {
    return "timeout";
  }
  if (input.status === 429) {
    return "rate-limited";
  }
  if (
    input.status !== undefined &&
    input.status >= 500 &&
    input.status <= 599
  ) {
    return "service-unavailable";
  }
  if (
    input.status !== undefined &&
    input.status >= 400 &&
    input.status <= 499
  ) {
    return "rejected";
  }
  return "network";
}

/**
 * Computes progressive retry delay in seconds:
 * Attempt 1: 1m (60s)
 * Attempt 2: 5m (300s)
 * Attempt 3: 15m (900s)
 * Attempt 4+: 60m (3600s)
 * Honors a longer valid Retry-After header seconds if given.
 */
export function calculateNextRetryDelaySeconds(
  attemptNumber: number,
  retryAfterSeconds?: number,
): number {
  let delay: number;
  if (attemptNumber <= 1) {
    delay = 60;
  } else if (attemptNumber === 2) {
    delay = 300;
  } else if (attemptNumber === 3) {
    delay = 900;
  } else {
    delay = 3600;
  }

  if (
    retryAfterSeconds !== undefined &&
    !Number.isNaN(retryAfterSeconds) &&
    retryAfterSeconds > delay
  ) {
    return retryAfterSeconds;
  }

  return delay;
}
