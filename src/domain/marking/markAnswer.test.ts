/**
 * Tests for the answer-marking dispatcher.
 *
 * @author John Grimes
 */

import { describe, expect, it, vi } from "vitest";

import { markAnswer } from "./markAnswer";

import type { Question } from "../content/types";

// --- Fixtures ---

function mcqQuestion(): Question {
  return {
    id: "q1",
    type: "mcq",
    prompt: [{ kind: "text", text: "Pick one" }],
    explanation: [{ kind: "text", text: "A is correct." }],
    xp: 10,
    options: [
      { id: "a", label: [{ kind: "text", text: "Option A" }] },
      { id: "b", label: [{ kind: "text", text: "Option B" }] },
    ],
    correctOptionId: "a",
  };
}

function numericQuestion(): Question {
  return {
    id: "q2",
    type: "numeric",
    prompt: [{ kind: "text", text: "What is 2+2?" }],
    explanation: [{ kind: "text", text: "It is 4." }],
    xp: 10,
    accepted: ["4"],
  };
}

function expressionQuestion(): Question {
  return {
    id: "q3",
    type: "expression",
    prompt: [{ kind: "text", text: "Expand a(b+c)" }],
    explanation: [{ kind: "text", text: "a*b + a*c" }],
    xp: 10,
    target: "a*b + a*c",
    variables: ["a", "b", "c"],
  };
}

function shortTextQuestion(): Question {
  return {
    id: "q4",
    type: "shortText",
    prompt: [{ kind: "text", text: "Capital of France?" }],
    explanation: [{ kind: "text", text: "Paris." }],
    xp: 10,
    accepted: ["Paris"],
  };
}

function fillInTheBlankQuestion(): Question {
  return {
    id: "q5",
    type: "fillInTheBlank",
    prompt: [{ kind: "text", text: "Complete" }],
    explanation: [{ kind: "text", text: "water" }],
    xp: 10,
    template: [{ kind: "text", text: "The ___ is wet." }],
    accepted: ["water"],
  };
}

function matchingQuestion(): Question {
  return {
    id: "q6",
    type: "matching",
    prompt: [{ kind: "text", text: "Match them" }],
    explanation: [{ kind: "text", text: "A-B, C-D." }],
    xp: 10,
    pairs: [
      {
        id: "p1",
        left: [{ kind: "text", text: "H2O" }],
        right: [{ kind: "text", text: "Water" }],
      },
      {
        id: "p2",
        left: [{ kind: "text", text: "CO2" }],
        right: [{ kind: "text", text: "Carbon dioxide" }],
      },
    ],
  };
}

// --- Tests ---

describe("markAnswer — MCQ", () => {
  it("marks the correct option as correct", async () => {
    const result = await markAnswer(mcqQuestion(), "a");
    expect(result.status).toBe("correct");
  });

  it("marks an incorrect option as incorrect", async () => {
    const result = await markAnswer(mcqQuestion(), "b");
    expect(result.status).toBe("incorrect");
  });
});

describe("markAnswer — numeric", () => {
  it("marks matching numeric value as correct", async () => {
    const result = await markAnswer(numericQuestion(), "4");
    expect(result.status).toBe("correct");
  });

  it("marks non-matching numeric value as incorrect", async () => {
    const result = await markAnswer(numericQuestion(), "5");
    expect(result.status).toBe("incorrect");
  });
});

describe("markAnswer — expression", () => {
  it("marks an equivalent expression as correct", async () => {
    const result = await markAnswer(expressionQuestion(), "a*b + a*c");
    expect(result.status).toBe("correct");
  });

  it("marks a non-equivalent expression as incorrect", async () => {
    const result = await markAnswer(expressionQuestion(), "a+b+c");
    expect(result.status).toBe("incorrect");
  });

  it("returns unreadable for unparseable input", async () => {
    const result = await markAnswer(expressionQuestion(), "2a +");
    expect(result.status).toBe("unreadable");
  });
});

describe("markAnswer — shortText", () => {
  it("returns aiNotConfigured when no AI config is provided", async () => {
    // Without AI config, short-text marking returns aiNotConfigured status
    // so the UI can prompt the learner to go to Settings.
    const result = await markAnswer(shortTextQuestion(), "Paris");
    expect(result.status).toBe("aiNotConfigured");
  });

  it("uses injected fetch when provided", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(
        Response.json({ correct: true, feedback: "Great!" }, { status: 200 }),
      );
    const result = await markAnswer(shortTextQuestion(), "Paris", {
      aiConfig: {
        baseUrl: "https://example.com/v1",
        apiKey: "sk-test",
        model: "gpt-4o",
      },
      fetch: mockFetch as typeof globalThis.fetch,
    });
    expect(result.status).toBe("correct");
  });
});

describe("markAnswer — fillInTheBlank", () => {
  it("marks a matching answer as correct", async () => {
    const result = await markAnswer(fillInTheBlankQuestion(), "water");
    expect(result.status).toBe("correct");
  });

  it("marks a non-matching answer as incorrect", async () => {
    const result = await markAnswer(fillInTheBlankQuestion(), "fire");
    expect(result.status).toBe("incorrect");
  });
});

describe("markAnswer — matching", () => {
  it("marks all-correct pair mapping as correct", async () => {
    const mapping = JSON.stringify({ p1: "p1", p2: "p2" });
    const result = await markAnswer(matchingQuestion(), mapping);
    expect(result.status).toBe("correct");
  });

  it("marks a wrong pair mapping as incorrect", async () => {
    const mapping = JSON.stringify({ p1: "p2", p2: "p1" });
    const result = await markAnswer(matchingQuestion(), mapping);
    expect(result.status).toBe("incorrect");
  });
});
