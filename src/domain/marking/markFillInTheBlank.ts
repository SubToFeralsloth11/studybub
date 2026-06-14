import { markAcceptedText } from "./markAcceptedText";

import type { MarkResult } from "./markResult";
import type { FillInTheBlankQuestion } from "../content/types";

/**
 * Marks a fill-in-the-blank answer by comparing the normalised input against
 * the accepted answers.
 *
 * @param question - The fill-in-the-blank question.
 * @param rawInput - The raw user input.
 * @returns A {@link MarkResult} with status "correct" or "incorrect".
 */
export function markFillInTheBlank(
  question: FillInTheBlankQuestion,
  rawInput: string,
): MarkResult {
  return markAcceptedText(rawInput, question.accepted);
}
