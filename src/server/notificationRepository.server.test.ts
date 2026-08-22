import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, it } from "vitest";

import { initSchema, resetDatabase } from "./db.server";
import { resetEncryptionKey } from "./encryption.server";
import {
  claimDueDeliveries,
  cleanupExpiredProofs,
  completeDeliveryFailure,
  completeDeliverySuccess,
  createTestProof,
  deleteNotificationConfiguration,
  enqueueMilestoneDelivery,
  enqueueReminderDelivery,
  getActiveNotificationConfigurations,
  getNotificationConfiguration,
  getUsableTestProof,
  isDeliveryStillClaimed,
  releaseExpiredClaims,
  saveNotificationConfigurationFromProof,
  SaveProofError,
  suppressDelivery,
  sweepExpiredDeliveries,
  getLatestDeliveryRecord,
  type NotificationConfigRecord,
} from "./notificationRepository.server";

const VALID_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("Notification Repository", () => {
  let db: Database;
  const user1 = "user-1";
  const user2 = "user-2";

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = VALID_KEY;
    resetEncryptionKey();
    resetDatabase();

    db = new Database(":memory:");
    db.run("PRAGMA foreign_keys = ON");

    // Init schema tables
    initSchema(db);

    // Seed users
    const nowIso = "2026-07-15T12:00:00.000Z";
    db.run(
      "INSERT INTO users (id, display_name, progress_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [user1, "Learner One", "{}", nowIso, nowIso],
    );
    db.run(
      "INSERT INTO users (id, display_name, progress_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [user2, "Learner Two", "{}", nowIso, nowIso],
    );
  });

  describe("createTestProof & getUsableTestProof", () => {
    it("creates an encrypted test proof with 15-minute expiry and retrieves it when usable", async () => {
      const now = new Date("2026-07-15T12:00:00.000Z");
      const proofId = await createTestProof(db, {
        userId: user1,
        topic: "my-topic-123",
        reminderTime: "19:00",
        timezone: "Europe/London",
        now,
      });

      expect(typeof proofId).toBe("string");
      expect(proofId.length).toBeGreaterThan(0);

      // Read directly from DB to verify encrypted storage
      const row = db
        .query("SELECT * FROM notification_test_proofs WHERE id = ?")
        .get(proofId) as any;
      expect(row.topic_ciphertext).not.toBe("my-topic-123");
      expect(row.topic_iv).toBeDefined();
      expect(row.topic_auth_tag).toBeDefined();
      expect(row.expires_at).toBe("2026-07-15T12:15:00.000Z");
      expect(row.consumed_at).toBeNull();

      // Retrieve proof
      const usable = await getUsableTestProof(db, proofId, user1, now);
      expect(usable).not.toBeNull();
      expect(usable?.topic).toBe("my-topic-123");
      expect(usable?.reminderTime).toBe("19:00");
      expect(usable?.timezone).toBe("Europe/London");
    });

    it("returns null if proof belongs to a different user (user isolation)", async () => {
      const now = new Date("2026-07-15T12:00:00.000Z");
      const proofId = await createTestProof(db, {
        userId: user1,
        topic: "my-topic-123",
        reminderTime: "19:00",
        timezone: "Europe/London",
        now,
      });

      const usableForUser2 = await getUsableTestProof(db, proofId, user2, now);
      expect(usableForUser2).toBeNull();
    });

    it("returns null if proof is expired (> 15 minutes)", async () => {
      const createTime = new Date("2026-07-15T12:00:00.000Z");
      const proofId = await createTestProof(db, {
        userId: user1,
        topic: "my-topic-123",
        reminderTime: "19:00",
        timezone: "Europe/London",
        now: createTime,
      });

      const later = new Date("2026-07-15T12:15:01.000Z");
      const usable = await getUsableTestProof(db, proofId, user1, later);
      expect(usable).toBeNull();
    });

    it("returns null if proof is already consumed", async () => {
      const now = new Date("2026-07-15T12:00:00.000Z");
      const proofId = await createTestProof(db, {
        userId: user1,
        topic: "my-topic-123",
        reminderTime: "19:00",
        timezone: "Europe/London",
        now,
      });

      await saveNotificationConfigurationFromProof(db, proofId, user1, now);

      const usableAgain = await getUsableTestProof(db, proofId, user1, now);
      expect(usableAgain).toBeNull();
    });
  });

  describe("saveNotificationConfigurationFromProof & getNotificationConfiguration", () => {
    it("activates configuration from proof, encrypts topic, marks proof consumed, and allows retrieval", async () => {
      const now = new Date("2026-07-15T12:00:00.000Z");
      const proofId = await createTestProof(db, {
        userId: user1,
        topic: "active-topic-456",
        reminderTime: "18:30",
        timezone: "Europe/London",
        now,
      });

      const saveTime = new Date("2026-07-15T12:05:00.000Z");
      const config = await saveNotificationConfigurationFromProof(
        db,
        proofId,
        user1,
        saveTime,
      );

      expect(config).not.toBeNull();
      expect(config?.topic).toBe("active-topic-456");
      expect(config?.reminderTime).toBe("18:30");
      expect(config?.timezone).toBe("Europe/London");
      expect(config?.activatedAt).toBe(saveTime.toISOString());
      expect(config?.testedAt).toBe(now.toISOString());

      // Check DB values directly
      const row = db
        .query("SELECT * FROM notification_configurations WHERE user_id = ?")
        .get(user1) as any;
      expect(row.topic_ciphertext).not.toBe("active-topic-456");

      // Verify loaded config
      const loaded = await getNotificationConfiguration(db, user1);
      expect(loaded).toEqual(config);
    });

    it("cancels / removes prior pending or claimed deliveries on replacement", async () => {
      const now = new Date("2026-07-15T12:00:00.000Z");
      const proof1 = await createTestProof(db, {
        userId: user1,
        topic: "topic-1",
        reminderTime: "18:30",
        timezone: "Europe/London",
        now,
      });
      await saveNotificationConfigurationFromProof(db, proof1, user1, now);

      // Enqueue a pending reminder
      enqueueReminderDelivery(db, {
        userId: user1,
        localDate: "2026-07-15",
        timezone: "Europe/London",
        streakCount: 5,
        now,
        nextAttemptAt: now,
        expiresAt: new Date("2026-07-15T23:00:00.000Z"),
      });

      const beforeRows = db
        .query("SELECT status FROM notification_deliveries WHERE user_id = ?")
        .all(user1) as any[];
      expect(beforeRows).toHaveLength(1);
      expect(beforeRows[0].status).toBe("pending");

      // Replace configuration with new proof
      const replacementTime = new Date("2026-07-15T14:00:00.000Z");
      const proof2 = await createTestProof(db, {
        userId: user1,
        topic: "topic-2",
        reminderTime: "19:00",
        timezone: "Europe/London",
        now: replacementTime,
      });
      await saveNotificationConfigurationFromProof(
        db,
        proof2,
        user1,
        replacementTime,
      );

      const afterRows = db
        .query("SELECT status FROM notification_deliveries WHERE user_id = ?")
        .all(user1) as any[];
      // Pending work from previous configuration was deleted/cancelled
      expect(afterRows).toHaveLength(0);
    });

    it("rejects saving with typed SaveProofError for missing, expired, and foreign proof", async () => {
      const now = new Date("2026-07-15T12:00:00.000Z");
      const proofId = await createTestProof(db, {
        userId: user1,
        topic: "topic-1",
        reminderTime: "18:30",
        timezone: "Europe/London",
        now,
      });

      // User2 attempts to consume User1's proof -> proof-not-found for user2
      const user2Promise = saveNotificationConfigurationFromProof(
        db,
        proofId,
        user2,
        now,
      );
      await expect(user2Promise).rejects.toThrow(SaveProofError);
      await expect(user2Promise).rejects.toMatchObject({
        reason: "proof-not-found",
      });

      // Consumed test proof -> proof-consumed
      await saveNotificationConfigurationFromProof(db, proofId, user1, now);
      const consumedPromise = saveNotificationConfigurationFromProof(
        db,
        proofId,
        user1,
        now,
      );
      await expect(consumedPromise).rejects.toThrow(SaveProofError);
      await expect(consumedPromise).rejects.toMatchObject({
        reason: "proof-consumed",
      });

      // Expired test proof -> proof-expired
      const expiredProofId = await createTestProof(db, {
        userId: user1,
        topic: "topic-expired",
        reminderTime: "18:30",
        timezone: "Europe/London",
        now,
      });
      const futureTime = new Date("2026-07-15T12:30:00.000Z"); // past 15 min expiry
      const expiredPromise = saveNotificationConfigurationFromProof(
        db,
        expiredProofId,
        user1,
        futureTime,
      );
      await expect(expiredPromise).rejects.toThrow(SaveProofError);
      await expect(expiredPromise).rejects.toMatchObject({
        reason: "proof-expired",
      });
    });
  });

  describe("deleteNotificationConfiguration (cascade removal)", () => {
    it("deletes configuration, deliveries, and associated history", async () => {
      const now = new Date("2026-07-15T12:00:00.000Z");
      const proof = await createTestProof(db, {
        userId: user1,
        topic: "topic-1",
        reminderTime: "18:30",
        timezone: "Europe/London",
        now,
      });
      await saveNotificationConfigurationFromProof(db, proof, user1, now);

      enqueueReminderDelivery(db, {
        userId: user1,
        localDate: "2026-07-15",
        timezone: "Europe/London",
        streakCount: 5,
        now,
        nextAttemptAt: now,
        expiresAt: new Date("2026-07-15T23:00:00.000Z"),
      });

      deleteNotificationConfiguration(db, user1);

      const config = await getNotificationConfiguration(db, user1);
      expect(config).toBeNull();

      const deliveries = db
        .query("SELECT * FROM notification_deliveries WHERE user_id = ?")
        .all(user1);
      expect(deliveries).toHaveLength(0);
    });
  });

  describe("Delivery queue: enqueue, logical deduplication, claims, and lifecycle", () => {
    beforeEach(async () => {
      const now = new Date("2026-07-15T12:00:00.000Z");
      const proof = await createTestProof(db, {
        userId: user1,
        topic: "topic-user-1",
        reminderTime: "19:00",
        timezone: "Europe/London",
        now,
      });
      await saveNotificationConfigurationFromProof(db, proof, user1, now);
    });

    it("enqueues reminder delivery with internal logical key idempotency (UNIQUE user_id, logical_key)", () => {
      const now = new Date("2026-07-15T18:00:00.000Z");
      const res1 = enqueueReminderDelivery(db, {
        userId: user1,
        localDate: "2026-07-15",
        timezone: "Europe/London",
        streakCount: 5,
        now,
        nextAttemptAt: now,
        expiresAt: new Date("2026-07-15T23:00:00.000Z"),
      });
      expect(res1).toBe(true);

      // Second enqueue with same user and same local date is ignored (idempotent)
      const res2 = enqueueReminderDelivery(db, {
        userId: user1,
        localDate: "2026-07-15",
        timezone: "Europe/London",
        streakCount: 5,
        now,
        nextAttemptAt: now,
        expiresAt: new Date("2026-07-15T23:00:00.000Z"),
      });
      expect(res2).toBe(false);

      const rows = db
        .query("SELECT * FROM notification_deliveries WHERE user_id = ?")
        .all(user1) as any[];
      expect(rows).toHaveLength(1);
      expect(rows[0].logical_key).toBe("reminder:2026-07-15");
      expect(rows[0].kind).toBe("reminder");
    });

    it("enqueues milestone delivery idempotently", () => {
      const now = new Date("2026-07-15T18:00:00.000Z");
      const res1 = enqueueMilestoneDelivery(db, {
        userId: user1,
        lastActiveDate: "2026-07-15",
        streakCount: 7,
        timezone: "Europe/London",
        localDate: "2026-07-15",
        now,
        nextAttemptAt: now,
        expiresAt: new Date("2026-07-16T18:00:00.000Z"),
      });
      expect(res1).toBe(true);

      const res2 = enqueueMilestoneDelivery(db, {
        userId: user1,
        lastActiveDate: "2026-07-15",
        streakCount: 7,
        timezone: "Europe/London",
        localDate: "2026-07-15",
        now,
        nextAttemptAt: now,
        expiresAt: new Date("2026-07-16T18:00:00.000Z"),
      });
      expect(res2).toBe(false);

      const rows = db
        .query(
          "SELECT * FROM notification_deliveries WHERE user_id = ? AND kind = 'milestone'",
        )
        .all(user1) as any[];
      expect(rows).toHaveLength(1);
      expect(rows[0].logical_key).toBe("milestone:2026-07-15:7");
    });

    it("claims due pending deliveries with a 2-minute lease", async () => {
      const now = new Date("2026-07-15T18:00:00.000Z");
      enqueueReminderDelivery(db, {
        userId: user1,
        localDate: "2026-07-15",
        timezone: "Europe/London",
        streakCount: 5,
        now,
        nextAttemptAt: now,
        expiresAt: new Date("2026-07-15T23:00:00.000Z"),
      });

      const claims = await claimDueDeliveries(db, now, 50);
      expect(claims).toHaveLength(1);
      expect(claims[0].userId).toBe(user1);
      expect(claims[0].topic).toBe("topic-user-1");
      expect(claims[0].kind).toBe("reminder");
      expect(claims[0].streakCount).toBe(5);

      // Verify DB row is now claimed with claim_until set to +2m
      const row = db
        .query("SELECT * FROM notification_deliveries WHERE id = ?")
        .get(claims[0].id) as any;
      expect(row.status).toBe("claimed");
      expect(row.attempt_count).toBe(1);
      expect(row.claim_until).toBe("2026-07-15T18:02:00.000Z");

      // Claiming again at same time returns nothing
      const secondClaim = await claimDueDeliveries(db, now, 50);
      expect(secondClaim).toHaveLength(0);
    });

    it("releases expired claims back to pending", async () => {
      const now = new Date("2026-07-15T18:00:00.000Z");
      enqueueReminderDelivery(db, {
        userId: user1,
        localDate: "2026-07-15",
        timezone: "Europe/London",
        streakCount: 5,
        now,
        nextAttemptAt: now,
        expiresAt: new Date("2026-07-15T23:00:00.000Z"),
      });

      const claims = await claimDueDeliveries(db, now, 50);
      expect(claims).toHaveLength(1);

      // After 2 minutes (e.g. 2m01s), release expired claims
      const twoMinutesLater = new Date("2026-07-15T18:02:01.000Z");
      const released = releaseExpiredClaims(db, twoMinutesLater);
      expect(released).toBe(1);

      const row = db
        .query("SELECT * FROM notification_deliveries WHERE id = ?")
        .get(claims[0].id) as any;
      expect(row.status).toBe("pending");
      expect(row.claim_until).toBeNull();
    });

    it("completes delivery on success", async () => {
      const now = new Date("2026-07-15T18:00:00.000Z");
      enqueueReminderDelivery(db, {
        userId: user1,
        localDate: "2026-07-15",
        timezone: "Europe/London",
        streakCount: 5,
        now,
        nextAttemptAt: now,
        expiresAt: new Date("2026-07-15T23:00:00.000Z"),
      });

      const claims = await claimDueDeliveries(db, now, 50);
      const deliveryId = claims[0].id;

      completeDeliverySuccess(db, deliveryId, {
        ntfyMessageId: "msg_12345",
        completedAt: new Date("2026-07-15T18:00:02.000Z"),
      });

      const row = db
        .query("SELECT * FROM notification_deliveries WHERE id = ?")
        .get(deliveryId) as any;
      expect(row.status).toBe("succeeded");
      expect(row.ntfy_message_id).toBe("msg_12345");
      expect(row.completed_at).toBe("2026-07-15T18:00:02.000Z");
    });

    it("handles temporary failure by rescheduling next_attempt_at if before expiry", async () => {
      const now = new Date("2026-07-15T18:00:00.000Z");
      enqueueReminderDelivery(db, {
        userId: user1,
        localDate: "2026-07-15",
        timezone: "Europe/London",
        streakCount: 5,
        now,
        nextAttemptAt: now,
        expiresAt: new Date("2026-07-15T23:00:00.000Z"),
      });

      const claims = await claimDueDeliveries(db, now, 50);
      const deliveryId = claims[0].id;

      completeDeliveryFailure(db, deliveryId, {
        classification: "service-unavailable",
        isPermanent: false,
        nextAttemptAt: new Date("2026-07-15T18:01:00.000Z"),
        failedAt: new Date("2026-07-15T18:00:05.000Z"),
      });

      const row = db
        .query("SELECT * FROM notification_deliveries WHERE id = ?")
        .get(deliveryId) as any;
      expect(row.status).toBe("pending");
      expect(row.last_result_code).toBe("service-unavailable");
      expect(row.next_attempt_at).toBe("2026-07-15T18:01:00.000Z");
      expect(row.claim_until).toBeNull();
    });

    it("handles temporary failure when next_attempt_at is at or past expires_at by marking delivery failed with last_result_code = 'expired'", async () => {
      const now = new Date("2026-07-15T18:00:00.000Z");
      const expiresAt = new Date("2026-07-15T18:30:00.000Z");
      enqueueReminderDelivery(db, {
        userId: user1,
        localDate: "2026-07-15",
        timezone: "Europe/London",
        streakCount: 5,
        now,
        nextAttemptAt: now,
        expiresAt,
      });

      const claims = await claimDueDeliveries(db, now, 50);
      const deliveryId = claims[0].id;

      // Next attempt computed at 18:35, which is past expiresAt (18:30)
      completeDeliveryFailure(db, deliveryId, {
        classification: "service-unavailable",
        isPermanent: false,
        nextAttemptAt: new Date("2026-07-15T18:35:00.000Z"),
        failedAt: new Date("2026-07-15T18:00:05.000Z"),
      });

      const row = db
        .query("SELECT * FROM notification_deliveries WHERE id = ?")
        .get(deliveryId) as any;
      expect(row.status).toBe("failed");
      expect(row.last_result_code).toBe("expired");
      expect(row.completed_at).toBe("2026-07-15T18:00:05.000Z");
      expect(row.claim_until).toBeNull();
    });
    it("handles permanent failure", async () => {
      const now = new Date("2026-07-15T18:00:00.000Z");
      enqueueReminderDelivery(db, {
        userId: user1,
        localDate: "2026-07-15",
        timezone: "Europe/London",
        streakCount: 5,
        now,
        nextAttemptAt: now,
        expiresAt: new Date("2026-07-15T23:00:00.000Z"),
      });

      const claims = await claimDueDeliveries(db, now, 50);
      const deliveryId = claims[0].id;

      completeDeliveryFailure(db, deliveryId, {
        classification: "rejected",
        isPermanent: true,
        failedAt: new Date("2026-07-15T18:00:05.000Z"),
      });

      const row = db
        .query("SELECT * FROM notification_deliveries WHERE id = ?")
        .get(deliveryId) as any;
      expect(row.status).toBe("failed");
      expect(row.last_result_code).toBe("rejected");
      expect(row.completed_at).toBe("2026-07-15T18:00:05.000Z");
    });

    it("suppresses delivery when learner becomes active before delivery", async () => {
      const now = new Date("2026-07-15T18:00:00.000Z");
      enqueueReminderDelivery(db, {
        userId: user1,
        localDate: "2026-07-15",
        timezone: "Europe/London",
        streakCount: 5,
        now,
        nextAttemptAt: now,
        expiresAt: new Date("2026-07-15T23:00:00.000Z"),
      });

      const claims = await claimDueDeliveries(db, now, 50);
      const deliveryId = claims[0].id;

      suppressDelivery(db, deliveryId, new Date("2026-07-15T18:00:01.000Z"));

      const row = db
        .query("SELECT * FROM notification_deliveries WHERE id = ?")
        .get(deliveryId) as any;
      expect(row.status).toBe("suppressed");
      expect(row.completed_at).toBe("2026-07-15T18:00:01.000Z");
    });
  });

  describe("isDeliveryStillClaimed & sweepExpiredDeliveries", () => {
    it("isDeliveryStillClaimed checks if delivery is claimed for user", async () => {
      const now = new Date("2026-07-15T18:00:00.000Z");
      const proof = await createTestProof(db, {
        userId: user1,
        topic: "topic-u1",
        reminderTime: "19:00",
        timezone: "Europe/London",
        now,
      });
      await saveNotificationConfigurationFromProof(db, proof, user1, now);

      enqueueReminderDelivery(db, {
        userId: user1,
        localDate: "2026-07-15",
        timezone: "Europe/London",
        streakCount: 5,
        now,
        nextAttemptAt: now,
        expiresAt: new Date("2026-07-15T23:00:00.000Z"),
      });
      // Before claim: status is pending
      const row = db
        .query("SELECT id FROM notification_deliveries WHERE user_id = ?")
        .get(user1) as { id: string };
      expect(isDeliveryStillClaimed(db, row.id, user1)).toBe(false);

      const claims = await claimDueDeliveries(db, now, 50);
      expect(claims).toHaveLength(1);
      expect(isDeliveryStillClaimed(db, claims[0].id, user1)).toBe(true);
      expect(isDeliveryStillClaimed(db, claims[0].id, user2)).toBe(false);

      // After completion
      completeDeliverySuccess(db, claims[0].id, {
        ntfyMessageId: "msg-123",
        completedAt: now,
      });
      expect(isDeliveryStillClaimed(db, claims[0].id, user1)).toBe(false);
    });

    it("sweeps expired unattempted deliveries to 'expired' status", async () => {
      const t1 = new Date("2026-07-15T18:00:00.000Z");
      const expiresAt = new Date("2026-07-15T19:00:00.000Z");

      const proof = await createTestProof(db, {
        userId: user1,
        topic: "topic-u1",
        reminderTime: "19:00",
        timezone: "Europe/London",
        now: t1,
      });
      await saveNotificationConfigurationFromProof(db, proof, user1, t1);

      enqueueReminderDelivery(db, {
        userId: user1,
        localDate: "2026-07-15",
        timezone: "Europe/London",
        streakCount: 5,
        now: t1,
        nextAttemptAt: t1,
        expiresAt,
      });
      // Before expiry: sweep transitions 0
      expect(
        sweepExpiredDeliveries(db, new Date("2026-07-15T18:30:00.000Z")),
      ).toBe(0);

      // After expiry: sweep transitions unattempted to 'expired'
      const swept = sweepExpiredDeliveries(
        db,
        new Date("2026-07-15T19:01:00.000Z"),
      );
      expect(swept).toBe(1);

      const row = db
        .query("SELECT * FROM notification_deliveries WHERE user_id = ?")
        .get(user1) as {
        status: string;
        last_result_code: string | null;
        completed_at: string;
      };
      expect(row.status).toBe("expired");
      expect(row.last_result_code).toBeNull();
      expect(row.completed_at).toBe("2026-07-15T19:01:00.000Z");
    });

    it("sweeps expired attempted deliveries to 'failed' status with last_result_code = 'expired'", async () => {
      const t1 = new Date("2026-07-15T18:00:00.000Z");
      const expiresAt = new Date("2026-07-15T19:00:00.000Z");

      const proof = await createTestProof(db, {
        userId: user1,
        topic: "topic-u1",
        reminderTime: "19:00",
        timezone: "Europe/London",
        now: t1,
      });
      await saveNotificationConfigurationFromProof(db, proof, user1, t1);

      enqueueReminderDelivery(db, {
        userId: user1,
        localDate: "2026-07-15",
        timezone: "Europe/London",
        streakCount: 5,
        now: t1,
        nextAttemptAt: t1,
        expiresAt,
      });

      // Attempt 1 fails transiently
      const claims = await claimDueDeliveries(db, t1, 50);
      completeDeliveryFailure(db, claims[0].id, {
        classification: "network",
        isPermanent: false,
        nextAttemptAt: new Date("2026-07-15T18:30:00.000Z"),
        failedAt: t1,
      });

      // When now >= expires_at, sweep transitions attempted pending to failed with expired result code
      const swept = sweepExpiredDeliveries(
        db,
        new Date("2026-07-15T19:05:00.000Z"),
      );
      expect(swept).toBe(1);

      const row = db
        .query("SELECT * FROM notification_deliveries WHERE user_id = ?")
        .get(user1) as {
        status: string;
        last_result_code: string | null;
        completed_at: string;
      };
      expect(row.status).toBe("failed");
      expect(row.last_result_code).toBe("expired");
      expect(row.completed_at).toBe("2026-07-15T19:05:00.000Z");
    });
  });
  describe("cleanupExpiredProofs & getActiveNotificationConfigurations", () => {
    it("cleans up expired and consumed proofs", async () => {
      const now = new Date("2026-07-15T12:00:00.000Z");
      await createTestProof(db, {
        userId: user1,
        topic: "topic-old",
        reminderTime: "19:00",
        timezone: "Europe/London",
        now: new Date("2026-07-15T11:00:00.000Z"), // expired at 11:15
      });

      const validProof = await createTestProof(db, {
        userId: user1,
        topic: "topic-valid",
        reminderTime: "19:00",
        timezone: "Europe/London",
        now,
      });

      cleanupExpiredProofs(db, now);

      const count = db
        .query("SELECT count(*) as count FROM notification_test_proofs")
        .get() as any;
      expect(count.count).toBe(1);

      const row = db
        .query("SELECT id FROM notification_test_proofs")
        .get() as any;
      expect(row.id).toBe(validProof);
    });

    it("retrieves active notification configurations across users", async () => {
      const now = new Date("2026-07-15T12:00:00.000Z");
      const proof1 = await createTestProof(db, {
        userId: user1,
        topic: "topic-u1",
        reminderTime: "19:00",
        timezone: "Europe/London",
        now,
      });
      await saveNotificationConfigurationFromProof(db, proof1, user1, now);

      const proof2 = await createTestProof(db, {
        userId: user2,
        topic: "topic-u2",
        reminderTime: "08:00",
        timezone: "America/New_York",
        now,
      });
      await saveNotificationConfigurationFromProof(db, proof2, user2, now);

      const active = await getActiveNotificationConfigurations(db);
      expect(active).toHaveLength(2);
      expect(
        active.map((a: NotificationConfigRecord) => a.userId).toSorted(),
      ).toEqual([user1, user2]);
    });
  });

  describe("getLatestDeliveryRecord (T035)", () => {
    it("returns null when user has no deliveries", () => {
      const latest = getLatestDeliveryRecord(db, user1);
      expect(latest).toBeNull();
    });

    it("returns latest completed delivery ordered by completed_at / last_attempt_at descending, ignoring pending and suppressed", async () => {
      const t1 = new Date("2026-07-15T10:00:00.000Z");
      const t2 = new Date("2026-07-15T12:00:00.000Z");
      const t3 = new Date("2026-07-15T14:00:00.000Z");

      // Seed configuration
      const proof = await createTestProof(db, {
        userId: user1,
        topic: "topic-1",
        reminderTime: "18:00",
        timezone: "America/New_York",
        now: t1,
      });
      await saveNotificationConfigurationFromProof(db, proof, user1, t1);

      // Insert an earlier succeeded delivery
      db.run(
        `INSERT INTO notification_deliveries (
          id, user_id, logical_key, kind, streak_count, local_date, timezone,
          status, attempt_count, next_attempt_at, expires_at, last_attempt_at, completed_at,
          last_result_code, created_at, updated_at
        ) VALUES (
          'del-1', ?, 'reminder:2026-07-14', 'reminder', 5, '2026-07-14', 'America/New_York',
          'succeeded', 1, ?, ?, ?, ?, NULL, ?, ?
        )`,
        [
          user1,
          t1.toISOString(),
          t1.toISOString(),
          t1.toISOString(),
          t1.toISOString(),
          t1.toISOString(),
          t1.toISOString(),
        ],
      );

      // Insert a later failed delivery
      db.run(
        `INSERT INTO notification_deliveries (
          id, user_id, logical_key, kind, streak_count, local_date, timezone,
          status, attempt_count, next_attempt_at, expires_at, last_attempt_at, completed_at,
          last_result_code, created_at, updated_at
        ) VALUES (
          'del-2', ?, 'milestone:2026-07-15:10', 'milestone', 10, '2026-07-15', 'America/New_York',
          'failed', 3, ?, ?, ?, ?, 'network', ?, ?
        )`,
        [
          user1,
          t2.toISOString(),
          t2.toISOString(),
          t2.toISOString(),
          t2.toISOString(),
          t2.toISOString(),
          t2.toISOString(),
        ],
      );

      // Insert a pending delivery (more recent updated_at) - should NOT be returned
      db.run(
        `INSERT INTO notification_deliveries (
          id, user_id, logical_key, kind, streak_count, local_date, timezone,
          status, attempt_count, next_attempt_at, expires_at, last_attempt_at, completed_at,
          last_result_code, created_at, updated_at
        ) VALUES (
          'del-3', ?, 'reminder:2026-07-15', 'reminder', 10, '2026-07-15', 'America/New_York',
          'pending', 0, ?, ?, NULL, NULL, NULL, ?, ?
        )`,
        [
          user1,
          t3.toISOString(),
          t3.toISOString(),
          t3.toISOString(),
          t3.toISOString(),
        ],
      );

      // Insert a suppressed delivery (more recent) - should NOT be returned
      db.run(
        `INSERT INTO notification_deliveries (
          id, user_id, logical_key, kind, streak_count, local_date, timezone,
          status, attempt_count, next_attempt_at, expires_at, last_attempt_at, completed_at,
          last_result_code, created_at, updated_at
        ) VALUES (
          'del-4', ?, 'reminder:2026-07-16', 'reminder', 11, '2026-07-16', 'America/New_York',
          'suppressed', 0, ?, ?, NULL, ?, NULL, ?, ?
        )`,
        [
          user1,
          t3.toISOString(),
          t3.toISOString(),
          t3.toISOString(),
          t3.toISOString(),
          t3.toISOString(),
        ],
      );

      const latest = getLatestDeliveryRecord(db, user1);
      expect(latest).not.toBeNull();
      expect(latest?.id).toBe("del-2");
      expect(latest?.kind).toBe("milestone");
      expect(latest?.status).toBe("failed");
      expect(latest?.lastResultCode).toBe("network");
      expect(latest?.timezone).toBe("America/New_York");
    });

    it("isolates latest delivery record across users", async () => {
      const now = new Date("2026-07-15T12:00:00.000Z");
      const proof = await createTestProof(db, {
        userId: user2,
        topic: "topic-user-2",
        reminderTime: "18:00",
        timezone: "UTC",
        now,
      });
      await saveNotificationConfigurationFromProof(db, proof, user2, now);
      db.run(
        `INSERT INTO notification_deliveries (
          id, user_id, logical_key, kind, streak_count, local_date, timezone,
          status, attempt_count, next_attempt_at, expires_at, last_attempt_at, completed_at,
          last_result_code, created_at, updated_at
        ) VALUES (
          'del-user-2', ?, 'reminder:2026-07-15', 'reminder', 3, '2026-07-15', 'UTC',
          'succeeded', 1, ?, ?, ?, ?, NULL, ?, ?
        )`,
        [
          user2,
          now.toISOString(),
          now.toISOString(),
          now.toISOString(),
          now.toISOString(),
          now.toISOString(),
          now.toISOString(),
        ],
      );

      expect(getLatestDeliveryRecord(db, user1)).toBeNull();
      expect(getLatestDeliveryRecord(db, user2)?.id).toBe("del-user-2");
    });
  });

  describe("replacement invalidation and removal cascade (T035)", () => {
    it("invalidates old pending and claimed work when replacing configuration with a new proof", async () => {
      const t1 = new Date("2026-07-15T10:00:00.000Z");
      const t2 = new Date("2026-07-15T12:00:00.000Z");

      const proof1 = await createTestProof(db, {
        userId: user1,
        topic: "topic-initial",
        reminderTime: "18:00",
        timezone: "UTC",
        now: t1,
      });
      await saveNotificationConfigurationFromProof(db, proof1, user1, t1);

      // Enqueue pending and claimed deliveries under initial config
      enqueueReminderDelivery(db, {
        userId: user1,
        localDate: "2026-07-15",
        timezone: "UTC",
        streakCount: 5,
        now: t1,
        nextAttemptAt: t1,
        expiresAt: new Date("2026-07-15T23:00:00.000Z"),
      });

      const claims = await claimDueDeliveries(db, t1);
      expect(claims).toHaveLength(1);

      // Also insert another pending milestone
      enqueueMilestoneDelivery(db, {
        userId: user1,
        streakCount: 7,
        lastActiveDate: "2026-07-15",
        localDate: "2026-07-15",
        timezone: "UTC",
        now: t1,
        nextAttemptAt: t1,
        expiresAt: new Date("2026-07-16T10:00:00.000Z"),
      });

      // Seed a completed history item that should remain
      db.run(
        `INSERT INTO notification_deliveries (
          id, user_id, logical_key, kind, streak_count, local_date, timezone,
          status, attempt_count, next_attempt_at, expires_at, last_attempt_at, completed_at,
          last_result_code, created_at, updated_at
        ) VALUES (
          'del-completed', ?, 'reminder:2026-07-14', 'reminder', 4, '2026-07-14', 'UTC',
          'succeeded', 1, ?, ?, ?, ?, NULL, ?, ?
        )`,
        [
          user1,
          t1.toISOString(),
          t1.toISOString(),
          t1.toISOString(),
          t1.toISOString(),
          t1.toISOString(),
          t1.toISOString(),
        ],
      );

      // Replace configuration with new proof
      const proof2 = await createTestProof(db, {
        userId: user1,
        topic: "topic-replaced",
        reminderTime: "20:00",
        timezone: "Europe/Paris",
        now: t2,
      });
      const replacedConfig = await saveNotificationConfigurationFromProof(
        db,
        proof2,
        user1,
        t2,
      );
      expect(replacedConfig.topic).toBe("topic-replaced");
      expect(replacedConfig.reminderTime).toBe("20:00");
      expect(replacedConfig.timezone).toBe("Europe/Paris");
      expect(replacedConfig.activatedAt).toBe(t2.toISOString());

      // All pending and claimed deliveries are removed
      const activeDeliveries = db
        .query(
          "SELECT id, status FROM notification_deliveries WHERE user_id = ? AND status IN ('pending', 'claimed')",
        )
        .all(user1);
      expect(activeDeliveries).toHaveLength(0);

      // Completed history remains
      const completedRows = db
        .query(
          "SELECT id FROM notification_deliveries WHERE user_id = ? AND status = 'succeeded'",
        )
        .all(user1) as { id: string }[];
      expect(completedRows).toHaveLength(1);
      expect(completedRows[0].id).toBe("del-completed");
    });

    it("completely deletes all configuration, deliveries, and test proofs on removal", async () => {
      const now = new Date("2026-07-15T12:00:00.000Z");
      const proof = await createTestProof(db, {
        userId: user1,
        topic: "topic-to-remove",
        reminderTime: "19:00",
        timezone: "UTC",
        now,
      });
      await saveNotificationConfigurationFromProof(db, proof, user1, now);

      // Create an extra outstanding test proof for user1
      await createTestProof(db, {
        userId: user1,
        topic: "extra-test-proof",
        reminderTime: "20:00",
        timezone: "UTC",
        now,
      });

      // Succeeded delivery
      db.run(
        `INSERT INTO notification_deliveries (
          id, user_id, logical_key, kind, streak_count, local_date, timezone,
          status, attempt_count, next_attempt_at, expires_at, last_attempt_at, completed_at,
          last_result_code, created_at, updated_at
        ) VALUES (
          'del-succ', ?, 'reminder:2026-07-14', 'reminder', 5, '2026-07-14', 'UTC',
          'succeeded', 1, ?, ?, ?, ?, NULL, ?, ?
        )`,
        [
          user1,
          now.toISOString(),
          now.toISOString(),
          now.toISOString(),
          now.toISOString(),
          now.toISOString(),
          now.toISOString(),
        ],
      );

      // Failed delivery
      db.run(
        `INSERT INTO notification_deliveries (
          id, user_id, logical_key, kind, streak_count, local_date, timezone,
          status, attempt_count, next_attempt_at, expires_at, last_attempt_at, completed_at,
          last_result_code, created_at, updated_at
        ) VALUES (
          'del-fail', ?, 'milestone:2026-07-15:7', 'milestone', 7, '2026-07-15', 'UTC',
          'failed', 3, ?, ?, ?, ?, 'timeout', ?, ?
        )`,
        [
          user1,
          now.toISOString(),
          now.toISOString(),
          now.toISOString(),
          now.toISOString(),
          now.toISOString(),
          now.toISOString(),
        ],
      );

      // Remove configuration
      deleteNotificationConfiguration(db, user1);

      expect(await getNotificationConfiguration(db, user1)).toBeNull();
      expect(getLatestDeliveryRecord(db, user1)).toBeNull();

      const remainingDeliveries = db
        .query("SELECT * FROM notification_deliveries WHERE user_id = ?")
        .all(user1);
      expect(remainingDeliveries).toHaveLength(0);

      const remainingProofs = db
        .query("SELECT * FROM notification_test_proofs WHERE user_id = ?")
        .all(user1);
      expect(remainingProofs).toHaveLength(0);
    });
  });
});
