import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NumericInput } from "./NumericInput";

describe("NumericInput", () => {
  it("renders the input with label and placeholder", () => {
    render(
      <NumericInput
        value=""
        onChange={() => {}}
        onSubmit={() => {}}
        revealed={false}
      />,
    );
    expect(
      screen.getByRole("textbox", { name: /your answer/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/type your answer/i),
    ).toBeInTheDocument();
  });

  it("displays the current value in the input", () => {
    render(
      <NumericInput
        value="42"
        onChange={() => {}}
        onSubmit={() => {}}
        revealed={false}
      />,
    );
    expect(screen.getByRole("textbox")).toHaveValue("42");
  });

  it("calls onChange when the value is edited", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <NumericInput
        value=""
        onChange={onChange}
        onSubmit={() => {}}
        revealed={false}
      />,
    );
    await user.type(screen.getByRole("textbox"), "5");
    expect(onChange).toHaveBeenCalled();
  });

  it("calls onSubmit on Enter key", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <NumericInput
        value="99"
        onChange={() => {}}
        onSubmit={onSubmit}
        revealed={false}
      />,
    );
    await user.click(screen.getByRole("textbox"));
    await user.keyboard("{Enter}");
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("disables the input when revealed is true", () => {
    render(
      <NumericInput
        value="42"
        onChange={() => {}}
        onSubmit={() => {}}
        revealed
      />,
    );
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("shows the unit suffix when provided", () => {
    render(
      <NumericInput
        value="10"
        onChange={() => {}}
        onSubmit={() => {}}
        revealed={false}
        unit="cm"
      />,
    );
    expect(screen.getByText("cm")).toBeInTheDocument();
  });

  it("does not show a unit suffix when not provided", () => {
    const { container } = render(
      <NumericInput
        value="10"
        onChange={() => {}}
        onSubmit={() => {}}
        revealed={false}
      />,
    );
    // The unit span should not be present.
    expect(container.querySelector(".font-display.text-muted")).toBeNull();
  });

  it("renders math symbol buttons", () => {
    render(
      <NumericInput
        value=""
        onChange={() => {}}
        onSubmit={() => {}}
        revealed={false}
      />,
    );
    // The math symbol buttons should be present.
    expect(
      screen.getByRole("button", { name: /insert plus symbol/i }),
    ).toBeInTheDocument();
  });
});
