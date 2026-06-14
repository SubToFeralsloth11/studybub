/**
 * The answer-marking dispatcher.
 *
 * Selects the right marking function by question type so the lesson and
 * challenge views never branch on question type themselves. Short-text
 * questions are dispatched to AI marking when config is provided; all other
 * types remain synchronous.
 *
 * @module domain/marking/markAnswer
 *
 * @author John Grimes
 */

import { markExpression } from "./markExpression";
import { markFillInTheBlank } from "./markFillInTheBlank";
import { markMatching } from "./markMatching";
import { markMcq } from "./markMcq";
import { markNumeric } from "./markNumeric";
import { markShortTextAi } from "./markShortTextAi";

import type { MarkResult } from "./markResult";
import type { Question } from "../content/types";
import type { AiConfig } from "../persistence/aiConfig";

/** Options passed through to the marking function. */
export interface MarkAnswerOptions {
  /** The AI provider config for short-text questions. */
  aiConfig?: AiConfig;
  /** Injected fetch for testing (defaults to globalThis.fetch). */
  fetch?: typeof globalThis.fetch;
  /** Optional AbortSignal for request cancellation. */
  signal?: AbortSignal;
}

/**
 * Marks an answer against its question, dispatching by question type.
 *
 * @param question - The question being answered.
 * @param input - The learner's answer: an option id for MCQ, a JSON mapping for
 *   matching, or raw text for other question types.
 * @param options - Optional config (AI config for short-text, injected fetch).
 * @returns A promise resolving to the {@link MarkResult} for the answer.
 */
export async function markAnswer(
  question: Question,
  input: string,
  options?: MarkAnswerOptions,
): Promise<MarkResult> {
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
      return markShortTextAi(
        question,
        input,
        options?.aiConfig,
        options?.fetch ??
          (globalThis.fetch?.bind(globalThis) as typeof globalThis.fetch),
        options?.signal,
      );
    }
    case "fillInTheBlank": {
      return markFillInTheBlank(question, input);
    }
    case "matching": {
      return markMatching(question, input);
    }
  }
}
