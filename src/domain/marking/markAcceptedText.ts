import { normaliseShortText } from "./normalise";

import type { MarkResult } from "./markResult";

/**
 * Marks a raw text answer against a set of accepted answers using case-insensitive
 * normalised comparison. Shared by question types whose marking relies solely on
 * matching against an `accepted` string array (e.g., short-text and fill-in-the-blank).
 *
 * @param rawInput - The raw user input.
 * @param accepted - The list of accepted answers.
 * @returns A {@link MarkResult} with status "correct" or "incorrect".
 */
export function markAcceptedText(
  rawInput: string,
  accepted: string[],
): MarkResult {
  const input = normaliseShortText(rawInput);
  if (input === "") {
    return { status: "incorrect" };
  }
  const normalisedAccepted = accepted.map((value) => normaliseShortText(value));
  return normalisedAccepted.includes(input)
    ? { status: "correct" }
    : { status: "incorrect" };
}
