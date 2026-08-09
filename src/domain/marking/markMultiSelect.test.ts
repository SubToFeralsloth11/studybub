import { describe, expect, it } from "vitest";

import { markMultiSelect } from "./markMultiSelect";

import type { MultiSelectQuestion } from "../content/types";

const question: MultiSelectQuestion = {
  id: "q1",
  type: "multiSelect",
  prompt: [{ kind: "text", text: "Which are elements? (Select all that apply.)" }],
  explanation: [{ kind: "text", text: "Carbon and gold are elements." }],
  xp: 10,
  options: [
    { id: "a", label: [{ kind: "text", text: "Water" }] },
    { id: "b", label: [{ kind: "text", text: "Carbon" }] },
    { id: "c", label: [{ kind: "text", text: "Gold" }] },
  ],
  correctOptionIds: ["b", "c"],
};

describe("markMultiSelect", () => {
  it("marks the exact correct set correct", () => {
    expect(markMultiSelect(question, ["b", "c"])).toEqual({
      status: "correct",
    });
  });

  it("marks the correct set in any selection order correct", () => {
    expect(markMultiSelect(question, ["c", "b"])).toEqual({
      status: "correct",
    });
  });

  it("marks an incomplete set (missing a correct option) incorrect", () => {
    expect(markMultiSelect(question, ["b"])).toEqual({ status: "incorrect" });
  });

  it("marks a set with an extra wrong option incorrect", () => {
    expect(markMultiSelect(question, ["b", "c", "a"])).toEqual({
      status: "incorrect",
    });
  });

  it("marks a set containing only wrong options incorrect", () => {
    expect(markMultiSelect(question, ["a"])).toEqual({ status: "incorrect" });
  });

  it("marks an empty selection incorrect", () => {
    expect(markMultiSelect(question, [])).toEqual({ status: "incorrect" });
  });

  it("ignores duplicate selected ids when comparing sets", () => {
    expect(markMultiSelect(question, ["b", "c", "c"])).toEqual({
      status: "correct",
    });
  });
});
