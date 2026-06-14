import { describe, expect, it } from "vitest";

import { richBlocksToPlainText } from "./richBlocksToPlainText";

describe("richBlocksToPlainText", () => {
  it("extracts text from text blocks", () => {
    expect(
      richBlocksToPlainText([
        { kind: "text", text: "Hello" },
        { kind: "text", text: "world" },
      ]),
    ).toBe("Hello world");
  });

  it("extracts fallback from math blocks", () => {
    expect(
      richBlocksToPlainText([
        { kind: "math", tex: "x^2", fallback: "x squared" },
        { kind: "math", tex: "y^3", fallback: "y cubed" },
      ]),
    ).toBe("x squared y cubed");
  });

  it("returns empty string for empty array", () => {
    expect(richBlocksToPlainText([])).toBe("");
  });

  it("collapses whitespace from multiple spaces in text", () => {
    // The function joins with a single space; consecutive text blocks
    // already produce single-space separations naturally.
    expect(
      richBlocksToPlainText([
        { kind: "text", text: "a" },
        { kind: "text", text: "b" },
        { kind: "text", text: "c" },
      ]),
    ).toBe("a b c");
  });

  it("handles mixed text and math blocks", () => {
    expect(
      richBlocksToPlainText([
        { kind: "text", text: "The value is" },
        { kind: "math", tex: String.raw`\pi`, fallback: "pi" },
        { kind: "text", text: "approximately" },
      ]),
    ).toBe("The value is pi approximately");
  });

  it("uses tex as fallback when math block has no fallback", () => {
    // According to the spec: use tex when fallback is missing.
    // (Though in practice, all math blocks should have a fallback.)
    expect(
      richBlocksToPlainText([{ kind: "math", tex: "x^2", fallback: "" }]),
    ).toBe("x^2");
  });

  it("handles a single text block", () => {
    expect(richBlocksToPlainText([{ kind: "text", text: "Hello" }])).toBe(
      "Hello",
    );
  });

  it("handles a single math block", () => {
    expect(
      richBlocksToPlainText([
        { kind: "math", tex: String.raw`\alpha`, fallback: "alpha" },
      ]),
    ).toBe("alpha");
  });

  it("skips blocks with empty text and empty fallback", () => {
    // Empty content should not leave stray spaces.
    expect(
      richBlocksToPlainText([
        { kind: "text", text: "" },
        { kind: "math", tex: "", fallback: "" },
        { kind: "text", text: "only" },
      ]),
    ).toBe("only");
  });
});
