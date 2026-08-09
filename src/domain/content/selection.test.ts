import { describe, expect, it } from "vitest";

import { toggleOptionId } from "./selection";

describe("toggleOptionId", () => {
  it("adds an id that is not yet selected", () => {
    expect(toggleOptionId(["b"], "a")).toEqual(["b", "a"]);
  });

  it("removes a selected id without clearing the others", () => {
    expect(toggleOptionId(["a", "b", "c"], "b")).toEqual(["a", "c"]);
  });

  it("adds to an empty selection", () => {
    expect(toggleOptionId([], "a")).toEqual(["a"]);
  });

  it("removes the last selected id", () => {
    expect(toggleOptionId(["a"], "a")).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const selected = ["a", "b"];
    toggleOptionId(selected, "a");
    expect(selected).toEqual(["a", "b"]);
    toggleOptionId(selected, "c");
    expect(selected).toEqual(["a", "b"]);
  });
});
