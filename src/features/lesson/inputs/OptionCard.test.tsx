import { screen, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OptionCard, type OptionRevealState } from "./OptionCard";

import type { McqOption } from "../../../domain/content/types";

const option: McqOption = {
  id: "b",
  label: [{ kind: "text", text: "Carbon" }],
};

function renderCard(props: {
  selected?: boolean;
  revealed?: boolean;
  revealState?: OptionRevealState;
}) {
  const { selected = false, revealed = false, revealState } = props;
  return render(
    <OptionCard
      option={option}
      selected={selected}
      revealed={revealed}
      revealState={revealState}
      control={
        <input type="radio" name="test" value="b" checked={selected} readOnly />
      }
    />,
  );
}

describe("OptionCard", () => {
  it("renders the option content", () => {
    renderCard({});
    expect(screen.getByText("Carbon")).toBeInTheDocument();
  });

  it("applies the selected ring when selected before reveal", () => {
    renderCard({ selected: true });
    const label = screen.getByText("Carbon").closest("label")!;
    expect(label.className).toContain("ring-brand");
    expect(label.className).toContain("bg-brand-soft");
  });

  it("renders the control", () => {
    renderCard({});
    const control = screen.getByRole("radio");
    expect(control).toBeInTheDocument();
  });

  it("shows the correct reveal state with a tick", () => {
    renderCard({ revealed: true, revealState: "correct" });
    const label = screen.getByText("Carbon").closest("label")!;
    expect(label.className).toContain("ring-success");
    expect(screen.getByLabelText(/correct/i)).toBeInTheDocument();
  });

  it("shows the correct-missed reveal state with a missed cue", () => {
    renderCard({ revealed: true, revealState: "correct-missed" });
    const label = screen.getByText("Carbon").closest("label")!;
    expect(label.className).toContain("border-success");
    expect(label.className).toContain("border-dashed");
    // The missed state must not carry a solid ring (ring-2 would render a
    // spurious ink ring around the dashed border).
    expect(label.className).not.toMatch(/\bring(?:-\w+)?\b/);
    expect(screen.getByText("missed")).toBeInTheDocument();
  });

  it("shows the wrong-selected reveal state struck through", () => {
    renderCard({ revealed: true, revealState: "wrong-selected" });
    const label = screen.getByText("Carbon").closest("label")!;
    expect(label.className).toContain("ring-warn");
    expect(label.className).toContain("line-through");
    expect(screen.getByLabelText(/wrong/i)).toBeInTheDocument();
  });

  it("dims an unselected incorrect option on reveal", () => {
    renderCard({ revealed: true, revealState: "dimmed" });
    const label = screen.getByText("Carbon").closest("label")!;
    expect(label.className).toContain("opacity-60");
  });
});
