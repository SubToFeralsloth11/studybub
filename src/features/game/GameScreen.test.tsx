import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GameScreen } from "./GameScreen";
import { clearMockProgress } from "../../test/mocks";
import { renderApp } from "../../test/renderApp";

/** A no-op 2D context so the renderer runs under jsdom without a real canvas. */
function stubContext(): CanvasRenderingContext2D {
  return {
    clearRect: () => {},
    fillRect: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    beginPath: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    set fillStyle(_v: unknown) {},
    set strokeStyle(_v: unknown) {},
    set lineWidth(_v: unknown) {},
  } as unknown as CanvasRenderingContext2D;
}

describe("GameScreen", () => {
  beforeEach(() => {
    clearMockProgress();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      stubContext(),
    );
    // Prevent the rAF simulation loop from spinning inside jsdom.
    vi.stubGlobal("requestAnimationFrame", () => 0);
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });

  it("renders the intro with a Start control and a way back to the map", async () => {
    await renderApp(<GameScreen />, {
      route: "/game/algebra",
      path: "/game/$trackId",
    });

    expect(
      screen.getByRole("heading", { name: "Bub Quest" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Start/ })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Back to map/i }),
    ).toBeInTheDocument();
  });

  it("shows the play field after starting", async () => {
    await renderApp(<GameScreen />, {
      route: "/game/algebra",
      path: "/game/$trackId",
    });

    fireEvent.click(screen.getByRole("button", { name: /Start/ }));

    expect(
      screen.getByRole("img", { name: /play field/i }),
    ).toBeInTheDocument();
  });
});
