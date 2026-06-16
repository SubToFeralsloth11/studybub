import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { MathSymbolButtons } from "./MathSymbolButtons";

describe("MathSymbolButtons", () => {
  it("renders four symbol buttons", () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <MathSymbolButtons
        inputRef={ref}
        value=""
        onChange={() => {}}
        disabled={false}
      />,
    );
    const group = screen.getByRole("group", { name: /math symbols/i });
    expect(group).toBeInTheDocument();
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(4);
  });

  it("disables all buttons when disabled is true", () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <MathSymbolButtons
        inputRef={ref}
        value=""
        onChange={() => {}}
        disabled
      />,
    );
    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
  });

  it("calls onChange with inserted symbol on click", async () => {
    const onChange = vi.fn();
    const input = document.createElement("input");
    input.value = "2";
    // Position cursor at the end.
    input.setSelectionRange(1, 1);
    const ref = { current: input };

    const user = userEvent.setup();
    render(
      <MathSymbolButtons
        inputRef={ref}
        value="2"
        onChange={onChange}
        disabled={false}
      />,
    );

    // Click the plus button.
    await user.click(
      screen.getByRole("button", { name: /insert plus symbol/i }),
    );

    // onChange should be called with "2+" - the symbol inserted at cursor.
    expect(onChange).toHaveBeenCalled();
    const callArg = onChange.mock.calls[0]?.[0];
    expect(callArg).toContain("+");
  });

  it("renders each symbol with its correct label", () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <MathSymbolButtons
        inputRef={ref}
        value=""
        onChange={() => {}}
        disabled={false}
      />,
    );
    expect(
      screen.getByRole("button", { name: /insert divide symbol/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /insert multiply symbol/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /insert plus symbol/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /insert minus symbol/i }),
    ).toBeInTheDocument();
  });

  it("handles missing input ref gracefully", async () => {
    const onChange = vi.fn();
    const ref = { current: null };

    const user = userEvent.setup();
    render(
      <MathSymbolButtons
        inputRef={ref}
        value=""
        onChange={onChange}
        disabled={false}
      />,
    );

    // Click a button when ref is null - should not throw and not call onChange.
    await user.click(
      screen.getByRole("button", { name: /insert plus symbol/i }),
    );
    expect(onChange).not.toHaveBeenCalled();
  });
});
