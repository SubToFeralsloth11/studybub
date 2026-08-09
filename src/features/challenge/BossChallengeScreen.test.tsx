import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BossChallengeScreen } from "./BossChallengeScreen";
import { defaultState } from "../../domain/persistence/schema";
import { clearMockProgress, setMockProgress } from "../../test/mocks";
import { renderApp } from "../../test/renderApp";

import type {
  AppContent,
  McqQuestion,
  MultiSelectQuestion,
  Track,
} from "../../domain/content/types";

// The result screen fires confetti, which needs a real canvas; stub it.
vi.mock("canvas-confetti", () => ({ default: () => Promise.resolve() }));

function mcq(id: string, correct: string): McqQuestion {
  return {
    id,
    type: "mcq",
    prompt: [{ kind: "text", text: `Q ${id}` }],
    explanation: [{ kind: "text", text: "e" }],
    xp: 10,
    options: [
      { id: "a", label: [{ kind: "text", text: "A" }] },
      { id: "b", label: [{ kind: "text", text: "B" }] },
    ],
    correctOptionId: correct,
  };
}

function multiSelect(id: string): MultiSelectQuestion {
  return {
    id,
    type: "multiSelect",
    prompt: [
      { kind: "text", text: `Which of ${id} apply? (Select all that apply.)` },
    ],
    explanation: [{ kind: "text", text: "e" }],
    xp: 15,
    options: [
      { id: "a", label: [{ kind: "text", text: "Alpha" }] },
      { id: "b", label: [{ kind: "text", text: "Beta" }] },
      { id: "c", label: [{ kind: "text", text: "Gamma" }] },
    ],
    correctOptionIds: ["a", "c"],
  };
}

const track: Track = {
  id: "time",
  subjectId: "maths",
  title: "Time (Year 4)",
  description: "d",
  lessons: [
    {
      id: "t1",
      order: 1,
      title: "Lesson 1",
      sourceRef: "X",
      learnCards: [
        { id: "c", heading: "k", body: [{ kind: "text", text: "x" }] },
      ],
      practice: [],
      mastery: [],
    },
  ],
  challenge: {
    id: "time-boss",
    title: "Boss challenge: Time review",
    sourceRef: "P",
    questions: [mcq("q1", "a"), mcq("q2", "b")],
    bonusXp: 80,
    passBadgeId: "boss-time",
  },
};

const content: AppContent = {
  subjects: [
    {
      id: "maths",
      title: "Maths",
      description: "Maths",
      icon: "🧮",
      accent: "#6D4AFF",
    },
  ],
  tracks: [track],
  badges: [
    {
      id: "boss-time",
      title: "Time boss slayer",
      description: "Pass the Time boss",
      criterion: "boss-pass:time",
      icon: "🏆",
    },
  ],
};

async function renderChallenge() {
  return renderApp(<BossChallengeScreen />, {
    route: "/challenge/time",
    path: "challenge/$trackId",
    content,
  });
}

function seedAllLessonsComplete() {
  setMockProgress({
    ...defaultState(),
    lessons: { t1: { completed: true, bestAccuracy: 1 } },
  });
}

beforeEach(() => {
  clearMockProgress();
});

describe("BossChallengeScreen", () => {
  it("shows a locked state until every lesson is complete", async () => {
    await renderChallenge();
    expect(screen.getByText(/boss challenge locked/i)).toBeInTheDocument();
  });

  it("plays through the questions and reports a score with rewards", async () => {
    seedAllLessonsComplete();
    const user = userEvent.setup();
    await renderChallenge();

    // Intro -> start.
    await user.click(screen.getByRole("button", { name: /start challenge/i }));

    // Answer question 1 correctly (option a).
    const q1 = screen.getAllByRole("radio");
    await user.click(q1.find((r) => r.getAttribute("value") === "a")!);
    await user.click(screen.getByRole("button", { name: /submit answer/i }));

    // Answer question 2 correctly (option b) and finish.
    const q2 = screen.getAllByRole("radio");
    await user.click(q2.find((r) => r.getAttribute("value") === "b")!);
    await user.click(screen.getByRole("button", { name: /finish/i }));

    expect(screen.getByText(/challenge complete/i)).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(screen.getByText(/\+80 bonus XP/i)).toBeInTheDocument();
  });

  it("does not render a Reference control on the boss challenge screen", async () => {
    seedAllLessonsComplete();
    const user = userEvent.setup();
    await renderChallenge();
    await user.click(screen.getByRole("button", { name: /start challenge/i }));
    expect(
      screen.queryByRole("button", { name: /reference/i }),
    ).not.toBeInTheDocument();
  });
});

describe("BossChallengeScreen - multiSelect", () => {
  const multiSelectTrack: Track = {
    ...track,
    challenge: {
      id: "time-boss",
      title: "Boss challenge: Time review",
      sourceRef: "P",
      questions: [multiSelect("ms1")],
      bonusXp: 80,
      passBadgeId: "boss-time",
    },
  };

  const multiSelectContent: AppContent = {
    ...content,
    tracks: [multiSelectTrack],
  };

  function seedComplete() {
    setMockProgress({
      ...defaultState(),
      lessons: { t1: { completed: true, bestAccuracy: 1 } },
    });
  }

  beforeEach(() => {
    clearMockProgress();
  });

  it("renders checkboxes that toggle independently in the challenge", async () => {
    seedComplete();
    const user = userEvent.setup();
    await renderApp(<BossChallengeScreen />, {
      route: "/challenge/time",
      path: "challenge/$trackId",
      content: multiSelectContent,
    });
    await user.click(screen.getByRole("button", { name: /start challenge/i }));

    const alpha = screen.getByRole("checkbox", { name: /alpha/i });
    const beta = screen.getByRole("checkbox", { name: /beta/i });
    await user.click(alpha);
    await user.click(beta);
    expect(alpha).toBeChecked();
    expect(beta).toBeChecked();
  });

  it("scores the exact set: selecting both correct options passes the challenge", async () => {
    seedComplete();
    const user = userEvent.setup();
    await renderApp(<BossChallengeScreen />, {
      route: "/challenge/time",
      path: "challenge/$trackId",
      content: multiSelectContent,
    });
    await user.click(screen.getByRole("button", { name: /start challenge/i }));

    await user.click(screen.getByRole("checkbox", { name: /alpha/i }));
    await user.click(screen.getByRole("checkbox", { name: /gamma/i }));
    await user.click(screen.getByRole("button", { name: /finish/i }));

    expect(screen.getByText(/challenge complete/i)).toBeInTheDocument();
    expect(screen.getByText("1 / 1")).toBeInTheDocument();
  });

  it("does not award a pass for a partial selection", async () => {
    seedComplete();
    const user = userEvent.setup();
    await renderApp(<BossChallengeScreen />, {
      route: "/challenge/time",
      path: "challenge/$trackId",
      content: multiSelectContent,
    });
    await user.click(screen.getByRole("button", { name: /start challenge/i }));

    await user.click(screen.getByRole("checkbox", { name: /alpha/i }));
    await user.click(screen.getByRole("button", { name: /finish/i }));

    expect(screen.getByText(/challenge complete/i)).toBeInTheDocument();
    expect(screen.getByText("0 / 1")).toBeInTheDocument();
  });

  it("does not show per-question feedback in the challenge", async () => {
    seedComplete();
    const user = userEvent.setup();
    await renderApp(<BossChallengeScreen />, {
      route: "/challenge/time",
      path: "challenge/$trackId",
      content: multiSelectContent,
    });
    await user.click(screen.getByRole("button", { name: /start challenge/i }));
    await user.click(screen.getByRole("checkbox", { name: /alpha/i }));
    await user.click(screen.getByRole("button", { name: /finish/i }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("presents multiSelect options in authored order (no shuffle)", async () => {
    seedComplete();
    const user = userEvent.setup();
    await renderApp(<BossChallengeScreen />, {
      route: "/challenge/time",
      path: "challenge/$trackId",
      content: multiSelectContent,
    });
    await user.click(screen.getByRole("button", { name: /start challenge/i }));

    const values = screen
      .getAllByRole("checkbox")
      .map((checkbox) => checkbox.getAttribute("value"));
    expect(values).toEqual(["a", "b", "c"]);
  });

  it("resets the selection between consecutive multiSelect questions", async () => {
    seedComplete();
    const user = userEvent.setup();
    await renderApp(<BossChallengeScreen />, {
      route: "/challenge/time",
      path: "challenge/$trackId",
      content: {
        ...content,
        tracks: [
          {
            ...track,
            challenge: {
              id: "time-boss",
              title: "Boss challenge: Time review",
              sourceRef: "P",
              questions: [multiSelect("ms1"), multiSelect("ms2")],
              bonusXp: 80,
              passBadgeId: "boss-time",
            },
          },
        ],
      },
    });
    await user.click(screen.getByRole("button", { name: /start challenge/i }));

    await user.click(screen.getByRole("checkbox", { name: /alpha/i }));
    await user.click(screen.getByRole("checkbox", { name: /beta/i }));
    await user.click(screen.getByRole("button", { name: /submit answer/i }));

    const secondQuestion = screen.getAllByRole("checkbox");
    expect(secondQuestion).toHaveLength(3);
    for (const checkbox of secondQuestion) {
      expect(checkbox).not.toBeChecked();
    }
  });
});
