import { fireEvent, screen, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MultiSelectInput } from "./MultiSelectInput";

import type { MultiSelectQuestion } from "../../../domain/content/types";

const question: MultiSelectQuestion = {
  id: "q1",
  type: "multiSelect",
  prompt: [
    { kind: "text", text: "Which are elements? (Select all that apply.)" },
  ],
  explanation: [{ kind: "text", text: "Carbon and gold." }],
  xp: 10,
  options: [
    { id: "a", label: [{ kind: "text", text: "Water" }] },
    { id: "b", label: [{ kind: "text", text: "Carbon" }] },
    { id: "c", label: [{ kind: "text", text: "Gold" }] },
  ],
  correctOptionIds: ["b", "c"],
};

describe("MultiSelectInput", () => {
  it("renders a checkbox per option", () => {
    render(
      <MultiSelectInput
        question={question}
        selectedIds={[]}
        onToggle={vi.fn()}
        revealed={false}
      />,
    );
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
  });

  it("toggles a single option without clearing others", () => {
    const onToggle = vi.fn();
    render(
      <MultiSelectInput
        question={question}
        selectedIds={["b"]}
        onToggle={onToggle}
        revealed={false}
      />,
    );
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    expect(onToggle).toHaveBeenCalledWith("a");
  });

  it("renders selected checkboxes as checked", () => {
    render(
      <MultiSelectInput
        question={question}
        selectedIds={["b", "c"]}
        onToggle={vi.fn()}
        revealed={false}
      />,
    );
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).toBeChecked();
    expect(checkboxes[2]).toBeChecked();
  });

  it("disables the checkboxes when revealed", () => {
    render(
      <MultiSelectInput
        question={question}
        selectedIds={[]}
        onToggle={vi.fn()}
        revealed
      />,
    );
    for (const checkbox of screen.getAllByRole("checkbox")) {
      expect(checkbox).toBeDisabled();
    }
  });
});
