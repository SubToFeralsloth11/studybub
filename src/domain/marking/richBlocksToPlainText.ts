/**
 * Converts an array of RichBlocks to a single plain-text string for use in AI prompts.
 *
 * @module domain/marking/richBlocksToPlainText
 *
 * @author John Grimes
 */

import type { RichBlock } from "../content/types";

/**
 * Flattens an array of rich content blocks into a single space-joined string.
 * Text blocks contribute their `.text` field; math blocks contribute their
 * `.fallback` field (falling back to `.tex` when the fallback is empty).
 *
 * @param blocks - The rich content blocks to convert.
 * @returns A plain-text string suitable for AI prompts and other plain-text contexts.
 * @example
 * richBlocksToPlainText([{ kind: "text", text: "Hello" }, { kind: "math", tex: "\\pi", fallback: "pi" }]);
 * // → "Hello pi"
 */
export function richBlocksToPlainText(blocks: RichBlock[]): string {
  return blocks
    .map((block) => {
      if (block.kind === "text") {
        return block.text;
      }
      // Math block: use fallback, falling back to tex when fallback is empty.
      return block.fallback === "" ? block.tex : block.fallback;
    })
    .filter((text) => text !== "")
    .join(" ");
}
