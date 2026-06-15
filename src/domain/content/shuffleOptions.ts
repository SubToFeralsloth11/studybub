/**
 * Fisher-Yates shuffle, MCQ option randomisation, and matching-pair shuffling.
 *
 * @module domain/content/shuffleOptions
 */

import type { MatchingPair, McqQuestion } from "./types";

/**
 * Performs an in-place Fisher-Yates shuffle on an array.
 *
 * The algorithm iterates from the last element to the first, swapping each
 * element with a randomly-selected element at or before its current position.
 * This produces a uniform random permutation.
 *
 * @param array - The array to shuffle (modified in place).
 * @param random - A function returning a random number in [0, 1). Defaults to
 *   `Math.random`. Injectable for deterministic testing.
 * @returns The same array (for chaining).
 */
export function fisherYatesShuffle<T>(
  array: T[],
  random: () => number = Math.random,
): T[] {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = array[i];
    array[i] = array[j];
    array[j] = tmp;
  }
  return array;
}

/**
 * Produces a copy of an MCQ question with its options shuffled.
 *
 * The correct option id is preserved, so marking still works regardless of the
 * new display order. The original question is not mutated.
 *
 * @param question - The original MCQ question.
 * @param random - Optional random function for deterministic testing.
 * @returns A new MCQ question with options in random order.
 */
export function shuffleMcqOptions(
  question: McqQuestion,
  random?: () => number,
): McqQuestion {
  return {
    ...question,
    options: fisherYatesShuffle([...question.options], random),
  };
}

/**
 * Produces a shuffled copy of a matching-pair array for right-column display.
 *
 * The right-side content stays with its original pair id so that clicking an
 * item by its visible text still produces the correct connection. Only the
 * display order is randomised; the left-side content and pair ids are
 * preserved unchanged. The original array is not mutated.
 *
 * @param pairs - The original array of matching pairs.
 * @param random - Optional random function for deterministic testing.
 * @returns A new array of matching pairs in random display order.
 * @example
 * ```ts
 * const pairs = [
 *   { id: "a", left: ..., right: [{ kind: "text", text: "X" }] },
 *   { id: "b", left: ..., right: [{ kind: "text", text: "Y" }] },
 * ];
 * const shuffled = shuffleMatchingPairs(pairs);
 * // shuffled has same left/right per pair, but the array order is randomised.
 * ```
 */
export function shuffleMatchingPairs(
  pairs: MatchingPair[],
  random?: () => number,
): MatchingPair[] {
  // Shuffle a copy so the right column is displayed in random order, but each
  // right item retains its original pair id (connections[leftId] === leftId
  // must still work for correct marking).
  return fisherYatesShuffle([...pairs], random);
}
