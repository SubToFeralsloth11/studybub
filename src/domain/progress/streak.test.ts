import { describe, expect, it } from "vitest";

import { nextStreak, streakMessage } from "./streak";

import type { Streak } from "../persistence/schema";

const fresh: Streak = { count: 0, lastActiveDate: "" };

describe("streakMessage", () => {
  it("prompts to start when there is no streak", () => {
    const msg = streakMessage(0, false, false);
    expect(msg).toContain("start your streak");
  });

  it("encourages continued activity when active today", () => {
    const msg = streakMessage(5, true, false);
    expect(msg).toContain("Active today");
    expect(msg).toContain("come back tomorrow");
  });

  it("warns when the streak has reset (not active today, not yesterday)", () => {
    const msg = streakMessage(3, false, false);
    expect(msg).toContain("reset");
    expect(msg).toContain("Start a new one");
  });

  it("warns when the streak is at risk (not active today, last active yesterday)", () => {
    const msg = streakMessage(5, false, true);
    expect(msg).toContain("haven't practised today");
    expect(msg).toContain("5-day streak");
  });

  it("handles a streak of 1 with active today", () => {
    const msg = streakMessage(1, true, false);
    expect(msg).toContain("Active today");
  });

  it("handles a streak of 1 with risk (last active yesterday)", () => {
    const msg = streakMessage(1, false, true);
    expect(msg).toContain("1-day streak");
  });
});

describe("nextStreak", () => {
  it("sets the streak to 1 on first-ever activity", () => {
    expect(nextStreak(fresh, "2026-06-07")).toEqual({
      count: 1,
      lastActiveDate: "2026-06-07",
    });
  });

  it("leaves the streak unchanged for same-day activity", () => {
    const current: Streak = { count: 3, lastActiveDate: "2026-06-07" };
    expect(nextStreak(current, "2026-06-07")).toEqual(current);
  });

  it("increments the streak on the next consecutive day", () => {
    const current: Streak = { count: 3, lastActiveDate: "2026-06-07" };
    expect(nextStreak(current, "2026-06-08")).toEqual({
      count: 4,
      lastActiveDate: "2026-06-08",
    });
  });

  it("resets the streak to 1 after a skipped day", () => {
    const current: Streak = { count: 5, lastActiveDate: "2026-06-07" };
    expect(nextStreak(current, "2026-06-09")).toEqual({
      count: 1,
      lastActiveDate: "2026-06-09",
    });
  });

  it("resets across a longer gap", () => {
    const current: Streak = { count: 9, lastActiveDate: "2026-06-01" };
    expect(nextStreak(current, "2026-06-20").count).toBe(1);
  });

  it("handles a month boundary as a single day", () => {
    const current: Streak = { count: 2, lastActiveDate: "2026-06-30" };
    expect(nextStreak(current, "2026-07-01")).toEqual({
      count: 3,
      lastActiveDate: "2026-07-01",
    });
  });
});
