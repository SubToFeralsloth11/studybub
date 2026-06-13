import { describe, expect, it } from "vitest";

import { markMatching } from "./markMatching";

import type { MatchingQuestion } from "../content/types";

function matching(
  pairs: { id: string; left: string; right: string }[],
): MatchingQuestion {
  return {
    id: "q1",
    type: "matching",
    prompt: [{ kind: "text", text: "Match items." }],
    explanation: [{ kind: "text", text: "Correct." }],
    xp: 10,
    pairs: pairs.map((p) => ({
      id: p.id,
      left: [{ kind: "text", text: p.left }],
      right: [{ kind: "text", text: p.right }],
    })),
  };
}

describe("markMatching", () => {
  it("marks all pairs correct", () => {
    const question = matching([
      { id: "p1", left: "H2O", right: "Water" },
      { id: "p2", left: "CO2", right: "Carbon dioxide" },
    ]);
    expect(
      markMatching(question, JSON.stringify({ p1: "p1", p2: "p2" })),
    ).toEqual({ status: "correct" });
  });

  it("marks incorrect when one pair is wrong", () => {
    const question = matching([
      { id: "p1", left: "H2O", right: "Water" },
      { id: "p2", left: "CO2", right: "Carbon dioxide" },
    ]);
    expect(
      markMatching(question, JSON.stringify({ p1: "p2", p2: "p1" })),
    ).toEqual({ status: "incorrect" });
  });

  it("marks incorrect when all pairs are wrong", () => {
    const question = matching([
      { id: "p1", left: "H2O", right: "Water" },
      { id: "p2", left: "CO2", right: "Carbon dioxide" },
    ]);
    expect(
      markMatching(question, JSON.stringify({ p1: "p3", p2: "p4" })),
    ).toEqual({ status: "incorrect" });
  });

  it("marks incorrect when not all pairs are matched", () => {
    const question = matching([
      { id: "p1", left: "H2O", right: "Water" },
      { id: "p2", left: "CO2", right: "Carbon dioxide" },
      { id: "p3", left: "NaCl", right: "Salt" },
    ]);
    expect(
      markMatching(question, JSON.stringify({ p1: "p1", p2: "p2" })),
    ).toEqual({ status: "incorrect" });
  });

  it("marks unreadable for invalid JSON", () => {
    const question = matching([
      { id: "p1", left: "H2O", right: "Water" },
      { id: "p2", left: "CO2", right: "Carbon dioxide" },
    ]);
    expect(markMatching(question, "not-json")).toEqual({
      status: "unreadable",
    });
  });
});
