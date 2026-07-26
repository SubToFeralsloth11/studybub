import { describe, expect, it } from "vitest";

import { gameQuestions } from "./questions";

import type { Question, Track } from "../content/types";

/** Builds a minimal valid MCQ question with a unique id. */
function question(id: string): Question {
  return {
    id,
    type: "mcq",
    prompt: [{ kind: "text", text: id }],
    options: [
      { id: "a", label: [{ kind: "text", text: "a" }] },
      { id: "b", label: [{ kind: "text", text: "b" }] },
    ],
    correctOptionId: "a",
    explanation: [{ kind: "text", text: "e" }],
    xp: 5,
  };
}

function trackWith(
  lessons: {
    practice?: Question[];
    mastery?: Question[];
  }[],
): Track {
  return {
    id: "t",
    subjectId: "s",
    title: "T",
    description: "",
    lessons: lessons.map((l, i) => ({
      id: `l${i}`,
      order: i + 1,
      title: `L${i}`,
      sourceRef: "",
      learnCards: [],
      practice: l.practice ?? [],
      mastery: l.mastery ?? [],
    })),
    challenge: {
      id: "c",
      title: "C",
      sourceRef: "",
      questions: [question("boss")],
      bonusXp: 10,
      passBadgeId: "boss-pass:t",
    },
  } as Track;
}

describe("gameQuestions", () => {
  it("gathers practice, mastery, and challenge questions in order", () => {
    const track = trackWith([
      { practice: [question("p1")], mastery: [question("m1")] },
      { practice: [question("p2")], mastery: [question("m2")] },
    ]);
    const pool = gameQuestions(track);
    expect(pool.map((q) => q.id)).toEqual(["p1", "m1", "p2", "m2", "boss"]);
  });

  it("de-duplicates questions that share an id across sets", () => {
    const shared = question("shared");
    const track = trackWith([{ practice: [shared], mastery: [shared] }]);
    const pool = gameQuestions(track);
    expect(pool).toHaveLength(2); // shared once, plus the boss question
    expect(pool[0].id).toBe("shared");
  });

  it("returns only the challenge questions for a track with no lessons", () => {
    const track = trackWith([]);
    expect(gameQuestions(track).map((q) => q.id)).toEqual(["boss"]);
  });
});
