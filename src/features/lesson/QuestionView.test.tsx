import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { QuestionView } from "./QuestionView";
import { STORAGE_KEY } from "../../domain/persistence/aiConfig";
import { renderApp } from "../../test/renderApp";

import type { ShortTextQuestion } from "../../domain/content/types";

/** A short-text question fixture. */
function shortTextQ(overrides?: Partial<ShortTextQuestion>): ShortTextQuestion {
  return {
    id: "q1",
    type: "shortText",
    prompt: [{ kind: "text", text: "What is 2+2?" }],
    explanation: [{ kind: "text", text: "It is 4." }],
    xp: 10,
    accepted: ["4"],
    ...overrides,
  };
}

describe("QuestionView — short-text AI marking", () => {
  const onAnswered = vi.fn();
  const onContinue = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    onAnswered.mockClear();
    onContinue.mockClear();
  });

  it("shows loading state on submit when AI is configured", async () => {
    // Save a valid AI config so AI marking kicks in.
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        baseUrl: "https://example.com/v1",
        apiKey: "sk-test",
        model: "gpt-4o",
      }),
    );

    const user = userEvent.setup();
    renderApp(
      <QuestionView
        question={shortTextQ()}
        onAnswered={onAnswered}
        onContinue={onContinue}
      />,
    );

    await user.type(screen.getByRole("textbox"), "4");
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    // "Judging your answer…" should appear on the submit button.
    expect(
      screen.getByRole("button", { name: /judging your answer/i }),
    ).toBeInTheDocument();
  });

  it("shows aiNotConfigured when no config is saved", async () => {
    const user = userEvent.setup();
    renderApp(
      <QuestionView
        question={shortTextQ()}
        onAnswered={onAnswered}
        onContinue={onContinue}
      />,
    );

    await user.type(screen.getByRole("textbox"), "4");
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/not configured/i);
    });
  });

  it("disables submit button during loading for short-text", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        baseUrl: "https://example.com/v1",
        apiKey: "sk-test",
        model: "gpt-4o",
      }),
    );

    const user = userEvent.setup();
    renderApp(
      <QuestionView
        question={shortTextQ()}
        onAnswered={onAnswered}
        onContinue={onContinue}
      />,
    );

    await user.type(screen.getByRole("textbox"), "4");
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    const judgingButton = screen.getByRole("button", {
      name: /judging your answer/i,
    });
    expect(judgingButton).toBeDisabled();
  });
});
