/**
 * Tests for the settings screen.
 *
 * Mocks the AI config and notifications server functions to verify the form fields, save
 * button, clear behaviour, API key masking, and streak notification card integration.
 *
 * @module features/settings/SettingsScreen.test
 * @author John Grimes
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the AI config server functions.
const mockLoadAiConfig = vi.fn().mockResolvedValue(null);
const mockSaveAiConfig = vi.fn().mockResolvedValue({ ok: true });
const mockClearAiConfig = vi.fn().mockResolvedValue({ ok: true });

vi.mock("../../server/api/aiConfig", () => ({
  loadAiConfig: (...args: unknown[]) => mockLoadAiConfig(...args),
  saveAiConfig: (...args: unknown[]) => mockSaveAiConfig(...args),
  clearAiConfig: (...args: unknown[]) => mockClearAiConfig(...args),
}));

// Mock the notifications server functions.
const mockLoadNotificationSettings = vi.fn().mockResolvedValue(null);
const mockTestNotificationSettings = vi.fn().mockResolvedValue({ ok: true });
const mockSaveNotificationSettings = vi.fn().mockResolvedValue({ ok: true });
const mockRemoveNotificationSettings = vi.fn().mockResolvedValue({ ok: true });

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

import { SettingsScreen } from "./SettingsScreen";
import { AiConfigProvider } from "../../state/aiConfigContext";
import { renderInRouter } from "../../test/renderApp";

import type { AiConfig } from "../../domain/persistence/aiConfig";

const SAVED_CONFIG: AiConfig = {
  baseUrl: "https://saved.example.com/v1",
  apiKey: "sk-saved123",
  model: "saved-model",
};

async function renderSettings() {
  return renderInRouter(
    <AiConfigProvider>
      <SettingsScreen />
    </AiConfigProvider>,
    "/settings",
  );
}

describe("SettingsScreen", () => {
  beforeEach(() => {
    mockLoadAiConfig.mockReset().mockResolvedValue(null);
    mockSaveAiConfig.mockReset().mockResolvedValue({ ok: true });
    mockClearAiConfig.mockReset().mockResolvedValue({ ok: true });
    mockLoadNotificationSettings.mockReset().mockResolvedValue(null);
  });

  it("renders both AI Marking and Streak Notifications cards", async () => {
    await renderSettings();
    expect(
      screen.getByRole("heading", { name: /ai marking/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /streak notifications/i }),
    ).toBeInTheDocument();
  });

  it("renders three labelled fields and a Save button for AI marking", async () => {
    await renderSettings();
    expect(screen.getByLabelText(/api base url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/api key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^save ai settings$/i }),
    ).toBeInTheDocument();
  });

  it("pre-populates from saved config when present", async () => {
    mockLoadAiConfig.mockResolvedValue(SAVED_CONFIG);

    await renderSettings();

    await waitFor(() => {
      expect(screen.getByLabelText(/api base url/i)).toHaveValue(
        "https://saved.example.com/v1",
      );
    });
    expect(screen.getByLabelText(/model/i)).toHaveValue("saved-model");
  });

  it("shows confirmation on Save", async () => {
    const user = userEvent.setup();
    await renderSettings();

    await user.type(
      screen.getByLabelText(/api base url/i),
      "https://example.com/v1",
    );
    await user.type(screen.getByLabelText(/api key/i), "sk-test");
    await user.type(screen.getByLabelText(/model/i), "gpt-4o");
    await user.click(
      screen.getByRole("button", { name: /^save ai settings$/i }),
    );

    expect(screen.getByRole("status")).toHaveTextContent(/saved/i);

    await waitFor(() => {
      expect(mockSaveAiConfig).toHaveBeenCalled();
    });
  });

  it("does not save when fields are partially filled", async () => {
    const user = userEvent.setup();
    await renderSettings();

    await user.clear(screen.getByLabelText(/api base url/i));
    await user.clear(screen.getByLabelText(/api key/i));
    await user.clear(screen.getByLabelText(/model/i));

    await user.type(
      screen.getByLabelText(/api base url/i),
      "https://example.com/v1",
    );
    await user.click(
      screen.getByRole("button", { name: /^save ai settings$/i }),
    );

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("has a back link to home", async () => {
    await renderSettings();
    const backLink = screen.getByRole("link", { name: /back/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("masks the API key by default and allows revealing", async () => {
    const user = userEvent.setup();
    mockLoadAiConfig.mockResolvedValue(SAVED_CONFIG);

    await renderSettings();

    const apiKeyField = screen.getByLabelText(/api key/i);
    expect(apiKeyField).toHaveAttribute("type", "password");

    const revealButton = screen.getByRole("button", { name: /show/i });
    await user.click(revealButton);

    expect(apiKeyField).toHaveAttribute("type", "text");
  });
});
