/**
 * Year 8 Biology: Cells track content.
 *
 * Covers cell theory, microscopes, cell structure and function, and the sizes
 * of cells. Based on the 2026 8 Science - Biology Stile unit at The Gap State
 * High School.
 *
 * @author John Grimes
 * @module content/tracks/biology
 */

import { t, m } from "../blocks";

import type {
  Lesson,
  Track,
  Question,
  Figure,
} from "../../domain/content/types";

// ---------------------------------------------------------------------------
// Figures
// ---------------------------------------------------------------------------

const figAnimalCell: Figure = {
  id: "animal-cell-diagram",
  alt: "Diagram of a typical animal cell showing the nucleus, cell membrane, mitochondria, ribosomes, endoplasmic reticulum, Golgi apparatus, and cytosol.",
  textFallback:
    "[Diagram: Animal cell with nucleus, cell membrane, mitochondria, ribosomes, endoplasmic reticulum, Golgi apparatus, and cytosol]",
};

const figPlantCell: Figure = {
  id: "plant-cell-diagram",
  alt: "Diagram of a typical plant cell showing the cell wall, cell membrane, nucleus, chloroplasts, large vacuole, mitochondria, and cytosol.",
  textFallback:
    "[Diagram: Plant cell with cell wall, cell membrane, nucleus, chloroplasts, large vacuole, mitochondria, and cytosol]",
};

const figMicroscope: Figure = {
  id: "compound-microscope",
  alt: "Diagram of a compound light microscope showing the eyepiece, objective lenses, stage, diaphragm, light source, coarse focus knob, and fine focus knob.",
  textFallback:
    "[Diagram: Compound light microscope with eyepiece, objective lenses, stage, diaphragm, light source, coarse focus, and fine focus]",
};

const figCellSizeScale: Figure = {
  id: "cell-size-scale",
  alt: "Scale diagram comparing the sizes of a grain of rice, amoeba, human egg, skin cell, red blood cell, E. coli bacterium, and virus.",
  textFallback:
    "[Diagram: Scale comparison of cells and small objects from grain of rice down to virus]",
};

export const biologyFigures: Figure[] = [
  figAnimalCell,
  figPlantCell,
  figMicroscope,
  figCellSizeScale,
];

// ---------------------------------------------------------------------------
// Lesson 1 – Cells and cell theory
// ---------------------------------------------------------------------------

const cellTheoryLesson: Lesson = {
  id: "cells-cell-theory",
  order: 1,
  title: "Cells and cell theory",
  sourceRef: "1. Cells & Cell Theory (Stile)",
  aiProvenance: {
    tool: "Claude",
    sources: ["Stile: 1. Cells & Cell Theory"],
    role: "generated",
  },
  learnCards: [
    {
      id: "ct-what",
      heading: "What are cells?",
      body: [
        t(
          "Cells are the smallest units of life. Every living thing is made of one or more cells.",
        ),
        t(
          "Most cells are too small to see with the unaided eye, so we call them microscopic.",
        ),
      ],
    },
    {
      id: "ct-theory",
      heading: "The three parts of cell theory",
      body: [
        t(
          "Cell theory is one of the most important ideas in biology. It took over 200 years to develop as microscopes improved.",
        ),
        t(
          "The modern cell theory has three main parts: all living things are made of cells; cells are the basic units of life; and all cells come from pre-existing cells.",
        ),
      ],
    },
    {
      id: "ct-history",
      heading: "How scientists built cell theory",
      body: [
        t(
          "Robert Hooke named cells after studying cork under a microscope. Anton van Leeuwenhoek observed tiny living things in pond water.",
        ),
        t(
          "In the 1800s, Schleiden and Schwann proposed that all plants and animals are made of cells. Rudolf Virchow added that cells divide to form new cells.",
        ),
      ],
    },
  ],
  practice: [
    {
      id: "ct-p1",
      type: "mcq",
      prompt: [t("Which of the following is made of cells?")],
      explanation: [
        t(
          "A flower is a living thing, so it is made of cells. Sand, glass, and paper are non-living materials.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("A flower")] },
        { id: "b", label: [t("A grain of sand")] },
        { id: "c", label: [t("A glass marble")] },
        { id: "d", label: [t("A sheet of paper")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "ct-p2",
      type: "shortText",
      prompt: [
        t(
          "Is a raw mushroom made of cells? Explain using the word living or non-living.",
        ),
      ],
      explanation: [
        t(
          "A raw mushroom is a living organism, so it is made of living cells.",
        ),
      ],
      xp: 15,
      accepted: ["yes", "living", "organism", "made of cells"],
    },
    {
      id: "ct-p3",
      type: "mcq",
      prompt: [
        t(
          "What is the name of the theory that living things can arise from non-living matter?",
        ),
      ],
      explanation: [
        t(
          "Spontaneous generation was the theory that living things could arise from non-living matter. It was later disproved by experiments.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Spontaneous generation")] },
        { id: "b", label: [t("Cell theory")] },
        { id: "c", label: [t("Evolution")] },
        { id: "d", label: [t("Photosynthesis")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "ct-p4",
      type: "fillInTheBlank",
      prompt: [t("Complete the sentence about scientific theories.")],
      template: [
        t(
          "A scientific theory is an explanation that can be tested by observation or ___.",
        ),
      ],
      explanation: [
        t(
          "Scientific theories are tested through observation and experiment, and can change when new evidence is found.",
        ),
      ],
      xp: 10,
      accepted: ["experiment", "experiments"],
    },
    {
      id: "ct-p5",
      type: "matching",
      prompt: [t("Match each scientist to their contribution to cell theory.")],
      explanation: [
        t(
          "Robert Hooke named cells. Leeuwenhoek observed microscopic life. Schleiden and Schwann proposed all plants and animals are made of cells. Virchow stated cells come from pre-existing cells.",
        ),
      ],
      xp: 15,
      pairs: [
        {
          id: "a",
          left: [t("Robert Hooke")],
          right: [t("Named cells after studying cork")],
        },
        {
          id: "b",
          left: [t("Leeuwenhoek")],
          right: [t("Observed tiny living things in pond water")],
        },
        {
          id: "c",
          left: [t("Schleiden and Schwann")],
          right: [t("Proposed all plants and animals are made of cells")],
        },
        {
          id: "d",
          left: [t("Rudolf Virchow")],
          right: [t("Stated cells come from pre-existing cells")],
        },
      ],
    },
    {
      id: "ct-p6",
      type: "mcq",
      prompt: [
        t(
          "How did the invention of the microscope support the development of cell theory?",
        ),
      ],
      explanation: [
        t(
          "Microscopes allowed scientists to see cells and microorganisms for the first time, providing direct evidence for cell theory.",
        ),
      ],
      xp: 10,
      options: [
        {
          id: "a",
          label: [t("It let scientists observe cells and their structures")],
        },
        { id: "b", label: [t("It proved cells form from non-living matter")] },
        { id: "c", label: [t("It showed all cells are the same size")] },
        { id: "d", label: [t("It replaced the need for experiments")] },
      ],
      correctOptionId: "a",
    },
  ],
  mastery: [
    {
      id: "ct-m1",
      type: "shortText",
      prompt: [
        t(
          "Describe how collaboration and new technologies have helped cell theory develop over time.",
        ),
      ],
      explanation: [
        t(
          "Cell theory developed over more than 200 years as scientists shared observations. Improvements in microscopes revealed smaller structures, while modern communication lets scientists worldwide share data instantly.",
        ),
      ],
      xp: 20,
      accepted: [
        "shared ideas",
        "collaboration",
        "better microscopes",
        "technology",
      ],
    },
    {
      id: "ct-m2",
      type: "mcq",
      prompt: [
        t(
          "A scientist claims to have observed living cells forming from a sterile nutrient solution. What does cell theory predict?",
        ),
      ],
      explanation: [
        t(
          "Cell theory states that all cells come from pre-existing cells. If the solution was truly sterile, living cells should not appear. The likely explanation is contamination.",
        ),
      ],
      xp: 15,
      options: [
        {
          id: "a",
          label: [
            t("It contradicts cell theory; cells must come from other cells"),
          ],
        },
        { id: "b", label: [t("It confirms spontaneous generation")] },
        { id: "c", label: [t("It proves cell theory is wrong")] },
        { id: "d", label: [t("It has no connection to cell theory")] },
      ],
      correctOptionId: "a",
    },
  ],
};

// ---------------------------------------------------------------------------
// Lesson 2 – Microscopes
// ---------------------------------------------------------------------------

const microscopesLesson: Lesson = {
  id: "microscopes",
  order: 2,
  title: "Microscopes",
  sourceRef: "2. Microscopes (Stile)",
  aiProvenance: {
    tool: "Claude",
    sources: ["Stile: 2. Microscopes"],
    role: "generated",
  },
  learnCards: [
    {
      id: "micro-what",
      heading: "What is a microscope?",
      figure: figMicroscope,
      body: [
        t(
          "A microscope uses lenses to make small objects appear larger. The process of making something look bigger is called magnification.",
        ),
        t(
          "Stereo light microscopes view whole objects at low magnification. Compound light microscopes use two sets of lenses and can magnify up to about 1000x. Electron microscopes use beams of electrons and can magnify much more, but they are expensive.",
        ),
      ],
    },
    {
      id: "micro-parts",
      heading: "Key parts of a compound microscope",
      body: [
        t(
          "The eyepiece usually magnifies 10x. Objective lenses commonly magnify 4x, 10x, 40x, or 100x. Total magnification is found by multiplying eyepiece by objective magnification.",
        ),
        t(
          "The stage holds the slide. The light source shines up through it. The diaphragm controls light. Coarse focus moves the stage quickly, while fine focus makes small adjustments.",
        ),
      ],
    },
    {
      id: "micro-field",
      heading: "Magnification and field of view",
      body: [
        t(
          "The field of view is the area visible through the microscope. As magnification increases, the field of view decreases. Higher magnification reveals more detail.",
        ),
        t(
          "To view many cells arranged in a tissue, use a lower magnification such as 40x. To examine details of a single cell, use 100x or 400x.",
        ),
      ],
    },
  ],
  practice: [
    {
      id: "micro-p1",
      type: "mcq",
      prompt: [
        t(
          "What do we call the process of making a small object appear larger?",
        ),
      ],
      explanation: [
        t(
          "Magnification is the process of making an object appear larger than it really is.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Magnification")] },
        { id: "b", label: [t("Resolution")] },
        { id: "c", label: [t("Observation")] },
        { id: "d", label: [t("Illumination")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "micro-p2",
      type: "mcq",
      prompt: [
        t(
          "A microscope has a 10x eyepiece and a 40x objective lens. What is the total magnification?",
        ),
      ],
      explanation: [
        m(
          String.raw`Total magnification = 10 \\times 40 = 400`,
          "10 x 40 = 400",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("400x")] },
        { id: "b", label: [t("50x")] },
        { id: "c", label: [t("4000x")] },
        { id: "d", label: [t("30x")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "micro-p3",
      type: "numeric",
      prompt: [
        t(
          "Calculate the total magnification produced by a 10x eyepiece and a 100x objective lens.",
        ),
      ],
      explanation: [m(String.raw`10 \\times 100 = 1000`, "10 x 100 = 1000")],
      xp: 10,
      accepted: ["1000", "1000x"],
    },
    {
      id: "micro-p4",
      type: "matching",
      prompt: [t("Match each microscope term to its meaning.")],
      explanation: [
        t(
          "A specimen is the object being viewed. A slide holds the specimen. The field of view is the visible area. Total magnification is eyepiece times objective.",
        ),
      ],
      xp: 15,
      pairs: [
        {
          id: "a",
          left: [t("Specimen")],
          right: [t("The object being viewed")],
        },
        {
          id: "b",
          left: [t("Slide")],
          right: [t("The glass plate that holds the specimen")],
        },
        {
          id: "c",
          left: [t("Field of view")],
          right: [t("The area visible through the microscope")],
        },
        {
          id: "d",
          left: [t("Total magnification")],
          right: [t("Eyepiece times objective magnification")],
        },
      ],
    },
    {
      id: "micro-p5",
      type: "mcq",
      prompt: [
        t(
          "When focusing a specimen, why should you always start with the lowest magnification?",
        ),
      ],
      explanation: [
        t(
          "Starting with the lowest magnification gives the largest field of view and greatest working distance, making it easier to locate the specimen safely.",
        ),
      ],
      xp: 10,
      options: [
        {
          id: "a",
          label: [
            t(
              "It gives a larger field of view and helps locate the specimen safely",
            ),
          ],
        },
        { id: "b", label: [t("It produces the brightest image")] },
        {
          id: "c",
          label: [t("It is the only lens that works with fine focus")],
        },
        { id: "d", label: [t("It shows the most detail")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "micro-p6",
      type: "shortText",
      prompt: [
        t(
          "Describe two things you should do if the image under the microscope is too dark.",
        ),
      ],
      explanation: [
        t(
          "Check that the light source is turned on and open the diaphragm to let more light through the specimen.",
        ),
      ],
      xp: 15,
      accepted: ["turn on light", "open diaphragm", "more light", "brightness"],
    },
  ],
  mastery: [
    {
      id: "micro-m1",
      type: "mcq",
      prompt: [
        t(
          "You want to examine the detailed structure of a single cheek cell. Which microscope and magnification would be most appropriate?",
        ),
      ],
      explanation: [
        t(
          "A compound light microscope at about 400x is suitable for observing a cheek cell in a school laboratory.",
        ),
      ],
      xp: 15,
      options: [
        { id: "a", label: [t("Compound light microscope at 400x")] },
        { id: "b", label: [t("Stereo microscope at 40x")] },
        { id: "c", label: [t("Hand lens at 2x")] },
        { id: "d", label: [t("Electron microscope at 10000x")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "micro-m2",
      type: "numeric",
      prompt: [
        t(
          "A student views a specimen using a 10x eyepiece and a 10x objective. They switch to a 40x objective. How many times greater is the new total magnification?",
        ),
      ],
      explanation: [
        m(
          String.raw`Initial = 10 \\times 10 = 100. New = 10 \\times 40 = 400. 400 \\div 100 = 4`,
          "Initial = 100x, new = 400x, so 4 times greater",
        ),
      ],
      xp: 15,
      accepted: ["4", "4 times", "four"],
    },
  ],
};

// ---------------------------------------------------------------------------
// Lesson 3 – Cell structure and function
// ---------------------------------------------------------------------------

const cellStructureLesson: Lesson = {
  id: "cell-structure-function",
  order: 3,
  title: "Cell structure and function",
  sourceRef: "3. Cells: Structure and Function (Stile)",
  aiProvenance: {
    tool: "Claude",
    sources: ["Stile: 3. Cells: Structure and Function"],
    role: "generated",
  },
  learnCards: [
    {
      id: "sf-unicellular",
      heading: "Unicellular and multicellular organisms",
      body: [
        t(
          "Some organisms are made of just one cell. Bacteria, archaea, and many protists are unicellular. Animals, plants, and fungi are multicellular, with specialised cells that depend on each other.",
        ),
        t(
          "The six kingdoms of living things can be partly distinguished by cell structure. For example, bacteria and archaea are unicellular and do not have a nucleus.",
        ),
      ],
    },
    {
      id: "sf-organelles",
      heading: "Organelles: little organs",
      figure: figAnimalCell,
      body: [
        t(
          "Inside cells are smaller structures called organelles. The nucleus stores DNA and controls the cell. The cell membrane holds the cell contents and controls what enters and leaves.",
        ),
        t(
          "Mitochondria convert sugars into usable energy. Ribosomes build proteins. Each organelle's structure is related to its function.",
        ),
      ],
    },
    {
      id: "sf-plant",
      heading: "Plant cells vs animal cells",
      figure: figPlantCell,
      body: [
        t(
          "Plant cells have three structures animal cells usually lack: a cell wall, a large central vacuole, and chloroplasts. The cell wall provides rigid support. The vacuole stores water. Chloroplasts carry out photosynthesis.",
        ),
        t(
          "These differences reflect the different ways plants and animals live. Plants cannot move to find water or food, so they store water, stand upright, and make their own food from sunlight.",
        ),
      ],
    },
  ],
  practice: [
    {
      id: "sf-p1",
      type: "mcq",
      prompt: [
        t("Which organelle is often called the control centre of the cell?"),
      ],
      explanation: [
        t(
          "The nucleus contains the cell's DNA and controls the cell's activities.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Nucleus")] },
        { id: "b", label: [t("Mitochondrion")] },
        { id: "c", label: [t("Vacuole")] },
        { id: "d", label: [t("Cell membrane")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "sf-p2",
      type: "mcq",
      prompt: [t("What is the main function of mitochondria?")],
      explanation: [
        t(
          "Mitochondria convert glucose and oxygen into ATP, a usable form of energy.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Convert sugar into usable energy")] },
        { id: "b", label: [t("Capture sunlight for photosynthesis")] },
        { id: "c", label: [t("Store water and nutrients")] },
        { id: "d", label: [t("Control what enters the cell")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "sf-p3",
      type: "mcq",
      prompt: [t("In which organelle does photosynthesis take place?")],
      explanation: [
        t("Photosynthesis occurs in chloroplasts, which contain chlorophyll."),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Chloroplast")] },
        { id: "b", label: [t("Mitochondrion")] },
        { id: "c", label: [t("Nucleus")] },
        { id: "d", label: [t("Vacuole")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "sf-p4",
      type: "matching",
      prompt: [t("Match each organelle to its main function.")],
      explanation: [
        t(
          "The nucleus stores DNA. Mitochondria release energy. Chloroplasts carry out photosynthesis. The cell membrane controls movement. The vacuole stores materials.",
        ),
      ],
      xp: 15,
      pairs: [
        {
          id: "a",
          left: [t("Nucleus")],
          right: [t("Stores DNA and controls the cell")],
        },
        {
          id: "b",
          left: [t("Mitochondrion")],
          right: [t("Converts sugar into usable energy")],
        },
        {
          id: "c",
          left: [t("Chloroplast")],
          right: [t("Carries out photosynthesis")],
        },
        {
          id: "d",
          left: [t("Cell membrane")],
          right: [t("Controls what enters and leaves")],
        },
        {
          id: "e",
          left: [t("Vacuole")],
          right: [t("Stores water, nutrients, or waste")],
        },
      ],
    },
    {
      id: "sf-p5",
      type: "mcq",
      prompt: [
        t("Which structure gives plant cells their rigid, box-like shape?"),
      ],
      explanation: [
        t(
          "The cell wall is a rigid layer outside the cell membrane, made mainly of cellulose.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Cell wall")] },
        { id: "b", label: [t("Cell membrane")] },
        { id: "c", label: [t("Nucleus")] },
        { id: "d", label: [t("Chloroplast")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "sf-p6",
      type: "shortText",
      prompt: [
        t(
          "Why do plant cells need a large central vacuole, while animal cells usually have only small vacuoles?",
        ),
      ],
      explanation: [
        t(
          "Plants cannot move to find water, so they store water in a large central vacuole. This also helps maintain turgor pressure to keep the plant upright.",
        ),
      ],
      xp: 15,
      accepted: ["store water", "cannot move", "turgor pressure", "upright"],
    },
  ],
  mastery: [
    {
      id: "sf-m1",
      type: "shortText",
      prompt: [
        t(
          "Compare and contrast plant and animal cells, naming at least two structures they have in common and two that differ.",
        ),
      ],
      explanation: [
        t(
          "Both plant and animal cells have a cell membrane, nucleus, mitochondria, ribosomes, and cytosol. Plant cells also have a cell wall, chloroplasts, and a large central vacuole.",
        ),
      ],
      xp: 20,
      accepted: [
        "cell membrane",
        "nucleus",
        "mitochondria",
        "cell wall",
        "chloroplasts",
        "vacuole",
      ],
    },
    {
      id: "sf-m2",
      type: "mcq",
      prompt: [
        t(
          "Which statement best explains the relationship between cell structure and function?",
        ),
      ],
      explanation: [
        t(
          "The shape and components of an organelle are adapted to its job. For example, mitochondrial membranes have a large surface area for energy production.",
        ),
      ],
      xp: 15,
      options: [
        {
          id: "a",
          label: [
            t("The structure of an organelle is usually suited to its role"),
          ],
        },
        {
          id: "b",
          label: [
            t("All organelles have the same structure regardless of function"),
          ],
        },
        { id: "c", label: [t("Cell structure has no effect on function")] },
        { id: "d", label: [t("Only plant cells have specialised structures")] },
      ],
      correctOptionId: "a",
    },
  ],
};

// ---------------------------------------------------------------------------
// Lesson 4 – Sizes of cells
// ---------------------------------------------------------------------------

const cellSizesLesson: Lesson = {
  id: "sizes-of-cells",
  order: 4,
  title: "Sizes of cells",
  sourceRef: "EXTENSION: Sizes of cells (Stile)",
  aiProvenance: {
    tool: "Claude",
    sources: ["Stile: EXTENSION: Sizes of cells"],
    role: "generated",
  },
  learnCards: [
    {
      id: "sizes-scale",
      heading: "How small are cells?",
      figure: figCellSizeScale,
      body: [
        t(
          "Cells vary enormously in size. An amoeba can be 500 micrometres across. A human egg cell is about 130 micrometres. A skin cell is roughly 30 micrometres, while a red blood cell is only about 8 micrometres across.",
        ),
        t(
          "Bacteria such as E. coli are about 1-2 micrometres long. Viruses are even smaller, often measured in nanometres.",
        ),
      ],
    },
    {
      id: "sizes-units",
      heading: "Micrometres and nanometres",
      body: [
        t(
          "A millimetre is one thousandth of a metre. A micrometre is one millionth of a metre, so there are 1000 micrometres in a millimetre.",
        ),
        t(
          "A nanometre is one billionth of a metre, so there are 1000 nanometres in a micrometre.",
        ),
      ],
    },
    {
      id: "sizes-converting",
      heading: "Converting between units",
      body: [
        t(
          "To convert from micrometres to millimetres, divide by 1000. To convert from nanometres to micrometres, also divide by 1000.",
        ),
        t(
          "For example, an amoeba of 500 micrometres is equal to 0.5 millimetres, the same size as a grain of salt.",
        ),
      ],
    },
  ],
  practice: [
    {
      id: "sizes-p1",
      type: "mcq",
      prompt: [
        t(
          "Which unit is most useful for measuring the length of a bacterial cell?",
        ),
      ],
      explanation: [t("Bacterial cells are typically a few micrometres long.")],
      xp: 10,
      options: [
        { id: "a", label: [t("Micrometre")] },
        { id: "b", label: [t("Millimetre")] },
        { id: "c", label: [t("Kilometre")] },
        { id: "d", label: [t("Metre")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "sizes-p2",
      type: "numeric",
      prompt: [t("Convert 10 micrometres into millimetres.")],
      explanation: [m(String.raw`10 \\div 1000 = 0.01`, "10 / 1000 = 0.01")],
      xp: 10,
      accepted: ["0.01", "0.01 mm"],
      unit: "mm",
    },
    {
      id: "sizes-p3",
      type: "numeric",
      prompt: [t("Convert 20 micrometres into nanometres.")],
      explanation: [
        m(String.raw`20 \\times 1000 = 20 000`, "20 x 1000 = 20000"),
      ],
      xp: 10,
      accepted: ["20000", "20000 nm", "20 000"],
      unit: "nm",
    },
    {
      id: "sizes-p4",
      type: "mcq",
      prompt: [
        t(
          "A typical red blood cell is about 8 micrometres across. The aorta is about 20 mm across. About how many red blood cells fit side-by-side across the aorta?",
        ),
      ],
      explanation: [
        m(
          String.raw`20 \\text{ mm} = 20 000 \\mu\\text{m}. 20 000 \\div 8 = 2500`,
          "20 mm = 20000 micrometres. 20000 / 8 = 2500",
        ),
      ],
      xp: 15,
      options: [
        { id: "a", label: [t("About 2500")] },
        { id: "b", label: [t("About 25")] },
        { id: "c", label: [t("About 250")] },
        { id: "d", label: [t("About 25 000")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "sizes-p5",
      type: "fillInTheBlank",
      prompt: [t("Complete the sentence about unit conversions.")],
      template: [t("There are 1000 nanometres in one ___.")],
      explanation: [t("One micrometre is equal to 1000 nanometres.")],
      xp: 10,
      accepted: ["micrometre", "micrometer", "micrometres", "micrometers"],
    },
    {
      id: "sizes-p6",
      type: "matching",
      prompt: [t("Match each object to its approximate size.")],
      explanation: [
        t(
          "A grain of rice is about 5 mm. An amoeba is about 500 micrometres. A red blood cell is about 8 micrometres. E. coli is about 1-2 micrometres. An influenza virus is about 130 nm.",
        ),
      ],
      xp: 15,
      pairs: [
        { id: "a", left: [t("Grain of rice")], right: [t("About 5 mm")] },
        { id: "b", left: [t("Amoeba")], right: [t("About 500 micrometres")] },
        {
          id: "c",
          left: [t("Red blood cell")],
          right: [t("About 8 micrometres")],
        },
        {
          id: "d",
          left: [t("E. coli bacterium")],
          right: [t("About 1-2 micrometres")],
        },
        { id: "e", left: [t("Influenza virus")], right: [t("About 130 nm")] },
      ],
    },
  ],
  mastery: [
    {
      id: "sizes-m1",
      type: "numeric",
      prompt: [t("Convert 130 nanometres into millimetres.")],
      explanation: [
        m(String.raw`130 \\div 1 000 000 = 0.00013`, "130 / 1000000 = 0.00013"),
      ],
      xp: 15,
      accepted: ["0.00013", "0.00013 mm"],
      unit: "mm",
    },
    {
      id: "sizes-m2",
      type: "shortText",
      prompt: [
        t(
          "Why is it difficult to compare the sizes of a human egg cell (130 micrometres) and a fingernail (12 mm) without converting units?",
        ),
      ],
      explanation: [
        t(
          "Different units make direct comparison confusing. By converting 130 micrometres to 0.13 mm, it becomes clear the fingernail is roughly 100 times wider.",
        ),
      ],
      xp: 20,
      accepted: [
        "different units",
        "need common unit",
        "hard to compare",
        "convert to same unit",
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Boss challenge
// ---------------------------------------------------------------------------

const biologyBossQuestions: Question[] = [
  {
    id: "bio-boss-1",
    type: "mcq",
    prompt: [t("Which statement is part of the modern cell theory?")],
    explanation: [
      t(
        "Cell theory states that all living things are made of cells, cells are the basic units of life, and all cells come from pre-existing cells.",
      ),
    ],
    xp: 20,
    options: [
      { id: "a", label: [t("All cells come from pre-existing cells")] },
      { id: "b", label: [t("Cells can form from non-living matter")] },
      { id: "c", label: [t("Only plants and animals are made of cells")] },
      { id: "d", label: [t("Cells are all visible to the naked eye")] },
    ],
    correctOptionId: "a",
  },
  {
    id: "bio-boss-2",
    type: "mcq",
    prompt: [
      t(
        "A microscope has a 10x eyepiece and a 40x objective. What is the total magnification?",
      ),
    ],
    explanation: [m(String.raw`10 \\times 40 = 400`, "10 x 40 = 400")],
    xp: 20,
    options: [
      { id: "a", label: [t("400x")] },
      { id: "b", label: [t("50x")] },
      { id: "c", label: [t("4000x")] },
      { id: "d", label: [t("14x")] },
    ],
    correctOptionId: "a",
  },
  {
    id: "bio-boss-3",
    type: "matching",
    prompt: [t("Match each organelle to its function.")],
    explanation: [
      t(
        "The nucleus controls the cell, mitochondria release energy, chloroplasts carry out photosynthesis, and the cell membrane controls what enters and leaves.",
      ),
    ],
    xp: 25,
    pairs: [
      {
        id: "a",
        left: [t("Nucleus")],
        right: [t("Controls the cell using DNA")],
      },
      {
        id: "b",
        left: [t("Mitochondrion")],
        right: [t("Releases energy from sugars")],
      },
      {
        id: "c",
        left: [t("Chloroplast")],
        right: [t("Carries out photosynthesis")],
      },
      {
        id: "d",
        left: [t("Cell membrane")],
        right: [t("Controls movement of substances")],
      },
    ],
  },
  {
    id: "bio-boss-4",
    type: "shortText",
    prompt: [
      t(
        "Explain why plant cells have structures that animal cells do not, and give two examples.",
      ),
    ],
    explanation: [
      t(
        "Plants are stationary and must make their own food. They have a cell wall for support, chloroplasts for photosynthesis, and a large vacuole for water storage.",
      ),
    ],
    xp: 25,
    accepted: [
      "cell wall",
      "chloroplasts",
      "vacuole",
      "plants make food",
      "plants cannot move",
    ],
  },
  {
    id: "bio-boss-5",
    type: "numeric",
    prompt: [t("Convert 500 micrometres into millimetres.")],
    explanation: [m(String.raw`500 \\div 1000 = 0.5`, "500 / 1000 = 0.5")],
    xp: 20,
    accepted: ["0.5", "0.5 mm"],
    unit: "mm",
  },
  {
    id: "bio-boss-6",
    type: "mcq",
    prompt: [
      t(
        "Which scientist is correctly matched with their contribution to cell theory?",
      ),
    ],
    explanation: [
      t(
        "Rudolf Virchow proposed that cells come from pre-existing cells. Robert Hooke named cells. Schleiden and Schwann proposed that all plants and animals are made of cells.",
      ),
    ],
    xp: 20,
    options: [
      { id: "a", label: [t("Virchow — cells come from pre-existing cells")] },
      {
        id: "b",
        label: [t("Hooke — observed microscopic life in pond water")],
      },
      { id: "c", label: [t("Schwann — named cells after studying cork")] },
      {
        id: "d",
        label: [t("Pasteur — proposed all plants are made of cells")],
      },
    ],
    correctOptionId: "a",
  },
  {
    id: "bio-boss-7",
    type: "fillInTheBlank",
    prompt: [t("Complete the sentence about microscope use.")],
    template: [
      t("When switching to a higher magnification, the field of view ___."),
    ],
    explanation: [
      t(
        "Magnification and field of view have an inverse relationship. As magnification increases, the field of view decreases.",
      ),
    ],
    xp: 20,
    accepted: ["decreases", "gets smaller", "shrinks"],
  },
  {
    id: "bio-boss-8",
    type: "shortText",
    prompt: [
      t(
        "A cell has a cell wall and chloroplasts but no large central vacuole. Is it likely to be a plant or animal cell? Explain your reasoning.",
      ),
    ],
    explanation: [
      t(
        "The presence of a cell wall and chloroplasts indicates a plant cell. While most mature plant cells have a large central vacuole, some younger or specialised plant cells may have smaller vacuoles.",
      ),
    ],
    xp: 25,
    accepted: [
      "plant cell",
      "cell wall and chloroplasts",
      "animal cells lack these",
    ],
  },
];

// ---------------------------------------------------------------------------
// Track export
// ---------------------------------------------------------------------------

/** The Year 8 Biology: Cells track. */
export const biologyTrack: Track = {
  id: "biology",
  subjectId: "science",
  title: "Biology: Cells (Year 8)",
  description:
    "Cell theory, microscopes, organelles, and the amazing scale of living cells.",
  lessons: [
    cellTheoryLesson,
    microscopesLesson,
    cellStructureLesson,
    cellSizesLesson,
  ],
  challenge: {
    id: "biology-boss",
    title: "Boss challenge: Cells",
    sourceRef: "2026 8 Science - Biology Stile Unit, The Gap State High School",
    questions: biologyBossQuestions,
    bonusXp: 100,
    passBadgeId: "boss-biology",
    aiProvenance: {
      tool: "Claude",
      sources: [
        "Stile: 1. Cells & Cell Theory",
        "Stile: 2. Microscopes",
        "Stile: 3. Cells: Structure and Function",
        "Stile: EXTENSION: Sizes of cells",
      ],
      role: "generated",
    },
  },
};
