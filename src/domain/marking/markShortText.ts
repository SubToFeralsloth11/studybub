import { markAcceptedText } from "./markAcceptedText";

import type { MarkResult } from "./markResult";
import type { ShortTextQuestion } from "../content/types";

/**
 * Marks a short-text answer by comparing the normalised input against
 * the accepted answers.
 *
 * @param question - The short-text question.
 * @param rawInput - The raw user input.
 * @returns A {@link MarkResult} with status "correct" or "incorrect".
 */
export function markShortText(
  question: ShortTextQuestion,
  rawInput: string,
): MarkResult {
  return markAcceptedText(rawInput, question.accepted);
}
