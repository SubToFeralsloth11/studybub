/**
 * Sample Science track proving the authoring contract for non-maths content.
 *
 * One lesson using shortText, fillInTheBlank, and matching question types.
 *
 * @module content/tracks/science-demo
 */

import { m, t } from "../blocks";

import type { Lesson, Track } from "../../domain/content/types";

const cellsLesson: Lesson = {
  id: "sci-cells",
  order: 1,
  title: "Cells (Year 8)",
  sourceRef: "Science Year 8 Chapter 1",
  learnCards: [
    {
      id: "cells-key-idea",
      heading: "Key idea: the cell",
      body: [
        t("All living things are made of cells. The cell is the basic unit of life."),
        t("Plant cells have a cell wall and chloroplasts; animal cells do not."),
      ],
    },
  ],
  practice: [
    {
      id: "cells-p1",
      type: "shortText",
      prompt: [t("What is the basic unit of life?")],
      explanation: [t("The cell is the simplest unit that can be considered alive.")],
      xp: 10,
      accepted: ["cell", "cells", "the cell"],
    },
    {
      id: "cells-p2",
      type: "fillInTheBlank",
      prompt: [t("Complete the famous biology phrase.")],
      explanation: [
        t("Mitochondria generate most of the cell's energy through respiration."),
      ],
      xp: 15,
      template: [
        t("The ___ is the powerhouse of the cell."),
      ],
      accepted: ["mitochondria", "mitochondrion"],
    },
    {
      id: "cells-p3",
      type: "matching",
      prompt: [t("Match each organelle to its function.")],
      explanation: [
        t("Mitochondria produce energy. The nucleus stores DNA. Chloroplasts perform photosynthesis."),
      ],
      xp: 20,
      pairs: [
        {
          id: "mitochondria",
          left: [m(String.raw`\text{Mitochondria}`)],
          right: [t("Produces energy")],
        },
        {
          id: "nucleus",
          left: [m(String.raw`\text{Nucleus}`)],
          right: [t("Stores DNA")],
        },
        {
          id: "chloroplast",
          left: [m(String.raw`\text{Chloroplast}`)],
          right: [t("Photosynthesis")],
        },
      ],
    },
  ],
  mastery: [
    {
      id: "cells-m1",
      type: "shortText",
      prompt: [t("Which organelle is responsible for photosynthesis?")],
      explanation: [t("Chloroplasts capture light energy for photosynthesis.")],
      xp: 10,
      accepted: ["chloroplast", "chloroplasts"],
    },
    {
      id: "cells-m2",
      type: "fillInTheBlank",
      prompt: [t("Complete the sentence.")],
      explanation: [
        t("The nucleus contains DNA and controls the cell's activities."),
      ],
      xp: 15,
      template: [t("The ___ controls the cell's activities.")],
      accepted: ["nucleus"],
    },
  ],
};

export const scienceDemoTrack: Track = {
  id: "science-demo",
  subjectId: "science",
  title: "Cells (Year 8)",
  description: "Introduction to cells and organelles.",
  lessons: [cellsLesson],
  challenge: {
    id: "science-demo-boss",
    title: "Boss challenge: Cells review",
    sourceRef: "Science Year 8 Chapter 1 review",
    questions: [
      {
        id: "sci-boss-1",
        type: "shortText",
        prompt: [t("What is the control centre of the cell?")],
        explanation: [t("The nucleus controls the cell's activities.")],
        xp: 20,
        accepted: ["nucleus"],
      },
      {
        id: "sci-boss-2",
        type: "matching",
        prompt: [t("Match each structure to its role.")],
        explanation: [
          t("Cell wall provides structure. Cell membrane controls what enters. Cytoplasm is where reactions happen."),
        ],
        xp: 30,
        pairs: [
          {
            id: "wall",
            left: [t("Cell wall")],
            right: [t("Provides structure")],
          },
          {
            id: "membrane",
            left: [t("Cell membrane")],
            right: [t("Controls entry/exit")],
          },
        ],
      },
    ],
    bonusXp: 50,
    passBadgeId: "first-steps",
  },
};
