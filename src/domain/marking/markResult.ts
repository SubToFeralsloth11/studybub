/**
 * The result of marking a single answer.
 *
 * @module domain/marking/markResult
 */

/** The outcome of marking an answer (see contracts/markingApi.md). */
export type MarkResult =
  | { status: "correct"; feedback?: string }
  | { status: "incorrect"; feedback?: string }
  | { status: "unreadable" }
  | { status: "aiNotConfigured"; message: string }
  | { status: "aiError"; message: string };
