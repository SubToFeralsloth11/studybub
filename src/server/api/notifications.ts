import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "./requireUserId.server";
import {
  formatNotificationCopy,
  projectLocalTimeAndDate,
  validateDraftNotificationConfig,
  type DraftNotificationConfig,
} from "../../domain/notifications/notifications";
import { defaultState } from "../../domain/persistence/schema";
import { getDatabase } from "../../server/db.server";
import { getPublicAppUrl } from "../../server/notificationConfig.server";
import {
  createTestProof,
  deleteNotificationConfiguration,
  getLatestDeliveryRecord,
  getNotificationConfiguration,
  saveNotificationConfigurationFromProof,
  SaveProofError,
} from "../../server/notificationRepository.server";
import { publishNtfyNotification } from "../../server/ntfyClient.server";

import type { Database } from "bun:sqlite";

export type DeliveryStatusReason =
  | "network"
  | "timeout"
  | "rate-limited"
  | "rejected"
  | "service-unavailable"
  | "expired"
  | null;

export interface DeliveryStatus {
  kind: "reminder" | "milestone";
  outcome: "succeeded" | "failed";
  attemptedAt: string;
  reason: DeliveryStatusReason;
}

export interface NotificationSettings {
  topic: string;
  reminderTime: string;
  timezone: string;
  activatedAt: string;
  lastDelivery: DeliveryStatus | null;
}

export interface TestNotificationSuccess {
  ok: true;
  proofId: string;
  expiresAt: string;
}

export interface TestNotificationFailure {
  ok: false;
  reason:
    | "invalid-values"
    | "timeout"
    | "network"
    | "rate-limited"
    | "rejected"
    | "service-unavailable";
}

export type TestNotificationResult =
  | TestNotificationSuccess
  | TestNotificationFailure;

export interface SaveNotificationSuccess {
  ok: true;
  settings: NotificationSettings;
}

export interface SaveNotificationFailure {
  ok: false;
  reason: "proof-not-found" | "proof-expired" | "proof-consumed";
}

export type SaveNotificationResult =
  | SaveNotificationSuccess
  | SaveNotificationFailure;

function mapLastResultCodeToReason(code: string | null): DeliveryStatusReason {
  if (!code) return null;
  if (
    code === "network" ||
    code === "timeout" ||
    code === "rate-limited" ||
    code === "rejected" ||
    code === "service-unavailable" ||
    code === "expired"
  ) {
    return code;
  }
  return "rejected";
}

function formatAttemptTimeInTimezone(instant: Date, timezone: string): string {
  const projection = projectLocalTimeAndDate(instant, timezone);
  return `${projection.localDate} ${projection.localTime}`;
}

function ensureUserExists(userId: string, db: Database): void {
  const now = new Date().toISOString();
  db.query(
    `INSERT OR IGNORE INTO users (id, display_name, progress_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(userId, userId, JSON.stringify(defaultState()), now, now);
}

/**
 * Derives the latest delivery status projection for a user.
 */
function getLatestDeliveryProjection(
  db: Database,
  userId: string,
): DeliveryStatus | null {
  const record = getLatestDeliveryRecord(db, userId);
  if (
    !record ||
    (record.status !== "succeeded" && record.status !== "failed") ||
    (record.kind !== "reminder" && record.kind !== "milestone")
  ) {
    return null;
  }

  const attemptTimeIso = record.completedAt ?? record.lastAttemptAt;
  const attemptedAt = attemptTimeIso
    ? formatAttemptTimeInTimezone(new Date(attemptTimeIso), record.timezone)
    : "";

  const reason = mapLastResultCodeToReason(record.lastResultCode);

  return {
    kind: record.kind,
    outcome: record.status,
    attemptedAt,
    reason,
  };
}
/**
 * Loads the active notification configuration and latest delivery status for the authenticated user.
 */
export const loadNotificationSettings = createServerFn({
  method: "GET",
}).handler(async (): Promise<NotificationSettings | null> => {
  const userId = await requireUserId();
  const db = getDatabase();

  const config = await getNotificationConfiguration(db, userId);
  if (!config) {
    return null;
  }

  const lastDelivery = getLatestDeliveryProjection(db, userId);

  return {
    topic: config.topic,
    reminderTime: config.reminderTime,
    timezone: config.timezone,
    activatedAt: config.activatedAt,
    lastDelivery,
  };
});

/**
 * Sends a test notification to ntfy.sh and persists a single-use 15-minute proof on success.
 */
export const testNotificationSettings = createServerFn({
  method: "POST",
})
  .validator((data: { draft: DraftNotificationConfig }) => data)
  .handler(async ({ data }): Promise<TestNotificationResult> => {
    const userId = await requireUserId();
    const db = getDatabase();
    ensureUserExists(userId, db);
    if (!validateDraftNotificationConfig(data.draft)) {
      return {
        ok: false,
        reason: "invalid-values",
      };
    }

    const copy = formatNotificationCopy({ kind: "test" });
    const publicUrl = getPublicAppUrl();

    const publishResult = await publishNtfyNotification({
      topic: data.draft.topic,
      title: copy.title,
      body: copy.body,
      priority: copy.priority,
      publicUrl,
    });

    if (!publishResult.ok) {
      return {
        ok: false,
        reason: publishResult.classification,
      };
    }

    const now = new Date();
    const proofId = await createTestProof(db, {
      userId,
      topic: data.draft.topic,
      reminderTime: data.draft.reminderTime,
      timezone: data.draft.timezone,
      now,
    });

    const expiresAt = new Date(now.getTime() + 15 * 60_000).toISOString();

    return {
      ok: true,
      proofId,
      expiresAt,
    };
  });

/**
 * Activates or replaces notification configuration by consuming an exact verified test proof.
 */
export const saveNotificationSettings = createServerFn({
  method: "POST",
})
  .validator((data: { proofId: string }) => data)
  .handler(async ({ data }): Promise<SaveNotificationResult> => {
    const userId = await requireUserId();
    const db = getDatabase();
    const now = new Date();

    try {
      const config = await saveNotificationConfigurationFromProof(
        db,
        data.proofId,
        userId,
        now,
      );

      const lastDelivery = getLatestDeliveryProjection(db, userId);

      return {
        ok: true,
        settings: {
          topic: config.topic,
          reminderTime: config.reminderTime,
          timezone: config.timezone,
          activatedAt: config.activatedAt,
          lastDelivery,
        },
      };
    } catch (error) {
      if (error instanceof SaveProofError) {
        return {
          ok: false,
          reason: error.reason,
        };
      }
      throw error;
    }
  });

/**
 * Deletes notification configuration, delivery records, and pending proofs for the user.
 */
export const removeNotificationSettings = createServerFn({
  method: "POST",
}).handler(async (): Promise<{ ok: true }> => {
  const userId = await requireUserId();
  const db = getDatabase();

  deleteNotificationConfiguration(db, userId);

  return { ok: true };
});
