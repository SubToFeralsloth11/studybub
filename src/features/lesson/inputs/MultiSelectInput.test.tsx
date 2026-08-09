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

describe("MultiSelectInput - reveal feedback", () => {
  it("shows a correct-selected cue for a correctly selected option", () => {
    render(
      <MultiSelectInput
        question={question}
        selectedIds={["b"]}
        onToggle={vi.fn()}
        revealed
      />,
    );
    const carbon = screen.getByRole("checkbox", { name: /carbon/i });
    const label = carbon.closest("label")!;
    expect(label.className).toContain("ring-success");
    expect(screen.getByLabelText(/correct/i)).toBeInTheDocument();
  });

  it("shows a missed cue for a correct-but-unselected option", () => {
    render(
      <MultiSelectInput
        question={question}
        selectedIds={[]}
        onToggle={vi.fn()}
        revealed
      />,
    );
    const carbon = screen.getByRole("checkbox", { name: /carbon/i });
    const label = carbon.closest("label")!;
    expect(label.className).toContain("border-success");
    expect(label.className).toContain("border-dashed");
    // The missed state must not carry a solid ring (ring-2 would render a
    // spurious ink ring around the dashed border).
    expect(label.className).not.toMatch(/\bring(?:-\w+)?\b/);
    expect(screen.getAllByText("missed").length).toBeGreaterThan(0);
  });

  it("strikes through a wrongly selected option", () => {
    render(
      <MultiSelectInput
        question={question}
        selectedIds={["a"]}
        onToggle={vi.fn()}
        revealed
      />,
    );
    const water = screen.getByRole("checkbox", { name: /water/i });
    const label = water.closest("label")!;
    expect(label.className).toContain("ring-warn");
    expect(label.className).toContain("line-through");
  });

  it("dims an unselected incorrect option", () => {
    render(
      <MultiSelectInput
        question={question}
        selectedIds={["b"]}
        onToggle={vi.fn()}
        revealed
      />,
    );
    const water = screen.getByRole("checkbox", { name: /water/i });
    const label = water.closest("label")!;
    expect(label.className).toContain("opacity-60");
  });
});
