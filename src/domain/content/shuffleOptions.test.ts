/**
 * Tests for MCQ option shuffling.
 *
 * @module domain/content/shuffleOptions.test
 */

import { describe, expect, it } from "vitest";

import { fisherYatesShuffle, shuffleMcqOptions } from "./shuffleOptions";

import type { McqQuestion } from "./types";

/** A deterministic "random" that cycles through a fixed sequence. */
function sequenceRandom(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length];
    i += 1;
    return v;
  };
}

describe("fisherYatesShuffle", () => {
  it("returns an array of the same length", () => {
    const arr = [1, 2, 3, 4, 5];
    const result = fisherYatesShuffle([...arr]);
    expect(result).toHaveLength(5);
  });

  it("contains all the same elements", () => {
    const arr = [1, 2, 3, 4, 5];
    const result = fisherYatesShuffle([...arr]);
    expect(result.toSorted()).toEqual([1, 2, 3, 4, 5]);
  });

  it("mutates the array in place", () => {
    const arr = [1, 2, 3];
    const result = fisherYatesShuffle(arr);
    expect(result).toBe(arr);
  });

  it("produces expected order with deterministic random", () => {
    // With random always returning 0, every swap targets index 0.
    // Trace: i=3 j=0 swap 4↔1 -> [4,2,3,1]; i=2 j=0 swap 3↔4 -> [3,2,4,1]; i=1 j=0 swap 2↔3 -> [2,3,4,1].
    const arr = [1, 2, 3, 4];
    const result = fisherYatesShuffle([...arr], () => 0);
    expect(result).toEqual([2, 3, 4, 1]);
  });

  it("produces expected order with sequence random", () => {
    const arr = ["a", "b", "c", "d"];
    // Sequence: 0.1, 0.5, 0.9 will select different swap targets.
    const result = fisherYatesShuffle(
      [...arr],
      sequenceRandom([0.1, 0.5, 0.9]),
    );
    // With these values:
    // i=3, random=0.1 -> j=floor(0.1 * 4)=0, swap d<->a -> [d, b, c, a]
    // i=2, random=0.5 -> j=floor(0.5 * 3)=1, swap c<->b -> [d, c, b, a]
    // i=1, random=0.9 -> j=floor(0.9 * 2)=1, swap b<->b -> [d, c, b, a]
    expect(result).toEqual(["d", "c", "b", "a"]);
  });
});

describe("shuffleMcqOptions", () => {
  function makeMcq(options: string[]): McqQuestion {
    return {
      id: "q1",
      type: "mcq",
      prompt: [{ kind: "text", text: "What is 2+2?" }],
      options: options.map((id) => ({
        id,
        label: [{ kind: "text", text: `Option ${id}` }],
      })),
      correctOptionId: options[0],
      explanation: [{ kind: "text", text: "Because maths." }],
      xp: 10,
    };
  }

  it("does not mutate the original question", () => {
    const q = makeMcq(["a", "b", "c"]);
    const originalOptions = q.options;
    shuffleMcqOptions(q, () => 0);
    expect(q.options).toBe(originalOptions);
    expect(q.options[0].id).toBe("a");
  });

  it("preserves the correct option id after shuffling", () => {
    const q = makeMcq(["a", "b", "c"]);
    // With random always 0, the shuffle reverses the options array.
    const shuffled = shuffleMcqOptions(q, () => 0);
    expect(shuffled.correctOptionId).toBe("a");
    // The option with id "a" is now at the end (index 2).
    expect(shuffled.options[2].id).toBe("a");
  });

  it("returns options in a different order with random", () => {
    const q = makeMcq(["a", "b", "c", "d", "e"]);
    const shuffled = shuffleMcqOptions(q);
    // Extremely unlikely to match original order with 5 options (1/120).
    const originalIds = q.options.map((o) => o.id).join(",");
    const shuffledIds = shuffled.options.map((o) => o.id).join(",");
    expect(originalIds).not.toBe(shuffledIds);
  });

  it("returns all the same option ids", () => {
    const q = makeMcq(["a", "b", "c"]);
    const shuffled = shuffleMcqOptions(q);
    const ids = shuffled.options.map((o) => o.id).toSorted();
    expect(ids).toEqual(["a", "b", "c"]);
  });
});
