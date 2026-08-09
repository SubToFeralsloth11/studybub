/**
 * Tests for the QuestionView component with short-text AI marking.
 *
 * Mocks the AI config server functions to verify marking behaviour with
 * and without AI configuration.
 *
 * @module features/lesson/QuestionView.test
 * @author John Grimes
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QuestionView } from "./QuestionView";
import { setMockAiConfig, clearMockProgress } from "../../test/mocks";
import { renderApp } from "../../test/renderApp";

// Mock the shuffle helpers so multiselect option display order is
// deterministic: the displayed order becomes the reversed authored order.
const reversedMultiSelect = vi.hoisted(() =>
  vi.fn((question: MultiSelectQuestion) => ({
    ...question,
    options: question.options.toReversed(),
  })),
);
vi.mock("../../domain/content/shuffleOptions", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../domain/content/shuffleOptions")
    >();
  return {
    ...actual,
    shuffleMultiSelectOptions: reversedMultiSelect,
  };
});

import type {
  MultiSelectQuestion,
  ShortTextQuestion,
} from "../../domain/content/types";
import type { AiConfig } from "../../domain/persistence/aiConfig";

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

/** A valid AI config fixture. */
const validConfig: AiConfig = {
  baseUrl: "https://example.com/v1",
  apiKey: "sk-test",
  model: "gpt-4o",
};

describe("QuestionView — short-text AI marking", () => {
  const onAnswered = vi.fn();
  const onContinue = vi.fn();

  beforeEach(() => {
    onAnswered.mockClear();
    onContinue.mockClear();
    clearMockProgress();
    setMockAiConfig(null);
  });

  it("shows loading state on submit when AI is configured", async () => {
    setMockAiConfig(validConfig);

    const user = userEvent.setup();
    await renderApp(
      <QuestionView
        question={shortTextQ()}
        onAnswered={onAnswered}
        onContinue={onContinue}
      />,
    );

    await user.type(screen.getByRole("textbox"), "4");
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(
      screen.getByRole("button", { name: /judging your answer/i }),
    ).toBeInTheDocument();
  });

  it("shows aiNotConfigured when no config is saved", async () => {
    const user = userEvent.setup();
    await renderApp(
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
    setMockAiConfig(validConfig);

    const user = userEvent.setup();
    await renderApp(
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

/** A multiselect question fixture. */
function multiSelectQ(): MultiSelectQuestion {
  return {
    id: "ms1",
    type: "multiSelect",
    prompt: [
      { kind: "text", text: "Which are elements? (Select all that apply.)" },
    ],
    explanation: [{ kind: "text", text: "Carbon and gold are elements." }],
    xp: 15,
    options: [
      { id: "a", label: [{ kind: "text", text: "Water" }] },
      { id: "b", label: [{ kind: "text", text: "Carbon" }] },
      { id: "c", label: [{ kind: "text", text: "Gold" }] },
      { id: "d", label: [{ kind: "text", text: "Air" }] },
    ],
    correctOptionIds: ["b", "c"],
  };
}

// The mocked shuffle reverses the option order so the displayed question keeps
// the same correct ids but a distinct, deterministic display order.
function shuffledCopy(question: MultiSelectQuestion): MultiSelectQuestion {
  return {
    ...question,
    options: question.options.toReversed(),
  };
}

describe("QuestionView — multiselect flow", () => {
  const onAnswered = vi.fn();
  const onContinue = vi.fn();

  beforeEach(() => {
    onAnswered.mockClear();
    onContinue.mockClear();
    clearMockProgress();
    setMockAiConfig(null);
  });

  it("lets the learner select multiple options independently", async () => {
    const user = userEvent.setup();
    await renderApp(
      <QuestionView
        question={multiSelectQ()}
        onAnswered={onAnswered}
        onContinue={onContinue}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: /carbon/i }));
    await user.click(screen.getByRole("checkbox", { name: /gold/i }));

    expect(screen.getByRole("checkbox", { name: /carbon/i })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /gold/i })).toBeChecked();
  });

  it("keeps an earlier selection when toggling another option", async () => {
    const user = userEvent.setup();
    await renderApp(
      <QuestionView
        question={multiSelectQ()}
        onAnswered={onAnswered}
        onContinue={onContinue}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: /carbon/i }));
    await user.click(screen.getByRole("checkbox", { name: /gold/i }));

    expect(screen.getByRole("checkbox", { name: /carbon/i })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /gold/i })).toBeChecked();
  });

  it("deselects a tapped option while keeping the other selections", async () => {
    const user = userEvent.setup();
    await renderApp(
      <QuestionView
        question={multiSelectQ()}
        onAnswered={onAnswered}
        onContinue={onContinue}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: /carbon/i }));
    await user.click(screen.getByRole("checkbox", { name: /gold/i }));
    await user.click(screen.getByRole("checkbox", { name: /carbon/i }));

    expect(screen.getByRole("checkbox", { name: /carbon/i })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /gold/i })).toBeChecked();
  });

  it("keeps the Check button disabled until at least one option is selected", async () => {
    const user = userEvent.setup();
    await renderApp(
      <QuestionView
        question={multiSelectQ()}
        onAnswered={onAnswered}
        onContinue={onContinue}
      />,
    );

    const checkButton = screen.getByRole("button", { name: /check answer/i });
    expect(checkButton).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: /carbon/i }));
    expect(checkButton).toBeEnabled();
  });

  it("marks a correct set as correct with full XP", async () => {
    const user = userEvent.setup();
    await renderApp(
      <QuestionView
        question={multiSelectQ()}
        onAnswered={onAnswered}
        onContinue={onContinue}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: /carbon/i }));
    await user.click(screen.getByRole("checkbox", { name: /gold/i }));
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/correct/i);
    });
    expect(onAnswered).toHaveBeenCalledWith(true, 15);
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
  });

  it("marks a partial selection as incorrect", async () => {
    const user = userEvent.setup();
    await renderApp(
      <QuestionView
        question={multiSelectQ()}
        onAnswered={onAnswered}
        onContinue={onContinue}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: /carbon/i }));
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/not quite/i);
    });
    expect(onAnswered).toHaveBeenCalledWith(false, 15);
  });

  it("disables the checkboxes once the answer is checked", async () => {
    const user = userEvent.setup();
    await renderApp(
      <QuestionView
        question={multiSelectQ()}
        onAnswered={onAnswered}
        onContinue={onContinue}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: /carbon/i }));
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: /carbon/i })).toBeDisabled();
    });
  });
});

describe("QuestionView — multiselect shuffle", () => {
  const onAnswered = vi.fn();
  const onContinue = vi.fn();

  beforeEach(() => {
    onAnswered.mockClear();
    onContinue.mockClear();
    clearMockProgress();
    setMockAiConfig(null);
    reversedMultiSelect.mockImplementation((question: MultiSelectQuestion) =>
      shuffledCopy(question),
    );
  });

  it("shuffles the displayed multiSelect options before presenting", async () => {
    await renderApp(
      <QuestionView
        question={multiSelectQ()}
        onAnswered={onAnswered}
        onContinue={onContinue}
      />,
    );

    expect(reversedMultiSelect).toHaveBeenCalled();
  });

  it("keeps the correct option ids intact through the shuffle", async () => {
    const user = userEvent.setup();
    await renderApp(
      <QuestionView
        question={multiSelectQ()}
        onAnswered={onAnswered}
        onContinue={onContinue}
      />,
    );

    // The displayed order is reversed (Air, Gold, Carbon, Water) but the
    // correct set is unchanged, so selecting Carbon and Gold still passes.
    await user.click(screen.getByRole("checkbox", { name: /carbon/i }));
    await user.click(screen.getByRole("checkbox", { name: /gold/i }));
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/correct/i);
    });
    expect(onAnswered).toHaveBeenCalledWith(true, 15);
  });
});
