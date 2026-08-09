/**
 * Marking for "select all that apply" questions.
 *
 * @module domain/marking/markMultiSelect
 */

import type { MarkResult } from "./markResult";
import type { MultiSelectQuestion } from "../content/types";

/**
 * Marks a multiselect answer by comparing the selected option-id set to the
 * correct option-id set. The answer is correct iff the two sets are exactly
 * equal; selection order and duplicates do not matter.
 *
 * @param question - The multiselect question being answered.
 * @param selectedOptionIds - The ids of the options the learner selected.
 * @returns `correct` when the selected set exactly equals the correct set,
 *   else `incorrect`.
 */
export function markMultiSelect(
  question: MultiSelectQuestion,
  selectedOptionIds: string[],
): MarkResult {
  const selected = new Set(selectedOptionIds);
  const correct = new Set(question.correctOptionIds);
  const exactSet =
    selected.size === correct.size &&
    [...selected].every((id) => correct.has(id));
  return exactSet ? { status: "correct" } : { status: "incorrect" };
}
