import { describe, expect, it } from "vitest";

import { markShortText } from "./markShortText";

import type { ShortTextQuestion } from "../content/types";

function shortText(accepted: string[]): ShortTextQuestion {
  return {
    id: "q1",
    type: "shortText",
    prompt: [{ kind: "text", text: "What is the capital?" }],
    explanation: [{ kind: "text", text: "Paris." }],
    xp: 10,
    accepted,
  };
}

describe("markShortText", () => {
  it("marks exact match correct", () => {
    expect(markShortText(shortText(["Paris"]), "Paris")).toEqual({
      status: "correct",
    });
  });

  it("marks case-insensitive match correct", () => {
    expect(markShortText(shortText(["Paris"]), "paris")).toEqual({
      status: "correct",
    });
    expect(markShortText(shortText(["Paris"]), "PARIS")).toEqual({
      status: "correct",
    });
  });

  it("marks match with diacritics as correct after normalisation", () => {
    expect(markShortText(shortText(["cafe"]), "café")).toEqual({
      status: "correct",
    });
  });

  it("marks trimmed whitespace match correct", () => {
    expect(markShortText(shortText(["Paris"]), "  Paris  ")).toEqual({
      status: "correct",
    });
  });

  it("marks incorrect when no match", () => {
    expect(markShortText(shortText(["Paris"]), "London")).toEqual({
      status: "incorrect",
    });
  });

  it("marks empty input as incorrect", () => {
    expect(markShortText(shortText(["Paris"]), "")).toEqual({
      status: "incorrect",
    });
  });

  it("matches any accepted answer", () => {
    expect(markShortText(shortText(["Paris", "paris"]), "paris")).toEqual({
      status: "correct",
    });
  });
});
