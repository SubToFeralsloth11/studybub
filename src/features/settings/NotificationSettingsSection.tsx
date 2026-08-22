import { useEffect, useRef, useState } from "react";

import { Button } from "../../components/Button";
import { Card } from "../../components/Card";

import type {
  DeliveryStatus,
  NotificationSettings,
} from "../../server/api/notifications";

function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 *
 */
export function NotificationSettingsSection() {
  const [topic, setTopic] = useState("");
  const [reminderTime, setReminderTime] = useState("19:00");
  const [timezone, setTimezone] = useState(getBrowserTimezone());

  // Active saved configuration
  const [activeConfig, setActiveConfig] = useState<NotificationSettings | null>(
    null,
  );
  const [lastDelivery, setLastDelivery] = useState<DeliveryStatus | null>(null);

  // Test proof state
  const [testedProofId, setTestedProofId] = useState<string | null>(null);
  const [lastTestedValues, setLastTestedValues] = useState<string | null>(null);

  // UI status feedback
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const removeDialogRef = useRef<HTMLDialogElement>(null);
  // Load saved settings on mount
  useEffect(() => {
    let mounted = true;
    import("../../server/api/notifications")
      .then(({ loadNotificationSettings }) => loadNotificationSettings())
      .then((settings) => {
        if (mounted && settings) {
          setActiveConfig(settings);
          setTopic(settings.topic);
          setReminderTime(settings.reminderTime);
          setTimezone(settings.timezone);
          setLastDelivery(settings.lastDelivery);
        }
      })
      .catch(() => {
        // Ignore load error
      });
    return () => {
      mounted = false;
    };
  }, []);

  const currentValuesKey = `${topic.trim()}|${reminderTime}|${timezone}`;
  const isTested =
    testedProofId !== null && lastTestedValues === currentValuesKey;

  const handleTest = async () => {
    setIsTesting(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const { testNotificationSettings } =
        await import("../../server/api/notifications");
      const result = await testNotificationSettings({
        data: {
          draft: {
            topic: topic.trim(),
            reminderTime,
            timezone,
          },
        },
      });

      if (result.ok) {
        setTestedProofId(result.proofId);
        setLastTestedValues(currentValuesKey);
        setStatusMessage("Test sent! Check your ntfy client.");
      } else {
        setTestedProofId(null);
        setLastTestedValues(null);
        switch (result.reason) {
          case "invalid-values": {
            setErrorMessage(
              "Please enter a valid topic (1-64 alphanumeric characters, hyphens, underscores) and valid 24-hour time.",
            );

            break;
          }
          case "rate-limited": {
            setErrorMessage(
              "ntfy.sh rate limit reached. Please try again later.",
            );

            break;
          }
          case "timeout": {
            setErrorMessage(
              "Request timed out connecting to ntfy.sh. Please try again.",
            );

            break;
          }
          default: {
            setErrorMessage(
              "Unable to deliver test notification to ntfy.sh. Please check your network or topic.",
            );
          }
        }
      }
    } catch {
      setErrorMessage("An unexpected error occurred while sending the test.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!testedProofId || !isTested) {
      setErrorMessage("Please send a successful test before saving.");
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const { saveNotificationSettings } =
        await import("../../server/api/notifications");
      const result = await saveNotificationSettings({
        data: { proofId: testedProofId },
      });
      if (result.ok) {
        setActiveConfig(result.settings);
        setLastDelivery(result.settings.lastDelivery);
        setStatusMessage("Notification settings saved and active!");
      } else {
        setTestedProofId(null);
        setLastTestedValues(null);
        switch (result.reason) {
          case "proof-expired": {
            setErrorMessage(
              "Your test has expired (15-minute limit). Please send a new test before saving.",
            );
            break;
          }
          case "proof-consumed": {
            setErrorMessage(
              "This test has already been used. Please send a new test to update settings.",
            );
            break;
          }
          case "proof-not-found": {
            setErrorMessage(
              "Test verification could not be found. Please send a test before saving.",
            );
            break;
          }
        }
      }
    } catch {
      setErrorMessage(
        "An unexpected error occurred while saving settings. Please try again.",
      );
      setTestedProofId(null);
      setLastTestedValues(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmRemove = async () => {
    removeDialogRef.current?.close();
    setIsRemoving(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const { removeNotificationSettings } =
        await import("../../server/api/notifications");
      const result = await removeNotificationSettings();
      if (result.ok) {
        setActiveConfig(null);
        setLastDelivery(null);
        setTestedProofId(null);
        setLastTestedValues(null);
        setStatusMessage("Notification settings removed.");
      }
    } catch {
      setErrorMessage("Failed to remove notifications.");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="mb-4 font-display text-xl font-semibold text-ink">
        Streak Notifications
      </h2>
      <p className="mb-5 text-sm text-ink/70">
        Get daily reminders to protect your streak and celebrate milestones via
        ntfy.sh.
      </p>

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-ink">ntfy Topic</span>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="my-studybub-streak-topic"
            className="rounded-lg border border-hairline bg-cream px-3 py-2 text-ink placeholder:text-ink/40 focus:border-brand focus:outline-none"
          />
          <span className="text-xs text-muted">
            1–64 letters, numbers, hyphens, or underscores. Subscribe to this
            topic in the ntfy app.
          </span>
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-ink">
              Reminder Time
            </span>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="rounded-lg border border-hairline bg-cream px-3 py-2 text-ink focus:border-brand focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-ink">Timezone</span>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="rounded-lg border border-hairline bg-cream px-3 py-2 text-ink focus:border-brand focus:outline-none"
            />
          </label>
        </div>

        {lastDelivery && (
          <div className="rounded-lg border border-hairline bg-cream-deep/40 p-3 text-sm">
            <span className="font-semibold text-ink">Last delivery: </span>
            <span className="capitalize">{lastDelivery.kind}</span> -{" "}
            <span
              className={
                lastDelivery.outcome === "succeeded"
                  ? "font-medium text-green-700"
                  : "font-medium text-red-600"
              }
            >
              {lastDelivery.outcome}
            </span>{" "}
            at {lastDelivery.attemptedAt}
            {lastDelivery.reason && (
              <span className="text-muted"> ({lastDelivery.reason})</span>
            )}
          </div>
        )}

        {statusMessage && (
          <div role="status" className="text-sm font-medium text-brand">
            {statusMessage}
          </div>
        )}

        {errorMessage && (
          <div role="alert" className="text-sm font-medium text-red-600">
            {errorMessage}
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleTest}
            disabled={isTesting || !topic.trim()}
          >
            {isTesting ? "Sending test..." : "Send test"}
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={isSaving || !isTested}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>

          {activeConfig && (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeDialogRef.current?.showModal()}
                disabled={isRemoving}
                className="text-red-600 hover:bg-red-50"
              >
                {isRemoving ? "Removing..." : "Remove notifications"}
              </Button>

              <dialog
                ref={removeDialogRef}
                aria-labelledby="remove-notifications-title"
                className="m-auto rounded-bub p-0 backdrop:bg-ink/40"
              >
                <div className="max-w-sm p-6">
                  <h2
                    id="remove-notifications-title"
                    className="text-xl font-semibold text-ink"
                  >
                    Remove streak notifications?
                  </h2>
                  <p className="mt-2 text-sm text-muted">
                    Are you sure you want to remove streak notifications? This
                    will delete your settings and delivery history.
                  </p>
                  <div className="mt-5 flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => removeDialogRef.current?.close()}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleConfirmRemove}
                      className="bg-red-600 text-white hover:bg-red-700 active:bg-red-800"
                    >
                      Remove notifications
                    </Button>
                  </div>
                </div>
              </dialog>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
