import { act, fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GameScreen } from "./GameScreen";
import { clearMockProgress } from "../../test/mocks";
import { renderApp } from "../../test/renderApp";

describe("GameScreen", () => {
  beforeEach(() => {
    clearMockProgress();
    // The countdown uses setInterval; jsdom provides it but we keep tests
    // deterministic by controlling timers.
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
      screen.getByRole("button", { name: /Play PokéRogue/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Back to map/i }),
    ).toBeInTheDocument();
  });

  it("embeds the real game and surfaces a practice question on demand", async () => {
    await renderApp(<GameScreen />, {
      route: "/game/algebra",
      path: "/game/$trackId",
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Play PokéRogue/ }));
    });

    // The real PokéRogue is embedded in an iframe.
    expect(screen.getByTitle("PokéRogue")).toHaveAttribute(
      "src",
      "https://pokerogue.net",
    );

    // The learner can opt into a practice break immediately.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Practise now/i }));
    });

    expect(
      screen.getByRole("dialog", { name: "Practice question" }),
    ).toBeInTheDocument();
  });
});
