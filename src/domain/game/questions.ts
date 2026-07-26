/**
 * Builds the question pool for a game from a track's existing validated content.
 *
 * The game is a presentation layer over authored questions: it never invents its
 * own. Questions are gathered from every lesson's practice and mastery sets and
 * from the track's boss challenge, then de-duplicated by id so a question that
 * appears in both practice and mastery is only asked once per run.
 *
 * @module domain/game/questions
 */

import type { Question, Track } from "../content/types";

/**
 * Collects the questions available to a game for the given track.
 *
 * @param track - The track to draw questions from.
 * @returns A de-duplicated, ordered list of questions.
 */
export function gameQuestions(track: Track): Question[] {
  const pool: Question[] = [];
  const seen = new Set<string>();

  const add = (question: Question): void => {
    if (seen.has(question.id)) return;
    seen.add(question.id);
    pool.push(question);
  };

  for (const lesson of track.lessons) {
    for (const question of lesson.practice) add(question);
    for (const question of lesson.mastery) add(question);
  }
  for (const question of track.challenge.questions) add(question);

  return pool;
}
