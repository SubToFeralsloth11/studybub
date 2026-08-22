const mocks = vi.hoisted(() => {
  const session = { data: {} as Record<string, unknown> };
  const createServerFn = () => {
    const api = {
      validator() {
        return api;
      },
      inputValidator() {
        return api;
      },
      middleware() {
        return api;
      },
      handler:
        (fn: (ctx: { data: unknown }) => unknown) =>
        async (opts?: { data?: unknown }) =>
          fn({ data: opts?.data }),
    };
    return api;
  };
  return { session, createServerFn };
});

vi.mock("@tanstack/react-start", () => ({
  createServerFn: mocks.createServerFn,
}));
vi.mock("@tanstack/react-start/server", () => ({
  useSession: vi.fn(async () => mocks.session),
}));
const session = mocks.session;

const mockPublishNtfyNotification = vi.fn();
vi.mock("../ntfyClient.server", () => ({
  publishNtfyNotification: (...args: unknown[]) =>
    mockPublishNtfyNotification(...args),
}));

import { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  loadNotificationSettings,
  removeNotificationSettings,
  saveNotificationSettings,
  testNotificationSettings,
} from "./notifications";
import { getDatabase, initSchema, resetDatabase } from "../db.server";
import { resetEncryptionKey } from "../encryption.server";
import { createTestProof } from "../notificationRepository.server";

const VALID_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const TEST_USER_ID = "00000000-0000-0000-0000-000000000001";

function setupDb(): Database {
  resetDatabase();
  const db = getDatabase(":memory:");
  initSchema(db);

  const now = new Date().toISOString();
  db.run(
    "INSERT INTO users (id, display_name, progress_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    [TEST_USER_ID, "Test User", "{}", now, now],
  );

  return db;
}

describe("notifications API server functions", () => {
  let db: Database;

  beforeEach(() => {
    process.env.SESSION_SECRET = VALID_KEY;
    process.env.ENCRYPTION_KEY = VALID_KEY;
    process.env.STUDYBUB_PUBLIC_URL = "https://studybub.example.com";
    db = setupDb();
    session.data = { userId: TEST_USER_ID };
    mockPublishNtfyNotification.mockReset();
  });

  afterEach(() => {
    resetDatabase();
    resetEncryptionKey();
  });

  describe("testNotificationSettings", () => {
    it("validates draft inputs and returns safe failure for invalid fields", async () => {
      const result = await testNotificationSettings({
        data: {
          draft: {
            topic: "invalid topic with spaces!",
            reminderTime: "19:00",
            timezone: "UTC",
          },
        },
      });

      expect(result).toEqual({
        ok: false,
        reason: "invalid-values",
      });
      expect(mockPublishNtfyNotification).not.toHaveBeenCalled();
    });

    it("sends low-priority generic test notification and persists proof on 2xx", async () => {
      mockPublishNtfyNotification.mockResolvedValueOnce({
        ok: true,
        status: 200,
        ntfyMessageId: "msg-123",
      });

      const result = await testNotificationSettings({
        data: {
          draft: {
            topic: "valid-topic_123",
            reminderTime: "19:00",
            timezone: "America/New_York",
          },
        },
      });

      expect(result).toEqual(
        expect.objectContaining({
          ok: true,
          proofId: expect.any(String),
          expiresAt: expect.any(String),
        }),
      );

      expect(mockPublishNtfyNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: "valid-topic_123",
          title: "StudyBub notifications",
          body: "Your StudyBub streak notifications are connected.",
          priority: 2,
          publicUrl: "https://studybub.example.com",
        }),
      );
    });

    it("returns safe error classification and persists no proof on transport failure", async () => {
      mockPublishNtfyNotification.mockResolvedValueOnce({
        ok: false,
        status: 429,
        classification: "rate-limited",
        isPermanent: false,
      });

      const result = await testNotificationSettings({
        data: {
          draft: {
            topic: "valid-topic_123",
            reminderTime: "19:00",
            timezone: "UTC",
          },
        },
      });

      expect(result).toEqual({
        ok: false,
        reason: "rate-limited",
      });

      const proofs = db.query("SELECT * FROM notification_test_proofs").all();
      expect(proofs).toHaveLength(0);
    });
  });

  describe("saveNotificationSettings", () => {
    it("activates configuration when valid unexpired unconsumed proof is provided", async () => {
      const now = new Date();
      const proofId = await createTestProof(db, {
        userId: TEST_USER_ID,
        topic: "my-tested-topic",
        reminderTime: "20:30",
        timezone: "Europe/London",
        now,
      });

      const result = await saveNotificationSettings({
        data: { proofId },
      });

      expect(result).toEqual({
        ok: true,
        settings: expect.objectContaining({
          topic: "my-tested-topic",
          reminderTime: "20:30",
          timezone: "Europe/London",
          lastDelivery: null,
        }),
      });

      // Proof should now be consumed
      const proof = db
        .query("SELECT consumed_at FROM notification_test_proofs WHERE id = ?")
        .get(proofId) as { consumed_at: string | null };
      expect(proof.consumed_at).not.toBeNull();
    });

    it("returns structured safe failure for non-existent, expired, or already-consumed proof", async () => {
      // Non-existent
      const notFoundRes = await saveNotificationSettings({
        data: { proofId: "non-existent-id" },
      });
      expect(notFoundRes).toEqual({
        ok: false,
        reason: "proof-not-found",
      });

      // Consumed
      const now = new Date();
      const proofId = await createTestProof(db, {
        userId: TEST_USER_ID,
        topic: "my-topic",
        reminderTime: "19:00",
        timezone: "UTC",
        now,
      });

      const firstSave = await saveNotificationSettings({ data: { proofId } });
      expect(firstSave.ok).toBe(true);

      // Attempt second save with same proof
      const secondSave = await saveNotificationSettings({ data: { proofId } });
      expect(secondSave).toEqual({
        ok: false,
        reason: "proof-consumed",
      });
    });

    it("returns proof-not-found for proof belonging to another user", async () => {
      const now = new Date();
      const otherUserId = "00000000-0000-0000-0000-000000000002";
      db.run(
        "INSERT INTO users (id, display_name, progress_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        [otherUserId, "Other User", "{}", now.toISOString(), now.toISOString()],
      );

      const proofId = await createTestProof(db, {
        userId: otherUserId,
        topic: "other-topic",
        reminderTime: "19:00",
        timezone: "UTC",
        now,
      });

      const res = await saveNotificationSettings({ data: { proofId } });
      expect(res).toEqual({
        ok: false,
        reason: "proof-not-found",
      });
    });

    it("atomically replaces settings and returns new settings with preserved or updated status", async () => {
      const now = new Date();
      const initialProofId = await createTestProof(db, {
        userId: TEST_USER_ID,
        topic: "initial-topic",
        reminderTime: "18:00",
        timezone: "UTC",
        now,
      });
      await saveNotificationSettings({ data: { proofId: initialProofId } });

      // Enqueue pending work under initial settings
      db.run(
        `INSERT INTO notification_deliveries (
          id, user_id, logical_key, kind, streak_count, local_date, timezone,
          status, attempt_count, next_attempt_at, expires_at, last_attempt_at, completed_at,
          last_result_code, created_at, updated_at
        ) VALUES (
          'pending-del', ?, 'reminder:2026-08-22', 'reminder', 5, '2026-08-22', 'UTC',
          'pending', 0, ?, ?, NULL, NULL, NULL, ?, ?
        )`,
        [
          TEST_USER_ID,
          now.toISOString(),
          now.toISOString(),
          now.toISOString(),
          now.toISOString(),
        ],
      );

      // Now create a replacement proof and save
      const replaceTime = new Date(now.getTime() + 60 * 1000);
      const replaceProofId = await createTestProof(db, {
        userId: TEST_USER_ID,
        topic: "replaced-topic",
        reminderTime: "19:30",
        timezone: "America/Denver",
        now: replaceTime,
      });

      const saveRes = (await saveNotificationSettings({
        data: { proofId: replaceProofId },
      })) as {
        ok: true;
        settings: {
          topic: string;
          reminderTime: string;
          timezone: string;
          activatedAt: string;
        };
      };
      expect(saveRes.ok).toBe(true);
      expect(saveRes.settings.topic).toBe("replaced-topic");
      expect(saveRes.settings.reminderTime).toBe("19:30");
      expect(saveRes.settings.timezone).toBe("America/Denver");
      expect(saveRes.settings.activatedAt).toBeDefined();
      const pendingRows = db
        .query(
          "SELECT id FROM notification_deliveries WHERE user_id = ? AND status = 'pending'",
        )
        .all(TEST_USER_ID);
      expect(pendingRows).toHaveLength(0);
    });
  });

  describe("loadNotificationSettings", () => {
    it("returns null when user has no active configuration", async () => {
      const settings = await loadNotificationSettings();
      expect(settings).toBeNull();
    });

    it("returns active configuration and latest delivery projection", async () => {
      const now = new Date();
      const proofId = await createTestProof(db, {
        userId: TEST_USER_ID,
        topic: "active-topic",
        reminderTime: "18:00",
        timezone: "America/Chicago",
        now,
      });

      await saveNotificationSettings({ data: { proofId } });

      // Seed a delivery
      db.run(
        `INSERT INTO notification_deliveries (
          id, user_id, logical_key, kind, streak_count, local_date, timezone,
          status, attempt_count, next_attempt_at, expires_at, completed_at,
          last_result_code, created_at, updated_at
        ) VALUES (
          'del-1', ?, 'reminder:2026-08-22', 'reminder', 5, '2026-08-22', 'America/Chicago',
          'succeeded', 1, ?, ?, ?, NULL, ?, ?
        )`,
        [
          TEST_USER_ID,
          now.toISOString(),
          now.toISOString(),
          now.toISOString(),
          now.toISOString(),
          now.toISOString(),
        ],
      );

      const settings = await loadNotificationSettings();
      expect(settings).not.toBeNull();
      expect(settings?.topic).toBe("active-topic");
      expect(settings?.reminderTime).toBe("18:00");
      expect(settings?.timezone).toBe("America/Chicago");
      expect(settings?.lastDelivery).toEqual(
        expect.objectContaining({
          kind: "reminder",
          outcome: "succeeded",
          reason: null,
        }),
      );
    });

    it("projects delivery attempt timestamp in the delivery record timezone even if config timezone changed", async () => {
      // 2026-08-22 14:30 UTC in America/New_York (EDT, UTC-4) is 2026-08-22 10:30
      const instant = new Date("2026-08-22T14:30:00.000Z");
      const proofId = await createTestProof(db, {
        userId: TEST_USER_ID,
        topic: "timezone-topic",
        reminderTime: "10:00",
        timezone: "UTC",
        now: new Date(),
      });

      const saveRes = await saveNotificationSettings({ data: { proofId } });
      expect(saveRes.ok).toBe(true);

      db.run(
        `INSERT INTO notification_deliveries (
          id, user_id, logical_key, kind, streak_count, local_date, timezone,
          status, attempt_count, next_attempt_at, expires_at, last_attempt_at, completed_at,
          last_result_code, created_at, updated_at
        ) VALUES (
          'del-tz', ?, 'reminder:2026-08-22', 'reminder', 10, '2026-08-22', 'America/New_York',
          'succeeded', 1, ?, ?, ?, ?, NULL, ?, ?
        )`,
        [
          TEST_USER_ID,
          instant.toISOString(),
          instant.toISOString(),
          instant.toISOString(),
          instant.toISOString(),
          instant.toISOString(),
          instant.toISOString(),
        ],
      );

      const settings = await loadNotificationSettings();
      expect(settings?.timezone).toBe("UTC");
      expect(settings?.lastDelivery).toEqual({
        kind: "reminder",
        outcome: "succeeded",
        attemptedAt: "2026-08-22 10:30",
        reason: null,
      });
      // Ensure no topic or URL is leaked in lastDelivery
      expect(JSON.stringify(settings?.lastDelivery)).not.toContain(
        "timezone-topic",
      );
      expect(JSON.stringify(settings?.lastDelivery)).not.toContain("ntfy");
    });

    it("returns generic failure reasons and never leaks internal details, URL, or topic", async () => {
      const instant = new Date("2026-08-22T15:00:00.000Z");
      const proofId = await createTestProof(db, {
        userId: TEST_USER_ID,
        topic: "super-secret-topic-99",
        reminderTime: "19:00",
        timezone: "UTC",
        now: new Date(),
      });

      const saveRes = await saveNotificationSettings({ data: { proofId } });
      expect(saveRes.ok).toBe(true);
      const failureCodes = [
        { code: "network", expectedReason: "network" },
        { code: "timeout", expectedReason: "timeout" },
        { code: "rate-limited", expectedReason: "rate-limited" },
        { code: "rejected", expectedReason: "rejected" },
        { code: "service-unavailable", expectedReason: "service-unavailable" },
        { code: "expired", expectedReason: "expired" },
        { code: "unexpected-internal-error-418", expectedReason: "rejected" },
      ];

      for (const { code, expectedReason } of failureCodes) {
        db.run(`DELETE FROM notification_deliveries WHERE user_id = ?`, [
          TEST_USER_ID,
        ]);

        db.run(
          `INSERT INTO notification_deliveries (
            id, user_id, logical_key, kind, streak_count, local_date, timezone,
            status, attempt_count, next_attempt_at, expires_at, last_attempt_at, completed_at,
            last_result_code, created_at, updated_at
          ) VALUES (
            'del-fail-test', ?, 'milestone:2026-08-22:30', 'milestone', 30, '2026-08-22', 'UTC',
            'failed', 3, ?, ?, ?, ?, ?, ?, ?
          )`,
          [
            TEST_USER_ID,
            instant.toISOString(),
            instant.toISOString(),
            instant.toISOString(),
            instant.toISOString(),
            code,
            instant.toISOString(),
            instant.toISOString(),
          ],
        );

        const settings = await loadNotificationSettings();
        expect(settings?.lastDelivery).toEqual({
          kind: "milestone",
          outcome: "failed",
          attemptedAt: "2026-08-22 15:00",
          reason: expectedReason,
        });

        // Delivery projection must never leak topic
        expect(JSON.stringify(settings?.lastDelivery)).not.toContain(
          "super-secret-topic-99",
        );
      }
    });
  });

  describe("removeNotificationSettings", () => {
    it("deletes active configuration, deliveries, and test proofs idempotently", async () => {
      const now = new Date();
      const proofId = await createTestProof(db, {
        userId: TEST_USER_ID,
        topic: "active-topic",
        reminderTime: "18:00",
        timezone: "UTC",
        now,
      });
      await saveNotificationSettings({ data: { proofId } });

      const removeResult = await removeNotificationSettings();
      expect(removeResult).toEqual({ ok: true });

      expect(await loadNotificationSettings()).toBeNull();

      // Second removal is idempotent
      const secondResult = await removeNotificationSettings();
      expect(secondResult).toEqual({ ok: true });

      // Ensure all delivery records were deleted
      const deliveries = db
        .query("SELECT * FROM notification_deliveries WHERE user_id = ?")
        .all(TEST_USER_ID);
      expect(deliveries).toHaveLength(0);
    });
  });
});
