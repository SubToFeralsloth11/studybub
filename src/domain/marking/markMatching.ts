import type { MarkResult } from "./markResult";
import type { MatchingQuestion } from "../content/types";

/**
 *
 */
export function markMatching(
  question: MatchingQuestion,
  rawInput: string,
): MarkResult {
  let mapping: Record<string, string>;
  try {
    mapping = JSON.parse(rawInput);
  } catch {
    return { status: "unreadable" };
  }
  if (typeof mapping !== "object" || mapping === null) {
    return { status: "unreadable" };
  }

  for (const pair of question.pairs) {
    if (mapping[pair.id] !== pair.id) {
      return { status: "incorrect" };
    }
  }

  // All pairs must be mapped.
  if (Object.keys(mapping).length !== question.pairs.length) {
    return { status: "incorrect" };
  }

  return { status: "correct" };
}
