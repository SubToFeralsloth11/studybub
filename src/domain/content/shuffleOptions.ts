/**
 * Fisher-Yates shuffle and MCQ option randomisation.
 *
 * @module domain/content/shuffleOptions
 */

import type { McqQuestion } from "./types";

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
