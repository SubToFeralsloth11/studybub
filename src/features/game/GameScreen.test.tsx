import { act, fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GameScreen } from "./GameScreen";
import { clearMockProgress } from "../../test/mocks";
import { renderApp } from "../../test/renderApp";

describe("GameScreen", () => {
  beforeEach(() => {
    clearMockProgress();
    vi.useFakeTimers();
  });

  it("renders the intro with a Play control and a way back to the map", async () => {
    await renderApp(<GameScreen />, {
      route: "/game/algebra",
      path: "/game/$trackId",
    });

    expect(
      screen.getByRole("heading", { name: "Arcade mode" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Play Eaglercraft/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Back to map/i }),
    ).toBeInTheDocument();
  });

  it("embeds Eaglercraft and surfaces a practice question on demand", async () => {
    await renderApp(<GameScreen />, {
      route: "/game/algebra",
      path: "/game/$trackId",
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Play Eaglercraft/ }));
    });

    expect(screen.getByTitle("Eaglercraft")).toHaveAttribute(
      "src",
      "/eaglercraft/",
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Practise now/i }));
    });

    expect(
      screen.getByRole("dialog", { name: "Practice question" }),
    ).toBeInTheDocument();
  });
});
