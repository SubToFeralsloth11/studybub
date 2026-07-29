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

  it("renders the intro with game selection and a way back to the map", async () => {
    await renderApp(<GameScreen />, {
      route: "/game/algebra",
      path: "/game/$trackId",
    });

    expect(
      screen.getByRole("heading", { name: "Arcade mode" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Start session/ }),
    ).toBeDisabled();
    expect(
      screen.getByRole("link", { name: /Back to map/i }),
    ).toBeInTheDocument();
  });

  it("selects a game and starts a session, then surfaces a practice question on demand", async () => {
    await renderApp(<GameScreen />, {
      route: "/game/algebra",
      path: "/game/$trackId",
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Rigs of Rods/ }));
    });

    const startButton = screen.getByRole("button", { name: /Start session/ });
    expect(startButton).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(startButton);
    });

    expect(screen.getByText(/Launch Rigs of Rods/)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Practise now/i }));
    });

    expect(
      screen.getByRole("dialog", { name: "Practice question" }),
    ).toBeInTheDocument();
  });
});
