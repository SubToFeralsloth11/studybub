/**
 * Background notification worker cycle for streak reminders and milestones.
 *
 * Implements:
 * - Reminder evaluation and enqueueing for active configurations
 * - Claiming due deliveries with 2-minute leases
 * - Activity re-check before delivery (suppresses reminder if learner studied today)
 * - ntfy.sh publishing with stable sequence ID and generic copy
 * - Success completion and failure retry scheduling / expiry
 * - Expired claims release and expired test proofs cleanup
 *
 * @module server/notificationWorker.server
 */

import { getDatabase } from "./db.server";
import { getPublicAppUrl } from "./notificationConfig.server";
import {
  claimDueDeliveries,
  cleanupExpiredProofs,
  completeDeliveryFailure,
  completeDeliverySuccess,
  enqueueReminderDelivery,
  getActiveNotificationConfigurations,
  isDeliveryStillClaimed,
  releaseExpiredClaims,
  suppressDelivery,
  sweepExpiredDeliveries,
  type DeliveryClaimRecord,
} from "./notificationRepository.server";
import { publishNtfyNotification } from "./ntfyClient.server";
import {
  calculateNextRetryDelaySeconds,
  formatNotificationCopy,
  isReminderEligible,
  projectLocalTimeAndDate,
} from "../domain/notifications/notifications";
import { parseSavedState } from "../domain/persistence/schema";

import type { Database } from "bun:sqlite";

export interface WorkerCycleOptions {
  db?: Database;
  now?: Date;
  fetch?: typeof fetch;
}

export interface WorkerCycleResult {
  evaluations: number;
  claims: number;
  succeeded: number;
  failed: number;
  suppressed: number;
  expired: number;
}

function getLearnerStreakAndActivity(
  db: Database,
  userId: string,
  options?: { timezone?: string; now?: Date },
): {
  streakCount: number;
  lastActiveDate: string;
  isTodayActive?: boolean;
} | null {
  const evalNow = options?.now ?? new Date();
  const timezone = options?.timezone;

  // Check progress table first if present (used in isolated unit tests)
  const progressTableExists = db
    .query(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='progress'`,
    )
    .get();

  if (progressTableExists) {
    const progressRow = db
      .query(
        `SELECT streak_count, last_active_date, updated_at FROM progress WHERE user_id = ?`,
      )
      .get(userId) as {
      streak_count: number;
      last_active_date: string | null;
      updated_at?: string;
    } | null;
    if (progressRow) {
      let isTodayActive = false;
      if (timezone) {
        const currentProjection = projectLocalTimeAndDate(evalNow, timezone);
        if (progressRow.last_active_date === currentProjection.localDate) {
          isTodayActive = true;
        }
      }
      return {
        streakCount: progressRow.streak_count,
        lastActiveDate: progressRow.last_active_date ?? "",
        isTodayActive,
      };
    }
  }

  // Check users table (canonical progress_json in production)
  const userRow = db
    .query(`SELECT progress_json FROM users WHERE id = ?`)
    .get(userId) as { progress_json: string } | undefined;

  if (userRow?.progress_json && userRow.progress_json !== "{}") {
    const state = parseSavedState(userRow.progress_json);
    let isTodayActive = false;
    if (timezone) {
      const currentProjection = projectLocalTimeAndDate(evalNow, timezone);
      if (
        state.streak.lastActiveDate === currentProjection.localDate ||
        state.activeDates.includes(currentProjection.localDate)
      ) {
        isTodayActive = true;
      }
    }
    return {
      streakCount: state.streak.count,
      lastActiveDate: state.streak.lastActiveDate,
      isTodayActive,
    };
  }

  return null;
}
/**
 * Runs one cycle of the notification worker.
 */
export async function runNotificationWorkerCycle(
  options: WorkerCycleOptions = {},
): Promise<WorkerCycleResult> {
  const db = options.db ?? getDatabase();
  const now = options.now ?? new Date();
  const fetchFn = options.fetch ?? fetch;

  const result: WorkerCycleResult = {
    evaluations: 0,
    claims: 0,
    succeeded: 0,
    failed: 0,
    suppressed: 0,
    expired: 0,
  };

  // 1. Release any expired claims
  releaseExpiredClaims(db, now);

  // 2. Sweep expired deliveries (unattempted past expiry -> expired, attempted past expiry -> failed)
  result.expired = sweepExpiredDeliveries(db, now);

  // 3. Clean up expired test proofs
  cleanupExpiredProofs(db, now);

  // 4. Evaluate active configurations for due at-risk reminders
  const activeConfigs = await getActiveNotificationConfigurations(db);

  for (const config of activeConfigs) {
    const projection = projectLocalTimeAndDate(now, config.timezone);

    // Only evaluate if local time has arrived at or past reminder time
    if (projection.localTime < config.reminderTime) {
      continue;
    }

    // Load learner progress
    const progress = getLearnerStreakAndActivity(db, config.userId, {
      timezone: config.timezone,
      now,
    });

    if (!progress) {
      continue;
    }

    const todayActive =
      progress.isTodayActive ??
      progress.lastActiveDate === projection.localDate;
    const eligible = isReminderEligible({
      now,
      config: {
        reminderTime: config.reminderTime,
        timezone: config.timezone,
        activatedAt: config.activatedAt,
      },
      streak: {
        count: progress.streakCount,
        lastActiveDate: progress.lastActiveDate,
      },
      todayActive,
    });

    if (eligible) {
      const enqueued = enqueueReminderDelivery(db, {
        userId: config.userId,
        localDate: projection.localDate,
        timezone: config.timezone,
        streakCount: progress.streakCount,
        now,
        nextAttemptAt: now,
        expiresAt: projection.localDayEndUtc,
      });

      if (enqueued) {
        result.evaluations++;
      }
    }
  }

  // 5. Claim due deliveries (batch of 50)
  const claimedDeliveries: DeliveryClaimRecord[] = await claimDueDeliveries(
    db,
    now,
    50,
  );
  result.claims = claimedDeliveries.length;

  const publicUrl = getPublicAppUrl();

  // 6. Process claimed deliveries with bounded concurrency (chunk size 8)
  const CONCURRENCY_LIMIT = 8;
  for (let i = 0; i < claimedDeliveries.length; i += CONCURRENCY_LIMIT) {
    const chunk = claimedDeliveries.slice(i, i + CONCURRENCY_LIMIT);
    await Promise.all(
      chunk.map(async (delivery) => {
        // Revalidate claimed work before publishing: ensure delivery is still claimed and belongs to user
        if (!isDeliveryStillClaimed(db, delivery.id, delivery.userId)) {
          return;
        }
        if (delivery.kind === "reminder") {
          const currentProgress = getLearnerStreakAndActivity(
            db,
            delivery.userId,
            { timezone: delivery.timezone, now },
          );
          const currentProjection = projectLocalTimeAndDate(
            now,
            delivery.timezone,
          );
          const isNowActiveToday =
            currentProgress?.isTodayActive ??
            currentProgress?.lastActiveDate === currentProjection.localDate;
          if (isNowActiveToday) {
            suppressDelivery(db, delivery.id, now);
            result.suppressed++;
            return;
          }
        }

        const copy = formatNotificationCopy({
          kind: delivery.kind,
          streakCount: delivery.streakCount,
        });

        const publishResult = await publishNtfyNotification(
          {
            topic: delivery.topic,
            title: copy.title,
            body: copy.body,
            priority: copy.priority,
            tags: copy.tags,
            sequenceId: delivery.id,
            publicUrl,
          },
          { fetch: fetchFn },
        );

        if (publishResult.ok) {
          completeDeliverySuccess(db, delivery.id, {
            ntfyMessageId: publishResult.ntfyMessageId ?? undefined,
            completedAt: now,
          });
          result.succeeded++;
        } else {
          if (publishResult.isPermanent) {
            completeDeliveryFailure(db, delivery.id, {
              classification: publishResult.classification,
              isPermanent: true,
              failedAt: now,
            });
            result.failed++;
          } else {
            // Calculate next retry delay
            const delaySeconds = calculateNextRetryDelaySeconds(
              delivery.attemptCount,
              publishResult.retryAfterSeconds,
            );
            const nextAttemptAt = new Date(now.getTime() + delaySeconds * 1000);

            completeDeliveryFailure(db, delivery.id, {
              classification: publishResult.classification,
              isPermanent: false,
              nextAttemptAt,
              failedAt: now,
            });
            result.failed++;
          }
        }
      }),
    );
  }
  return result;
}
