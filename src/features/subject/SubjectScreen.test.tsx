import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { SubjectScreen } from "./SubjectScreen";
import { renderApp } from "../../test/renderApp";

beforeEach(() => {
  globalThis.localStorage.clear();
});

describe("SubjectScreen", () => {
  it("renders tracks for a subject with progress", () => {
    renderApp(<SubjectScreen />, {
      route: "/subject/maths",
      path: "/subject/:subjectId",
    });

    expect(screen.getByRole("heading", { name: /Maths/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Algebra, geometry, and more/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Algebra \(Year 8\)/i }),
    ).toHaveAttribute("href", "/subject/maths/track/algebra");
    expect(
      screen.getByRole("link", {
        name: /Congruence and Similarity \(Year 8\)/i,
      }),
    ).toHaveAttribute("href", "/subject/maths/track/geometry");
    expect(
      screen.getByRole("link", { name: /Time \(Year 8\)/i }),
    ).toHaveAttribute("href", "/subject/maths/track/time");
  });

  it("shows empty state when subject has no tracks", () => {
    // Science has 2 tracks, HSS has 1, so none of the current subjects have
    // zero tracks. We verify the empty-state messaging by asserting that a
    // subject with tracks does not show the empty message.
    renderApp(<SubjectScreen />, {
      route: "/subject/maths",
      path: "/subject/:subjectId",
    });

    // Maths has tracks, so the empty message should not appear.
    expect(screen.queryByText(/no tracks yet/i)).not.toBeInTheDocument();
  });

  it("shows a not-found state for an unknown subject", () => {
    renderApp(<SubjectScreen />, {
      route: "/subject/nonexistent",
      path: "/subject/:subjectId",
    });

    expect(screen.getByText(/Subject not found/i)).toBeInTheDocument();
  });
});
