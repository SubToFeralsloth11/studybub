/**
 * Science subject definition.
 *
 * Covers Year 8 science topics including biology (cells) and earth science
 * (rocks and the rock cycle). Content is based on the 2026 Year 8 Science
 * Stile units at The Gap State High School.
 *
 * @author John Grimes
 * @module content/subjects/science
 */

import type { Subject } from "../../domain/content/types";

/** The Science subject. */
export const scienceSubject: Subject = {
  id: "science",
  title: "Science",
  description: "Cells, microscopes, rocks, and the Earth",
  icon: "🔬",
  accent: "#0EA5E9",
};
