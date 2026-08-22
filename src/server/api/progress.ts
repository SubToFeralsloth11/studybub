import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "./requireUserId.server";
import {
  getMilestoneForStreak,
  projectLocalTimeAndDate,
} from "../../domain/notifications/notifications";
import {
  defaultState,
  isSavedState,
  parseSavedState,
  type SavedState,
} from "../../domain/persistence/schema";
import { getDatabase } from "../../server/db.server";
import { enqueueMilestoneDelivery } from "../notificationRepository.server";

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Determines if a streak transition is a valid advancement.
 *
 * Valid if:
 * - Streak count advanced by exactly 1 (`newStreak.count === prevStreak.count + 1`) or from 0 to 1
 * - `newStreak.lastActiveDate` is a valid ISO date string (YYYY-MM-DD)
 * - `newStreak.lastActiveDate !== prevStreak.lastActiveDate` and new date >= prev date (or qualifying activity occurred)
 *
 * @param prevStreak - The previous streak state
 * @param newStreak - The new streak state
 * @param prevState - The prior full saved state
 * @param newState - The new full saved state
 * @returns True if streak advancement is valid
 */
export function isValidStreakAdvancement(
  prevStreak: SavedState["streak"],
  newStreak: SavedState["streak"],
  prevState: SavedState,
  newState: SavedState,
): boolean {
  const isStepIncrement =
    newStreak.count === prevStreak.count + 1 ||
    (prevStreak.count === 0 && newStreak.count === 1);

  if (!isStepIncrement) {
    return false;
  }

  if (!newStreak.lastActiveDate || !ISO_DATE_REGEX.test(newStreak.lastActiveDate)) {
    return false;
  }

  const isNewerOrDifferentDate =
    newStreak.lastActiveDate !== prevStreak.lastActiveDate &&
    (prevStreak.lastActiveDate === "" ||
      newStreak.lastActiveDate >= prevStreak.lastActiveDate);

  const hasActivitySignals =
    newState.xp > prevState.xp ||
    newState.activeDates.length > prevState.activeDates.length ||
    newState.activeDates.includes(newStreak.lastActiveDate) ||
    Object.keys(newState.lessons).some(
      (id) =>
        newState.lessons[id]?.completed && !prevState.lessons[id]?.completed,
    ) ||
    Object.keys(newState.challenges).some(
      (id) =>
        newState.challenges[id]?.passed && !prevState.challenges[id]?.passed,
    );

  return isNewerOrDifferentDate && hasActivitySignals;
}

/**
 * Ensures the given user row exists in the database, inserting a default
 * record when it does not. Safe to call before any progress operation.
 *
 * @param userId - The user ID to ensure.
 * @param db - The database instance.
 */
function ensureUserExists(
  userId: string,
  db: ReturnType<typeof getDatabase>,
): void {
  const now = new Date().toISOString();
  db.query(
    `INSERT OR IGNORE INTO users (id, display_name, progress_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(userId, userId, JSON.stringify(defaultState()), now, now);
}

/**
 * Loads the authenticated user's progress state from the database.
 */
export const loadProgress = createServerFn({ method: "GET" }).handler(
  async () => {
    const userId = await requireUserId();
    const db = getDatabase();
    ensureUserExists(userId, db);

    const row = db
      .query("SELECT progress_json FROM users WHERE id = ?")
      .get(userId) as { progress_json: string } | undefined;

    if (!row) {
      return defaultState();
    }

    return parseSavedState(row.progress_json);
  },
);

/**
 * Persists the authenticated user's progress state to the database.
 * In the same SQLite transaction:
 * - Reads the prior persisted state to compare old and new streak counts.
 * - Updates `progress_json` on the `users` row.
 * - If the streak advanced to a milestone threshold and the user has active
 *   notification configuration, enqueues milestone delivery.
 */
export const saveProgress = createServerFn({ method: "POST" })
  .validator((data: { state: SavedState }) => data)
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    if (!data || !isSavedState(data.state)) {
      throw new Error("Invalid progress state.");
    }

    const db = getDatabase();
    const now = new Date();
    const nowIso = now.toISOString();
    ensureUserExists(userId, db);
    const tx = db.transaction(() => {
      // 1. Read existing progress_json for comparison
      const row = db
        .query("SELECT progress_json FROM users WHERE id = ?")
        .get(userId) as { progress_json: string } | undefined;
      const priorState = parseSavedState(row?.progress_json ?? null);

      // 2. Persist new progress_json
      db.run(
        "UPDATE users SET progress_json = ?, updated_at = ? WHERE id = ?",
        [JSON.stringify(data.state), nowIso, userId],
      );

      // 3. Check for milestone transition
      const isEligibleMilestoneTransition = isValidStreakAdvancement(
        priorState.streak,
        data.state.streak,
        priorState,
        data.state,
      );
      const milestone = isEligibleMilestoneTransition
        ? getMilestoneForStreak(
            priorState.streak.count,
            data.state.streak.count,
          )
        : null;

      if (milestone !== null) {
        // Check if user has active notification configuration
        const configRow = db
          .query(
            "SELECT timezone FROM notification_configurations WHERE user_id = ?",
          )
          .get(userId) as { timezone: string } | null;

        if (configRow) {
          const projection = projectLocalTimeAndDate(now, configRow.timezone);
          const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

          enqueueMilestoneDelivery(db, {
            userId,
            streakCount: milestone,
            lastActiveDate: data.state.streak.lastActiveDate,
            localDate: projection.localDate,
            timezone: configRow.timezone,
            now,
            nextAttemptAt: now,
            expiresAt,
          });
        }
      }
    });

    tx();

    return { ok: true };
  });

/**
 * Resets the authenticated user's progress to the default state.
 */
export const resetProgress = createServerFn({ method: "POST" }).handler(
  async () => {
    const userId = await requireUserId();
    const db = getDatabase();
    const now = new Date().toISOString();
    const fresh = defaultState();
    ensureUserExists(userId, db);

    db.run("UPDATE users SET progress_json = ?, updated_at = ? WHERE id = ?", [
      JSON.stringify(fresh),
      now,
      userId,
    ]);

    return fresh;
  },
);
