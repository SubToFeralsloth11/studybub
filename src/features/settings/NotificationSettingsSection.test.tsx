import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationSettingsSection } from "./NotificationSettingsSection";

const mockLoadNotificationSettings = vi.fn();
const mockTestNotificationSettings = vi.fn();
const mockSaveNotificationSettings = vi.fn();
const mockRemoveNotificationSettings = vi.fn();

vi.mock("../../server/api/notifications", () => ({
  loadNotificationSettings: (...args: unknown[]) =>
    mockLoadNotificationSettings(...args),
  testNotificationSettings: (...args: unknown[]) =>
    mockTestNotificationSettings(...args),
  saveNotificationSettings: (...args: unknown[]) =>
    mockSaveNotificationSettings(...args),
  removeNotificationSettings: (...args: unknown[]) =>
    mockRemoveNotificationSettings(...args),
}));

describe("NotificationSettingsSection", () => {
  beforeEach(() => {
    mockLoadNotificationSettings.mockReset().mockResolvedValue(null);
    mockTestNotificationSettings.mockReset().mockResolvedValue({
      ok: true,
      proofId: "proof-123",
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    });
    mockSaveNotificationSettings.mockReset().mockResolvedValue({
      ok: true,
      settings: {
        topic: "my-topic",
        reminderTime: "19:00",
        timezone: "America/New_York",
        activatedAt: new Date().toISOString(),
        lastDelivery: null,
      },
    });
    mockRemoveNotificationSettings.mockReset().mockResolvedValue({ ok: true });
  });

  it("renders labelled topic, reminder-time, and timezone fields with defaults", async () => {
    render(<NotificationSettingsSection />);

    await waitFor(() => {
      expect(screen.getByLabelText(/ntfy topic/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/reminder time/i)).toHaveValue("19:00");
    const timezoneInput = screen.getByLabelText(/timezone/i);
    expect(timezoneInput).toBeInTheDocument();
    expect(timezoneInput).toHaveValue(
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
  });

  it("disables Save until a successful test is completed", async () => {
    const user = userEvent.setup();
    render(<NotificationSettingsSection />);

    const topicInput = await screen.findByLabelText(/ntfy topic/i);
    await user.type(topicInput, "new-topic-123");

    const saveButton = screen.getByRole("button", { name: /save/i });
    expect(saveButton).toBeDisabled();

    const testButton = screen.getByRole("button", { name: /send test/i });
    await user.click(testButton);

    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });
    expect(screen.getByRole("status")).toHaveTextContent(/test sent/i);

    await user.click(saveButton);
    await waitFor(() => {
      expect(mockSaveNotificationSettings).toHaveBeenCalledWith({
        data: { proofId: "proof-123" },
      });
    });
  });

  it("requires re-testing if any field changes after a successful test", async () => {
    const user = userEvent.setup();
    render(<NotificationSettingsSection />);

    const topicInput = await screen.findByLabelText(/ntfy topic/i);
    await user.type(topicInput, "new-topic-123");

    const testButton = screen.getByRole("button", { name: /send test/i });
    await user.click(testButton);

    const saveButton = screen.getByRole("button", { name: /save/i });
    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });

    // Change reminder time
    const timeInput = screen.getByLabelText(/reminder time/i);
    await user.clear(timeInput);
    await user.type(timeInput, "20:00");

    expect(saveButton).toBeDisabled();
  });

  it("pre-populates active configuration when loaded", async () => {
    mockLoadNotificationSettings.mockResolvedValueOnce({
      topic: "active-user-topic",
      reminderTime: "21:15",
      timezone: "Europe/Paris",
      activatedAt: new Date().toISOString(),
      lastDelivery: null,
    });

    render(<NotificationSettingsSection />);

    await waitFor(() => {
      expect(screen.getByLabelText(/ntfy topic/i)).toHaveValue(
        "active-user-topic",
      );
    });
    expect(screen.getByLabelText(/reminder time/i)).toHaveValue("21:15");
    expect(screen.getByLabelText(/timezone/i)).toHaveValue("Europe/Paris");
    expect(
      screen.getByRole("button", { name: /remove notifications/i }),
    ).toBeInTheDocument();
  });

  it("cancels removing notification settings when cancel is clicked in confirmation dialog", async () => {
    const user = userEvent.setup();
    mockLoadNotificationSettings.mockResolvedValueOnce({
      topic: "active-user-topic",
      reminderTime: "21:15",
      timezone: "Europe/Paris",
      activatedAt: new Date().toISOString(),
      lastDelivery: null,
    });

    render(<NotificationSettingsSection />);

    const openRemoveButton = await screen.findByRole("button", {
      name: /remove notifications/i,
    });
    await user.click(openRemoveButton);

    expect(
      screen.getByRole("heading", { name: /remove streak notifications\?/i }),
    ).toBeVisible();
    expect(
      screen.getByText(
        /Are you sure you want to remove streak notifications\? This will delete your settings and delivery history\./i,
      ),
    ).toBeVisible();

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockRemoveNotificationSettings).not.toHaveBeenCalled();
  });

  it("confirms and removes notification settings when confirmed in dialog", async () => {
    const user = userEvent.setup();
    mockLoadNotificationSettings.mockResolvedValueOnce({
      topic: "active-user-topic",
      reminderTime: "21:15",
      timezone: "Europe/Paris",
      activatedAt: new Date().toISOString(),
      lastDelivery: null,
    });

    render(<NotificationSettingsSection />);

    const openRemoveButton = await screen.findByRole("button", {
      name: /remove notifications/i,
    });
    await user.click(openRemoveButton);

    expect(
      screen.getByRole("heading", { name: /remove streak notifications\?/i }),
    ).toBeVisible();

    // Click the confirmation button inside the dialog
    const dialog = screen.getByRole("dialog", { hidden: true });
    const confirmButton = dialog.querySelector(
      "button.bg-red-600",
    ) as HTMLElement;
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockRemoveNotificationSettings).toHaveBeenCalled();
    });
  });
  it("displays accessible error feedback when save fails due to expired proof", async () => {
    const user = userEvent.setup();
    mockSaveNotificationSettings.mockResolvedValueOnce({
      ok: false,
      reason: "proof-expired",
    });

    render(<NotificationSettingsSection />);

    const topicInput = await screen.findByLabelText(/ntfy topic/i);
    await user.type(topicInput, "new-topic-123");

    const testButton = screen.getByRole("button", { name: /send test/i });
    await user.click(testButton);

    const saveButton = screen.getByRole("button", { name: /save/i });
    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });

    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /expired \(15-minute limit\)/i,
      );
    });
    // Save should be disabled again
    expect(saveButton).toBeDisabled();
  });

  it("displays accessible error feedback when save fails due to already consumed proof", async () => {
    const user = userEvent.setup();
    mockSaveNotificationSettings.mockResolvedValueOnce({
      ok: false,
      reason: "proof-consumed",
    });

    render(<NotificationSettingsSection />);

    const topicInput = await screen.findByLabelText(/ntfy topic/i);
    await user.type(topicInput, "new-topic-123");

    const testButton = screen.getByRole("button", { name: /send test/i });
    await user.click(testButton);

    const saveButton = screen.getByRole("button", { name: /save/i });
    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });

    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/already been used/i);
    });
    // Save should be disabled again
    expect(saveButton).toBeDisabled();
  });

  describe("Latest delivery status rendering (T037)", () => {
    it("renders successful reminder status in local time without topic disclosure", async () => {
      mockLoadNotificationSettings.mockResolvedValueOnce({
        topic: "my-secret-topic-99",
        reminderTime: "19:00",
        timezone: "America/Chicago",
        activatedAt: new Date().toISOString(),
        lastDelivery: {
          kind: "reminder",
          outcome: "succeeded",
          attemptedAt: "2026-08-22 19:02",
          reason: null,
        },
      });

      render(<NotificationSettingsSection />);

      await waitFor(() => {
        expect(screen.getByText(/last delivery:/i)).toBeInTheDocument();
      });
      const deliveryCard = screen.getByText(/last delivery:/i).parentElement;
      expect(deliveryCard).not.toBeNull();
      expect(deliveryCard).toHaveTextContent(/reminder/i);
      expect(deliveryCard).toHaveTextContent(/succeeded/i);
      expect(deliveryCard).toHaveTextContent(/2026-08-22 19:02/i);

      // Status card must not show topic or leaked URL
      expect(deliveryCard?.textContent).not.toContain("my-secret-topic-99");
      expect(deliveryCard?.textContent).not.toContain("ntfy.sh");
    });

    it("renders failed milestone status with generic failure reason accessibly", async () => {
      mockLoadNotificationSettings.mockResolvedValueOnce({
        topic: "my-secret-topic-99",
        reminderTime: "19:00",
        timezone: "America/Chicago",
        activatedAt: new Date().toISOString(),
        lastDelivery: {
          kind: "milestone",
          outcome: "failed",
          attemptedAt: "2026-08-22 14:15",
          reason: "rate-limited",
        },
      });

      render(<NotificationSettingsSection />);

      await waitFor(() => {
        expect(screen.getByText(/last delivery:/i)).toBeInTheDocument();
      });

      const deliveryCard = screen.getByText(/last delivery:/i).parentElement;
      expect(deliveryCard).not.toBeNull();
      expect(deliveryCard).toHaveTextContent(/milestone/i);
      expect(deliveryCard).toHaveTextContent(/failed/i);
      expect(deliveryCard).toHaveTextContent(/2026-08-22 14:15/i);
      expect(deliveryCard).toHaveTextContent(/rate-limited/i);
    });

    it("clears delivery status when notifications are removed", async () => {
      const user = userEvent.setup();
      mockLoadNotificationSettings.mockResolvedValueOnce({
        topic: "active-topic",
        reminderTime: "19:00",
        timezone: "UTC",
        activatedAt: new Date().toISOString(),
        lastDelivery: {
          kind: "reminder",
          outcome: "succeeded",
          attemptedAt: "2026-08-22 19:00",
          reason: null,
        },
      });

      render(<NotificationSettingsSection />);

      const openRemoveButton = await screen.findByRole("button", {
        name: /remove notifications/i,
      });
      expect(screen.getByText(/last delivery:/i)).toBeInTheDocument();

      await user.click(openRemoveButton);

      const dialog = screen.getByRole("dialog", { hidden: true });
      const confirmButton = dialog.querySelector(
        "button.bg-red-600",
      ) as HTMLElement;
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockRemoveNotificationSettings).toHaveBeenCalled();
      });

      // Last delivery status should disappear
      await waitFor(() => {
        expect(screen.queryByText(/last delivery:/i)).not.toBeInTheDocument();
      });
    });

    it("requires a new test before saving replacement values on an already-active configuration", async () => {
      const user = userEvent.setup();
      mockLoadNotificationSettings.mockResolvedValueOnce({
        topic: "existing-topic",
        reminderTime: "19:00",
        timezone: "UTC",
        activatedAt: new Date().toISOString(),
        lastDelivery: null,
      });

      render(<NotificationSettingsSection />);

      const topicInput = await screen.findByLabelText(/ntfy topic/i);
      expect(topicInput).toHaveValue("existing-topic");

      const saveButton = screen.getByRole("button", { name: /save/i });
      expect(saveButton).toBeDisabled();

      // Edit topic
      await user.clear(topicInput);
      await user.type(topicInput, "new-replaced-topic");
      expect(saveButton).toBeDisabled();

      // Test with new values
      const testButton = screen.getByRole("button", { name: /send test/i });
      await user.click(testButton);

      await waitFor(() => {
        expect(saveButton).toBeEnabled();
      });

      // Saving replacement consumes proof and updates active configuration
      mockSaveNotificationSettings.mockResolvedValueOnce({
        ok: true,
        settings: {
          topic: "new-replaced-topic",
          reminderTime: "19:00",
          timezone: "UTC",
          activatedAt: new Date().toISOString(),
          lastDelivery: null,
        },
      });

      await user.click(saveButton);
      await waitFor(() => {
        expect(mockSaveNotificationSettings).toHaveBeenCalledWith({
          data: { proofId: "proof-123" },
        });
      });
    });
  });
});
