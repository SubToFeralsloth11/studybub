/**
 * SQLite repository for streak notifications.
 *
 * Handles:
 * - Encrypted test proof creation, verification, and consumption
 * - Active configuration storage, retrieval, and replacement
 * - Idempotent delivery queueing (reminder, milestone)
 * - Atomic delivery claims and leases
 * - Delivery success/failure/suppression status updates
 * - Expired proof/claim cleanup
 *
 * @module server/notificationRepository.server
 */

import { Database } from "bun:sqlite";

import { decryptText, encryptText } from "./encryption.server";
import {
  makeMilestoneLogicalKey,
  makeReminderLogicalKey,
  type NotificationDeliveryFailureClassification,
  type NotificationKind,
} from "../domain/notifications/notifications";

export type SaveProofErrorReason =
  | "proof-not-found"
  | "proof-expired"
  | "proof-consumed";

export class SaveProofError extends Error {
  readonly reason: SaveProofErrorReason;

  constructor(reason: SaveProofErrorReason, message?: string) {
    super(
      message ??
        `Failed to save notification configuration from proof: ${reason}`,
    );
    this.name = "SaveProofError";
    this.reason = reason;
  }
}

export interface CreateProofInput {
  userId: string;
  topic: string;
  reminderTime: string;
  timezone: string;
  now: Date;
}

export interface TestProofRecord {
  id: string;
  userId: string;
  topic: string;
  reminderTime: string;
  timezone: string;
  succeededAt: string;
  expiresAt: string;
  consumedAt: string | null;
}

export interface NotificationConfigRecord {
  userId: string;
  topic: string;
  reminderTime: string;
  timezone: string;
  activatedAt: string;
  testedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnqueueReminderInput {
  userId: string;
  localDate: string;
  timezone: string;
  streakCount: number;
  now: Date;
  nextAttemptAt: Date;
  expiresAt: Date;
}

export interface EnqueueMilestoneInput {
  userId: string;
  lastActiveDate: string;
  streakCount: number;
  timezone: string;
  localDate: string;
  now: Date;
  nextAttemptAt: Date;
  expiresAt: Date;
}

export interface DeliveryClaimRecord {
  id: string;
  userId: string;
  topic: string;
  kind: NotificationKind;
  streakCount: number;
  localDate: string;
  timezone: string;
  attemptCount: number;
  expiresAt: string;
}

export interface DeliveryFailureInput {
  classification: NotificationDeliveryFailureClassification;
  isPermanent: boolean;
  nextAttemptAt?: Date;
  failedAt: Date;
}

export interface DeliverySuccessInput {
  ntfyMessageId?: string;
  completedAt: Date;
}

export interface DeliveryRecord {
  id: string;
  userId: string;
  logicalKey: string;
  kind: NotificationKind;
  streakCount: number;
  localDate: string;
  timezone: string;
  status:
    | "pending"
    | "claimed"
    | "succeeded"
    | "failed"
    | "expired"
    | "suppressed";
  attemptCount: number;
  nextAttemptAt: string;
  claimUntil: string | null;
  expiresAt: string;
  lastAttemptAt: string | null;
  completedAt: string | null;
  lastResultCode: string | null;
  ntfyMessageId: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Creates an encrypted test proof with a 15-minute expiry.
 */
export async function createTestProof(
  db: Database,
  input: CreateProofInput,
): Promise<string> {
  const proofId = crypto.randomUUID();
  const encrypted = await encryptText(input.topic);
  const succeededAt = input.now.toISOString();
  const expiresAt = new Date(input.now.getTime() + 15 * 60_000).toISOString();

  db.run(
    `INSERT INTO notification_test_proofs (
      id, user_id, topic_ciphertext, topic_iv, topic_auth_tag,
      reminder_time, timezone, succeeded_at, expires_at, consumed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [
      proofId,
      input.userId,
      encrypted.ciphertext,
      encrypted.iv,
      encrypted.authTag,
      input.reminderTime,
      input.timezone,
      succeededAt,
      expiresAt,
    ],
  );

  return proofId;
}

interface TestProofRow {
  id: string;
  user_id: string;
  topic_ciphertext: string;
  topic_iv: string;
  topic_auth_tag: string;
  reminder_time: string;
  timezone: string;
  succeeded_at: string;
  expires_at: string;
  consumed_at: string | null;
}

/**
 * Retrieves a usable (non-consumed, non-expired, matching user) test proof and decrypts its topic.
 */
export async function getUsableTestProof(
  db: Database,
  proofId: string,
  userId: string,
  now: Date,
): Promise<TestProofRecord | null> {
  const row = db
    .query(
      `SELECT * FROM notification_test_proofs
       WHERE id = ? AND user_id = ? AND consumed_at IS NULL AND expires_at > ?`,
    )
    .get(proofId, userId, now.toISOString()) as TestProofRow | null;

  if (!row) {
    return null;
  }

  const topic = await decryptText(
    row.topic_ciphertext,
    row.topic_iv,
    row.topic_auth_tag,
  );

  return {
    id: row.id,
    userId: row.user_id,
    topic,
    reminderTime: row.reminder_time,
    timezone: row.timezone,
    succeededAt: row.succeeded_at,
    expiresAt: row.expires_at,
    consumedAt: row.consumed_at,
  };
}

interface NotificationConfigRow {
  user_id: string;
  topic_ciphertext: string;
  topic_iv: string;
  topic_auth_tag: string;
  reminder_time: string;
  timezone: string;
  activated_at: string;
  tested_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Activates or replaces notification configuration by consuming a valid test proof within an immediate transaction.
 */
export async function saveNotificationConfigurationFromProof(
  db: Database,
  proofId: string,
  userId: string,
  now: Date,
): Promise<NotificationConfigRecord> {
  const nowIso = now.toISOString();

  const transaction = db.transaction(() => {
    const existingProof = db
      .query(
        `SELECT * FROM notification_test_proofs WHERE id = ? AND user_id = ?`,
      )
      .get(proofId, userId) as TestProofRow | null;

    if (!existingProof) {
      throw new SaveProofError("proof-not-found", "Test proof not found.");
    }

    if (existingProof.consumed_at !== null) {
      throw new SaveProofError(
        "proof-consumed",
        "Test proof has already been consumed.",
      );
    }

    if (existingProof.expires_at <= nowIso) {
      throw new SaveProofError("proof-expired", "Test proof has expired.");
    }

    const proofRow = existingProof;

    // Mark proof consumed
    db.run(`UPDATE notification_test_proofs SET consumed_at = ? WHERE id = ?`, [
      nowIso,
      proofId,
    ]);

    // Cancel / delete pending and claimed deliveries from prior configuration
    db.run(
      `DELETE FROM notification_deliveries
       WHERE user_id = ? AND status IN ('pending', 'claimed')`,
      [userId],
    );

    const existing = db
      .query(
        `SELECT created_at FROM notification_configurations WHERE user_id = ?`,
      )
      .get(userId) as { created_at: string } | null;

    const createdAt = existing ? existing.created_at : nowIso;

    db.run(
      `INSERT INTO notification_configurations (
        user_id, topic_ciphertext, topic_iv, topic_auth_tag,
        reminder_time, timezone, activated_at, tested_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        topic_ciphertext = excluded.topic_ciphertext,
        topic_iv = excluded.topic_iv,
        topic_auth_tag = excluded.topic_auth_tag,
        reminder_time = excluded.reminder_time,
        timezone = excluded.timezone,
        activated_at = excluded.activated_at,
        tested_at = excluded.tested_at,
        updated_at = excluded.updated_at`,
      [
        userId,
        proofRow.topic_ciphertext,
        proofRow.topic_iv,
        proofRow.topic_auth_tag,
        proofRow.reminder_time,
        proofRow.timezone,
        nowIso,
        proofRow.succeeded_at,
        createdAt,
        nowIso,
      ],
    );
  });

  transaction();

  const loaded = await getNotificationConfiguration(db, userId);
  if (!loaded) {
    throw new Error("Failed to load saved notification configuration.");
  }
  return loaded;
}

/**
 * Loads and decrypts active notification configuration for a user.
 */
export async function getNotificationConfiguration(
  db: Database,
  userId: string,
): Promise<NotificationConfigRecord | null> {
  const row = db
    .query(`SELECT * FROM notification_configurations WHERE user_id = ?`)
    .get(userId) as NotificationConfigRow | null;

  if (!row) {
    return null;
  }

  const topic = await decryptText(
    row.topic_ciphertext,
    row.topic_iv,
    row.topic_auth_tag,
  );

  return {
    userId: row.user_id,
    topic,
    reminderTime: row.reminder_time,
    timezone: row.timezone,
    activatedAt: row.activated_at,
    testedAt: row.tested_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Loads all active configurations across all users (used by background scheduler).
 */
export async function getActiveNotificationConfigurations(
  db: Database,
): Promise<NotificationConfigRecord[]> {
  const rows = db
    .query(`SELECT * FROM notification_configurations`)
    .all() as NotificationConfigRow[];

  const records: NotificationConfigRecord[] = [];
  for (const row of rows) {
    const topic = await decryptText(
      row.topic_ciphertext,
      row.topic_iv,
      row.topic_auth_tag,
    );
    records.push({
      userId: row.user_id,
      topic,
      reminderTime: row.reminder_time,
      timezone: row.timezone,
      activatedAt: row.activated_at,
      testedAt: row.tested_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  return records;
}

/**
 * Deletes notification configuration, associated deliveries, and test proofs for a user.
 */
export function deleteNotificationConfiguration(
  db: Database,
  userId: string,
): void {
  const transaction = db.transaction(() => {
    db.run(`DELETE FROM notification_test_proofs WHERE user_id = ?`, [userId]);
    db.run(`DELETE FROM notification_deliveries WHERE user_id = ?`, [userId]);
    db.run(`DELETE FROM notification_configurations WHERE user_id = ?`, [
      userId,
    ]);
  });
  transaction();
}

/**
 * Enqueues an at-risk reminder delivery idempotently using internal key `reminder:{localDate}`.
 * Returns true if inserted, false if ignored due to uniqueness constraint.
 */
export function enqueueReminderDelivery(
  db: Database,
  input: EnqueueReminderInput,
): boolean {
  const id = crypto.randomUUID();
  const logicalKey = makeReminderLogicalKey(input.localDate);
  const nowIso = input.now.toISOString();
  const nextAttemptIso = input.nextAttemptAt.toISOString();
  const expiresIso = input.expiresAt.toISOString();

  const result = db.run(
    `INSERT OR IGNORE INTO notification_deliveries (
      id, user_id, logical_key, kind, streak_count, local_date, timezone,
      status, attempt_count, next_attempt_at, claim_until, expires_at,
      created_at, updated_at
    ) VALUES (?, ?, ?, 'reminder', ?, ?, ?, 'pending', 0, ?, NULL, ?, ?, ?)`,
    [
      id,
      input.userId,
      logicalKey,
      input.streakCount,
      input.localDate,
      input.timezone,
      nextAttemptIso,
      expiresIso,
      nowIso,
      nowIso,
    ],
  );

  return result.changes > 0;
}

/**
 * Enqueues a milestone celebration delivery idempotently using internal key `milestone:{lastActiveDate}:{streakCount}`.
 * Returns true if inserted, false if ignored due to uniqueness constraint.
 */
export function enqueueMilestoneDelivery(
  db: Database,
  input: EnqueueMilestoneInput,
): boolean {
  const id = crypto.randomUUID();
  const logicalKey = makeMilestoneLogicalKey(
    input.lastActiveDate,
    input.streakCount,
  );
  const nowIso = input.now.toISOString();
  const nextAttemptIso = input.nextAttemptAt.toISOString();
  const expiresIso = input.expiresAt.toISOString();

  const result = db.run(
    `INSERT OR IGNORE INTO notification_deliveries (
      id, user_id, logical_key, kind, streak_count, local_date, timezone,
      status, attempt_count, next_attempt_at, claim_until, expires_at,
      created_at, updated_at
    ) VALUES (?, ?, ?, 'milestone', ?, ?, ?, 'pending', 0, ?, NULL, ?, ?, ?)`,
    [
      id,
      input.userId,
      logicalKey,
      input.streakCount,
      input.localDate,
      input.timezone,
      nextAttemptIso,
      expiresIso,
      nowIso,
      nowIso,
    ],
  );

  return result.changes > 0;
}

interface DeliveryClaimRow {
  id: string;
  user_id: string;
  kind: NotificationKind;
  streak_count: number;
  local_date: string;
  timezone: string;
  attempt_count: number;
  expires_at: string;
  topic_ciphertext: string;
  topic_iv: string;
  topic_auth_tag: string;
}

/**
 * Atomically claims due pending deliveries and loads decrypted configuration topics.
 * Applies a 2-minute lease (`claim_until`).
 */
export async function claimDueDeliveries(
  db: Database,
  now: Date,
  batchSize: number = 50,
): Promise<DeliveryClaimRecord[]> {
  const nowIso = now.toISOString();
  const leaseUntilIso = new Date(now.getTime() + 2 * 60_000).toISOString();

  let claimedRows: DeliveryClaimRow[] = [];

  const transaction = db.transaction(() => {
    // Select due pending deliveries joined with active configuration
    claimedRows = db
      .query(
        `SELECT d.id, d.user_id, d.kind, d.streak_count, d.local_date, d.timezone,
                d.attempt_count, d.expires_at,
                c.topic_ciphertext, c.topic_iv, c.topic_auth_tag
         FROM notification_deliveries d
         JOIN notification_configurations c ON d.user_id = c.user_id
         WHERE d.status = 'pending' AND d.next_attempt_at <= ? AND d.expires_at > ?
         ORDER BY d.next_attempt_at ASC
         LIMIT ?`,
      )
      .all(nowIso, nowIso, batchSize) as DeliveryClaimRow[];

    if (claimedRows.length > 0) {
      const placeholders = claimedRows.map(() => "?").join(",");
      const ids = claimedRows.map((r) => r.id);
      db.run(
        `UPDATE notification_deliveries
         SET status = 'claimed',
             attempt_count = attempt_count + 1,
             last_attempt_at = ?,
             claim_until = ?,
             updated_at = ?
         WHERE id IN (${placeholders})`,
        [nowIso, leaseUntilIso, nowIso, ...ids],
      );
    }
  });

  transaction();

  const records: DeliveryClaimRecord[] = [];
  for (const row of claimedRows) {
    const topic = await decryptText(
      row.topic_ciphertext,
      row.topic_iv,
      row.topic_auth_tag,
    );
    records.push({
      id: row.id,
      userId: row.user_id,
      topic,
      kind: row.kind,
      streakCount: row.streak_count,
      localDate: row.local_date,
      timezone: row.timezone,
      attemptCount: row.attempt_count + 1,
      expiresAt: row.expires_at,
    });
  }

  return records;
}

/**
 * Checks whether a delivery is still currently claimed for the specified user.
 */
export function isDeliveryStillClaimed(
  db: Database,
  deliveryId: string,
  userId: string,
): boolean {
  const row = db
    .query(
      `SELECT id FROM notification_deliveries
       WHERE id = ? AND user_id = ? AND status = 'claimed'`,
    )
    .get(deliveryId, userId) as { id: string } | null;
  return row !== null;
}

/**
 * Sweeps and transitions expired deliveries:
 * - Unattempted (attempt_count = 0) pending deliveries past expires_at -> 'expired'
 * - Attempted (attempt_count >= 1) pending/claimed deliveries past expires_at (or retry >= expires_at) -> 'failed' with last_result_code = 'expired'
 * Returns total count of transitioned deliveries.
 */
export function sweepExpiredDeliveries(db: Database, now: Date): number {
  const nowIso = now.toISOString();
  let expiredCount = 0;

  const transaction = db.transaction(() => {
    // 1. Unattempted pending past expires_at -> 'expired'
    const unattemptedResult = db.run(
      `UPDATE notification_deliveries
       SET status = 'expired',
           completed_at = ?,
           claim_until = NULL,
           updated_at = ?
       WHERE status = 'pending' AND attempt_count = 0 AND expires_at <= ?`,
      [nowIso, nowIso, nowIso],
    );
    expiredCount += unattemptedResult.changes;

    // 2. Attempted pending/claimed past expires_at (or retry >= expires_at) -> 'failed' with last_result_code = 'expired'
    const attemptedResult = db.run(
      `UPDATE notification_deliveries
       SET status = 'failed',
           last_result_code = 'expired',
           completed_at = ?,
           claim_until = NULL,
           updated_at = ?
       WHERE ((status = 'pending' AND (expires_at <= ? OR next_attempt_at >= expires_at))
              OR (status = 'claimed' AND expires_at <= ?))
         AND attempt_count >= 1`,
      [nowIso, nowIso, nowIso, nowIso],
    );
    expiredCount += attemptedResult.changes;
  });

  transaction();
  return expiredCount;
}

/**
 * Releases expired claims (claim_until <= now) back to 'pending'.
 */
export function releaseExpiredClaims(db: Database, now: Date): number {
  const nowIso = now.toISOString();
  const result = db.run(
    `UPDATE notification_deliveries
     SET status = 'pending',
         claim_until = NULL,
         updated_at = ?
     WHERE status = 'claimed' AND claim_until <= ?`,
    [nowIso, nowIso],
  );
  return result.changes;
}

/**
 * Marks a claimed delivery as successfully completed.
 */
export function completeDeliverySuccess(
  db: Database,
  deliveryId: string,
  input: DeliverySuccessInput,
): void {
  const completedIso = input.completedAt.toISOString();
  db.run(
    `UPDATE notification_deliveries
     SET status = 'succeeded',
         ntfy_message_id = ?,
         completed_at = ?,
         claim_until = NULL,
         updated_at = ?
     WHERE id = ?`,
    [input.ntfyMessageId ?? null, completedIso, completedIso, deliveryId],
  );
}

/**
 * Completes delivery failure:
 * - If permanent, transitions to 'failed'.
 * - If temporary and before expiry, resets to 'pending' with `next_attempt_at`.
 * - If temporary but at/past expiry, transitions to 'failed'.
 */
export function completeDeliveryFailure(
  db: Database,
  deliveryId: string,
  input: DeliveryFailureInput,
): void {
  const failedIso = input.failedAt.toISOString();

  if (input.isPermanent || !input.nextAttemptAt) {
    db.run(
      `UPDATE notification_deliveries
       SET status = 'failed',
           last_result_code = ?,
           completed_at = ?,
           claim_until = NULL,
           updated_at = ?
       WHERE id = ?`,
      [input.classification, failedIso, failedIso, deliveryId],
    );
    return;
  }

  const nextAttemptIso = input.nextAttemptAt.toISOString();

  // Check if nextAttempt exceeds expiry
  const row = db
    .query(`SELECT expires_at FROM notification_deliveries WHERE id = ?`)
    .get(deliveryId) as { expires_at: string } | null;

  if (row && nextAttemptIso >= row.expires_at) {
    db.run(
      `UPDATE notification_deliveries
       SET status = 'failed',
           last_result_code = 'expired',
           completed_at = ?,
           claim_until = NULL,
           updated_at = ?
       WHERE id = ?`,
      [failedIso, failedIso, deliveryId],
    );
  } else {
    db.run(
      `UPDATE notification_deliveries
       SET status = 'pending',
           last_result_code = ?,
           next_attempt_at = ?,
           claim_until = NULL,
           updated_at = ?
       WHERE id = ?`,
      [input.classification, nextAttemptIso, failedIso, deliveryId],
    );
  }
}

/**
 * Marks a delivery as suppressed (e.g. learner recorded activity before attempt).
 */
export function suppressDelivery(
  db: Database,
  deliveryId: string,
  now: Date,
): void {
  const nowIso = now.toISOString();
  db.run(
    `UPDATE notification_deliveries
     SET status = 'suppressed',
         completed_at = ?,
         claim_until = NULL,
         updated_at = ?
     WHERE id = ?`,
    [nowIso, nowIso, deliveryId],
  );
}

/**
 * Deletes expired or consumed test proofs.
 */
export function cleanupExpiredProofs(db: Database, now: Date): number {
  const nowIso = now.toISOString();
  const result = db.run(
    `DELETE FROM notification_test_proofs
     WHERE expires_at <= ? OR consumed_at IS NOT NULL`,
    [nowIso],
  );
  return result.changes;
}

interface DeliveryRow {
  id: string;
  user_id: string;
  logical_key: string;
  kind: NotificationKind;
  streak_count: number;
  local_date: string;
  timezone: string;
  status:
    | "pending"
    | "claimed"
    | "succeeded"
    | "failed"
    | "expired"
    | "suppressed";
  attempt_count: number;
  next_attempt_at: string;
  claim_until: string | null;
  expires_at: string;
  last_attempt_at: string | null;
  completed_at: string | null;
  last_result_code: string | null;
  ntfy_message_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Returns the latest completed delivery (succeeded or failed) for a user,
 * ordered by completed_at / last_attempt_at / updated_at descending.
 */
export function getLatestDeliveryRecord(
  db: Database,
  userId: string,
): DeliveryRecord | null {
  const row = db
    .query(
      `SELECT * FROM notification_deliveries
       WHERE user_id = ? AND status IN ('succeeded', 'failed')
       ORDER BY COALESCE(completed_at, last_attempt_at, updated_at) DESC
       LIMIT 1`,
    )
    .get(userId) as DeliveryRow | null;

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    logicalKey: row.logical_key,
    kind: row.kind,
    streakCount: row.streak_count,
    localDate: row.local_date,
    timezone: row.timezone,
    status: row.status,
    attemptCount: row.attempt_count,
    nextAttemptAt: row.next_attempt_at,
    claimUntil: row.claim_until,
    expiresAt: row.expires_at,
    lastAttemptAt: row.last_attempt_at,
    completedAt: row.completed_at,
    lastResultCode: row.last_result_code,
    ntfyMessageId: row.ntfy_message_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
