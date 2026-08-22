import { describe, expect, it } from "vitest";

import {
  calculateNextRetryDelaySeconds,
  classifyDeliveryFailure,
  formatNotificationCopy,
  getMilestoneForStreak,
  isMilestoneThreshold,
  isReminderEligible,
  makeMilestoneLogicalKey,
  makeReminderLogicalKey,
  projectLocalTimeAndDate,
  validateDraftNotificationConfig,
  validateReminderTime,
  validateTimezone,
  validateTopic,
  type NotificationDeliveryFailureClassification,
} from "./notifications";

describe("Topic validation (validateTopic)", () => {
  it.each([
    ["valid simple", "my-topic", true],
    ["valid alphanumeric with underscore and dash", "study_bub-123", true],
    ["valid 1 char", "a", true],
    ["valid 64 chars", "a".repeat(64), true],
    ["empty string", "", false],
    ["whitespace only", "   ", false],
    ["leading/trailing spaces", " my-topic ", false],
    ["spaces in middle", "my topic", false],
    ["too long (65 chars)", "a".repeat(65), false],
    ["invalid characters (slash)", "topic/name", false],
    ["invalid characters (hash)", "topic#1", false],
    ["invalid characters (unicode)", "topic🔥", false],
    ["invalid characters (url encoded)", "topic%20name", false],
  ])("validates %s: %s -> %s", (_desc, input, expected) => {
    expect(validateTopic(input)).toBe(expected);
  });
});

describe("Reminder time validation (validateReminderTime)", () => {
  it.each([
    ["00:00", true],
    ["07:30", true],
    ["19:00", true],
    ["23:59", true],
    ["24:00", false],
    ["12:60", false],
    ["7:00", false],
    ["07:0", false],
    ["19:00:00", false],
    ["7pm", false],
    ["19:00 ", false],
    ["", false],
    ["invalid", false],
  ])("validates time string %s -> %s", (input, expected) => {
    expect(validateReminderTime(input)).toBe(expected);
  });
});

describe("Timezone validation (validateTimezone)", () => {
  it.each([
    ["UTC", true],
    ["Europe/London", true],
    ["America/New_York", true],
    ["Australia/Sydney", true],
    ["Asia/Tokyo", true],
    ["Invalid/Timezone", false],
    ["", false],
    ["GMT+1", false],
    ["UTC+2", false],
    ["EST", false], // legacy abbreviations without canonical IANA support or ambiguous
  ])("validates timezone %s -> %s", (input, expected) => {
    expect(validateTimezone(input)).toBe(expected);
  });
});

describe("Draft configuration validation (validateDraftNotificationConfig)", () => {
  it("returns true for valid draft configuration", () => {
    expect(
      validateDraftNotificationConfig({
        topic: "studybub-streak-test",
        reminderTime: "19:00",
        timezone: "Europe/London",
      }),
    ).toBe(true);
  });

  it("returns false if any field is invalid", () => {
    expect(
      validateDraftNotificationConfig({
        topic: "invalid topic",
        reminderTime: "19:00",
        timezone: "Europe/London",
      }),
    ).toBe(false);

    expect(
      validateDraftNotificationConfig({
        topic: "studybub-streak-test",
        reminderTime: "25:00",
        timezone: "Europe/London",
      }),
    ).toBe(false);

    expect(
      validateDraftNotificationConfig({
        topic: "studybub-streak-test",
        reminderTime: "19:00",
        timezone: "Fake/Zone",
      }),
    ).toBe(false);
  });
});

describe("Local date and time projection (projectLocalTimeAndDate)", () => {
  it("projects UTC instant into local time and local date for Europe/London (GMT in winter)", () => {
    const instant = new Date("2026-01-15T19:30:00Z");
    const result = projectLocalTimeAndDate(instant, "Europe/London");
    expect(result.localDate).toBe("2026-01-15");
    expect(result.localTime).toBe("19:30");
    expect(result.hour).toBe(19);
    expect(result.minute).toBe(30);
  });

  it("projects UTC instant into local time and local date for Europe/London (BST in summer)", () => {
    const instant = new Date("2026-07-15T18:30:00Z");
    const result = projectLocalTimeAndDate(instant, "Europe/London");
    expect(result.localDate).toBe("2026-07-15");
    expect(result.localTime).toBe("19:30");
    expect(result.hour).toBe(19);
    expect(result.minute).toBe(30);
  });

  it("projects UTC instant across local date boundary for America/New_York", () => {
    const instant = new Date("2026-01-15T02:30:00Z");
    const result = projectLocalTimeAndDate(instant, "America/New_York");
    expect(result.localDate).toBe("2026-01-14");
    expect(result.localTime).toBe("21:30");
  });

  it("projects UTC instant across local date boundary for Australia/Sydney", () => {
    const instant = new Date("2026-01-15T20:30:00Z");
    const result = projectLocalTimeAndDate(instant, "Australia/Sydney");
    expect(result.localDate).toBe("2026-01-16");
    expect(result.localTime).toBe("07:30");
  });

  it("calculates end-of-day expiry instant in local timezone", () => {
    const instant = new Date("2026-07-15T18:30:00Z"); // local 19:30 in London (BST = UTC+1)
    const result = projectLocalTimeAndDate(instant, "Europe/London");
    // Local midnight end of 2026-07-15 in London is 2026-07-15 24:00:00 (i.e. 2026-07-16 00:00:00 BST = 2026-07-15 23:00:00Z)
    expect(result.localDayEndUtc.toISOString()).toBe(
      "2026-07-15T23:00:00.000Z",
    );
  });
});

describe("Reminder eligibility rules (isReminderEligible)", () => {
  const config = {
    reminderTime: "19:00",
    timezone: "Europe/London",
    activatedAt: "2026-07-14T12:00:00.000Z",
  };

  it("is eligible when streak > 0, last active is yesterday, no activity today, current local time is at or after reminder time, and activated before reminder time today", () => {
    const now = new Date("2026-07-15T18:05:00.000Z"); // 19:05 BST (Europe/London)
    const streak = { count: 5, lastActiveDate: "2026-07-14" };
    const todayActive = false;

    const eligible = isReminderEligible({
      now,
      config,
      streak,
      todayActive,
    });

    expect(eligible).toBe(true);
  });

  it("is not eligible if streak count is 0", () => {
    const now = new Date("2026-07-15T18:05:00.000Z");
    const streak = { count: 0, lastActiveDate: "" };

    expect(
      isReminderEligible({
        now,
        config,
        streak,
        todayActive: false,
      }),
    ).toBe(false);
  });

  it("is not eligible if learner already active today", () => {
    const now = new Date("2026-07-15T18:05:00.000Z");
    const streak = { count: 5, lastActiveDate: "2026-07-15" };

    expect(
      isReminderEligible({
        now,
        config,
        streak,
        todayActive: true,
      }),
    ).toBe(false);
  });

  it("is not eligible if streak was broken (lastActiveDate is 2+ days ago)", () => {
    const now = new Date("2026-07-15T18:05:00.000Z");
    const streak = { count: 5, lastActiveDate: "2026-07-13" }; // 2 days ago

    expect(
      isReminderEligible({
        now,
        config,
        streak,
        todayActive: false,
      }),
    ).toBe(false);
  });

  it("is not eligible before the configured reminder time", () => {
    const now = new Date("2026-07-15T17:55:00.000Z"); // 18:55 BST (before 19:00)
    const streak = { count: 5, lastActiveDate: "2026-07-14" };

    expect(
      isReminderEligible({
        now,
        config,
        streak,
        todayActive: false,
      }),
    ).toBe(false);
  });

  it("is not eligible if configuration was activated today after the reminder time (no catch-up)", () => {
    // Activated at 19:30 BST (18:30Z) on 2026-07-15
    const lateConfig = {
      ...config,
      activatedAt: "2026-07-15T18:30:00.000Z",
    };
    // Current time is 20:00 BST (19:00Z) on 2026-07-15
    const now = new Date("2026-07-15T19:00:00.000Z");
    const streak = { count: 5, lastActiveDate: "2026-07-14" };

    expect(
      isReminderEligible({
        now,
        config: lateConfig,
        streak,
        todayActive: false,
      }),
    ).toBe(false);
  });
});

describe("Milestone thresholds (isMilestoneThreshold, getMilestoneForStreak)", () => {
  it.each([
    [1, false],
    [2, false],
    [3, true],
    [4, false],
    [7, true],
    [10, false],
    [14, true],
    [20, false],
    [30, true],
    [40, false],
    [50, true],
    [99, false],
    [100, true],
    [150, false],
    [200, true],
    [300, true],
    [500, true],
    [1000, true],
  ])("evaluates threshold for count %d -> %s", (count, expected) => {
    expect(isMilestoneThreshold(count)).toBe(expected);
  });

  it("returns milestone threshold when streak advances from oldCount to newCount", () => {
    expect(getMilestoneForStreak(2, 3)).toBe(3);
    expect(getMilestoneForStreak(6, 7)).toBe(7);
    expect(getMilestoneForStreak(13, 14)).toBe(14);
    expect(getMilestoneForStreak(29, 30)).toBe(30);
    expect(getMilestoneForStreak(49, 50)).toBe(50);
    expect(getMilestoneForStreak(99, 100)).toBe(100);
    expect(getMilestoneForStreak(199, 200)).toBe(200);
  });

  it("returns null if newCount is not a threshold", () => {
    expect(getMilestoneForStreak(3, 4)).toBeNull();
    expect(getMilestoneForStreak(7, 8)).toBeNull();
    expect(getMilestoneForStreak(50, 51)).toBeNull();
  });

  it("returns null if count did not advance", () => {
    expect(getMilestoneForStreak(3, 3)).toBeNull();
    expect(getMilestoneForStreak(7, 7)).toBeNull();
    expect(getMilestoneForStreak(7, 6)).toBeNull();
  });
});

describe("Logical keys (makeReminderLogicalKey, makeMilestoneLogicalKey)", () => {
  it("creates reminder logical key format", () => {
    expect(makeReminderLogicalKey("2026-07-15")).toBe("reminder:2026-07-15");
  });

  it("creates milestone logical key format", () => {
    expect(makeMilestoneLogicalKey("2026-07-15", 7)).toBe(
      "milestone:2026-07-15:7",
    );
  });
});

describe("Message copy generation (formatNotificationCopy)", () => {
  it("formats test notification copy", () => {
    const copy = formatNotificationCopy({ kind: "test" });
    expect(copy.title).toBe("StudyBub notifications");
    expect(copy.body).toBe("Your StudyBub streak notifications are connected.");
    expect(copy.priority).toBe(2);
    expect(copy.tags).toBeUndefined();
  });

  it("formats at-risk reminder notification copy", () => {
    const copy = formatNotificationCopy({ kind: "reminder", streakCount: 5 });
    expect(copy.title).toBe("Keep your 5-day streak");
    expect(copy.body).toBe("Study today to keep it going.");
    expect(copy.priority).toBe(3);
    expect(copy.tags).toEqual(["fire"]);
  });

  it("formats milestone celebration notification copy", () => {
    const copy = formatNotificationCopy({ kind: "milestone", streakCount: 14 });
    expect(copy.title).toBe("14-day streak");
    expect(copy.body).toBe("You reached a 14-day streak. Keep it going!");
    expect(copy.priority).toBe(2);
    expect(copy.tags).toEqual(["tada"]);
  });
});

describe("Delivery failure classification and retry delays", () => {
  it.each<
    [
      NotificationDeliveryFailureClassification,
      { status?: number; errorName?: string; isTimeout?: boolean },
    ]
  >([
    ["timeout", { isTimeout: true }],
    ["timeout", { status: 408 }],
    ["network", { errorName: "TypeError" }],
    ["rate-limited", { status: 429 }],
    ["service-unavailable", { status: 500 }],
    ["service-unavailable", { status: 502 }],
    ["service-unavailable", { status: 503 }],
    ["service-unavailable", { status: 504 }],
    ["rejected", { status: 400 }],
    ["rejected", { status: 401 }],
    ["rejected", { status: 403 }],
    ["rejected", { status: 404 }],
    ["rejected", { status: 422 }],
  ])("classifies failure %s for %o", (expected, input) => {
    expect(classifyDeliveryFailure(input)).toBe(expected);
  });

  it("calculates progressive retry delays (1m, 5m, 15m, 60m, 60m...)", () => {
    expect(calculateNextRetryDelaySeconds(1)).toBe(60);
    expect(calculateNextRetryDelaySeconds(2)).toBe(300);
    expect(calculateNextRetryDelaySeconds(3)).toBe(900);
    expect(calculateNextRetryDelaySeconds(4)).toBe(3600);
    expect(calculateNextRetryDelaySeconds(5)).toBe(3600);
  });

  it("honors longer Retry-After header seconds if provided", () => {
    expect(calculateNextRetryDelaySeconds(1, 120)).toBe(120);
    // If Retry-After is shorter than default backoff, default backoff is used
    expect(calculateNextRetryDelaySeconds(2, 30)).toBe(300);
  });
});
