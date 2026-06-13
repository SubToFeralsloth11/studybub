/**
 * The answer-marking dispatcher.
 *
 * Selects the right marking function by question type so the lesson and
 * challenge views never branch on question type themselves.
 *
 * @module domain/marking/markAnswer
 */

import { markExpression } from "./markExpression";
import { markFillInTheBlank } from "./markFillInTheBlank";
import { markMatching } from "./markMatching";
import { markMcq } from "./markMcq";
import { markNumeric } from "./markNumeric";
import { markShortText } from "./markShortText";

import type { MarkResult } from "./markResult";
import type { Question } from "../content/types";

/**
 * Marks an answer against its question, dispatching by question type.
 *
 * @param question - The question being answered.
 * @param input - The learner's answer: an option id for MCQ, a JSON mapping for
 *   matching, or raw text for other question types.
 * @returns The {@link MarkResult} for the answer.
 */
export function markAnswer(question: Question, input: string): MarkResult {
  switch (question.type) {
    case "mcq": {
      return markMcq(question, input);
    }
    case "numeric": {
      return markNumeric(question, input);
    }
    case "expression": {
      return markExpression(question, input);
    }
    case "shortText": {
      return markShortText(question, input);
    }
    case "fillInTheBlank": {
      return markFillInTheBlank(question, input);
    }
    case "matching": {
      return markMatching(question, input);
    }
  }
}
