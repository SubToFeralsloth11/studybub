import { describe, expect, it } from "vitest";

import { recentActiveDays, recordActiveDate } from "./activity";

describe("recordActiveDate", () => {
  it("appends today when the array is empty", () => {
    expect(recordActiveDate([], "2026-06-07")).toEqual(["2026-06-07"]);
  });

  it("appends today when it is later than the last element", () => {
    expect(
      recordActiveDate(["2026-06-05", "2026-06-06"], "2026-06-07"),
    ).toEqual(["2026-06-05", "2026-06-06", "2026-06-07"]);
  });

  it("returns the same array when today is already the last element", () => {
    const dates = ["2026-06-05", "2026-06-06", "2026-06-07"];
    const result = recordActiveDate(dates, "2026-06-07");
    expect(result).toBe(dates);
  });

  it("returns a new array reference when appending", () => {
    const dates = ["2026-06-06"];
    const result = recordActiveDate(dates, "2026-06-07");
    expect(result).not.toBe(dates);
  });

  it("trims to the most recent 90 entries when the cap is exceeded", () => {
    // Build 90 dates starting from 90 days ago.
    const dates: string[] = [];
    for (let i = 0; i < 90; i++) {
      const day = String(i + 1).padStart(2, "0");
      dates.push(`2026-05-${day}`);
    }
    const result = recordActiveDate(dates, "2026-06-08");
    expect(result).toHaveLength(90);
    // The earliest date (2026-05-01) should be dropped.
    expect(result[0]).toBe("2026-05-02");
    expect(result[89]).toBe("2026-06-08");
  });

  it("does not trim when the array is exactly at the cap", () => {
    const dates: string[] = [];
    for (let i = 0; i < 90; i++) {
      dates.push(`2026-0${String(i + 1).padStart(2, "0")}`);
    }
    const result = recordActiveDate(dates.slice(0, 89), dates[89]!);
    expect(result).toHaveLength(90);
  });
});

describe("recentActiveDays", () => {
  it("returns all false when no dates are provided", () => {
    expect(recentActiveDays([], "2026-06-07", 7)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it("marks today as active when today is in the dates", () => {
    const dates = ["2026-06-07"];
    const result = recentActiveDays(dates, "2026-06-07", 7);
    expect(result[6]).toBe(true);
  });

  it("marks the correct days as active across a full week", () => {
    const dates = ["2026-06-01", "2026-06-03", "2026-06-05", "2026-06-07"];
    // today = 2026-06-07, so:
    // index 0 = 2026-06-01 -> active
    // index 1 = 2026-06-02 -> inactive
    // index 2 = 2026-06-03 -> active
    // index 3 = 2026-06-04 -> inactive
    // index 4 = 2026-06-05 -> active
    // index 5 = 2026-06-06 -> inactive
    // index 6 = 2026-06-07 -> active
    const result = recentActiveDays(dates, "2026-06-07", 7);
    expect(result).toEqual([true, false, true, false, true, false, true]);
  });

  it("returns the correct number of days", () => {
    expect(recentActiveDays(["2026-06-07"], "2026-06-07", 3)).toHaveLength(3);
    expect(recentActiveDays(["2026-06-07"], "2026-06-07", 5)).toHaveLength(5);
    expect(recentActiveDays(["2026-06-07"], "2026-06-07", 14)).toHaveLength(14);
  });

  it("handles today not being in the dates", () => {
    const dates = ["2026-06-05", "2026-06-06"];
    const result = recentActiveDays(dates, "2026-06-07", 7);
    expect(result[5]).toBe(true); // 2026-06-06
    expect(result[6]).toBe(false); // 2026-06-07 (today)
  });

  it("handles dates entirely outside the window", () => {
    const dates = ["2026-05-01"];
    const result = recentActiveDays(dates, "2026-06-07", 7);
    expect(result.every((active) => !active)).toBe(true);
  });
});
