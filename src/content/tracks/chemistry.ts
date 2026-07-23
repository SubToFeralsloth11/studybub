/**
 * Year 8 Chemistry: Elements & the Periodic Table track content.
 *
 * Covers elements, atoms, symbols, metals and non-metals, the Periodic Table,
 * and subatomic particles. Based on the 2026 8 Science - Chemistry (Unit 5)
 * Stile unit at The Gap State High School, enriched with standard Year 8
 * chemistry references.
 *
 * External references:
 * - Stile: 1.0 Intro: A precious gas (helium and the East African Rift)
 * - Stile: 1.1 Elements (Cambridge 7.1 Atoms and Elements)
 * - Stile: 1.2 Organising Elements into the Periodic Table (Cambridge 7.2)
 * - Stile: Build an Atom (PhET simulation; YouTube: What is an Atom)
 *
 * @author John Grimes
 * @module content/tracks/chemistry
 */

import { t } from "../blocks";

import type {
  Figure,
  Lesson,
  Question,
  Track,
} from "../../domain/content/types";

// ---------------------------------------------------------------------------
// Figures
// ---------------------------------------------------------------------------

const figPeriodicTable: Figure = {
  id: "periodic-table-overview",
  alt: "A simplified Periodic Table of the Elements showing 18 groups (columns) numbered 1–18 and 7 periods (rows). Metals are shaded on the left and centre, non-metals on the right, with a staircase divider between them. Hydrogen sits alone at the top left.",
  textFallback:
    "[Diagram: Periodic Table — 18 groups (columns) and 7 periods (rows); metals on the left/centre, non-metals on the right, separated by a staircase line; hydrogen is the odd one out at top left]",
};

const figAtomStructure: Figure = {
  id: "atom-structure",
  alt: "Labelled diagram of an atom. A central nucleus contains positively charged protons (red, marked +) and neutral neutrons (grey). Two electron shells (rings) surround the nucleus, carrying negatively charged electrons (blue, marked −).",
  textFallback:
    "[Diagram: Atom — central nucleus of protons (+) and neutrons (neutral), surrounded by electron shells carrying electrons (−)]",
};

const figMatterClassification: Figure = {
  id: "matter-classification",
  alt: "Three labelled boxes side by side comparing an element, a compound and a mixture. Element: one type of atom (all identical circles). Compound: two elements chemically joined in fixed ratio. Mixture: two or more substances physically mixed, not chemically bonded.",
  textFallback:
    "[Diagram: Element (one type of atom) vs Compound (two elements chemically joined) vs Mixture (substances physically mixed, not bonded)]",
};

const figMetalsNonmetals: Figure = {
  id: "metals-nonmetals-properties",
  alt: "Two-column comparison table. Metals (left): shiny, solid, malleable, conduct electricity and heat. Non-metals (right): dull, often gases or brittle solids, poor conductors.",
  textFallback:
    "[Diagram: Metals — shiny, solid, malleable, good conductors. Non-metals — dull, often gases/brittle solids, poor conductors]",
};

export const chemistryFigures: Figure[] = [
  figPeriodicTable,
  figAtomStructure,
  figMatterClassification,
  figMetalsNonmetals,
];

// ---------------------------------------------------------------------------
// Lesson 1 – Elements: the building blocks of matter
// ---------------------------------------------------------------------------

const elementsIntroLesson: Lesson = {
  id: "elements-intro",
  order: 1,
  title: "Elements: the building blocks of matter",
  sourceRef: "1.0 Intro: A precious gas (Stile)",
  aiProvenance: {
    tool: "Claude",
    sources: [
      "Stile: 1.0 Intro: A precious gas",
      "Stile: 1.1 Elements",
      "Cambridge 7.1 Atoms and Elements",
    ],
    role: "generated",
  },
  learnCards: [
    {
      id: "el-what",
      heading: "Key idea: everything is made of elements",
      body: [
        t(
          "Look around you — the air, the chair, your own body. All of it is built from a surprisingly small set of basic substances called elements. An element is a pure substance that cannot be broken down into anything simpler by chemical means.",
        ),
        t(
          "Scientists have confirmed 118 elements. Only about 90 occur naturally; the rest were made in laboratories by smashing atoms together in particle accelerators. Every element gives the substances around us their incredible variety of properties.",
        ),
      ],
    },
    {
      id: "el-helium",
      heading: "Hook: a precious gas",
      body: [
        t(
          "Helium is the second most common element in the universe, but there is not much of it on Earth. Helium is so light that when it is released into the air it rises to the top of the atmosphere and escapes into space.",
        ),
        t(
          "The properties that make helium rare also make it useful. Its lightness lifts party balloons and scientific balloons into the upper atmosphere. As a coolant it stays liquid until −269 °C, so it cools the superconducting magnets in medical MRI scanners and the Large Hadron Collider.",
        ),
        t(
          "Helium shows how a single element — just one type of atom — can shape the technology and everyday life of the world around us.",
        ),
      ],
    },
    {
      id: "el-atom",
      heading: "Atoms: the smallest piece",
      body: [
        t(
          "Each element is made of only one type of atom. An atom is the smallest particle of an element that still has the properties of that element. Atoms are unimaginably tiny — far too small to see with the naked eye, and only the very largest can be glimpsed under the most powerful microscopes.",
        ),
        t(
          "Carbon atoms make up coal, diamonds and the ink in your pen. Gold atoms make up a gold ring. The element's identity comes from the type of atom it contains: calcium is made only of calcium atoms, never a mix.",
        ),
      ],
      figure: figAtomStructure,
    },
  ],
  practice: [
    {
      id: "el-p1",
      type: "mcq",
      prompt: [
        t(
          "Helium is described as a 'precious gas'. Which property makes it useful as a coolant in MRI scanners?",
        ),
      ],
      explanation: [
        t(
          "Helium does not turn to liquid until −269 °C, far colder than liquid nitrogen's freezing point (−210 °C). That lets it keep superconducting magnets extremely cold so they work inside medical scanners.",
        ),
      ],
      xp: 10,
      options: [
        {
          id: "a",
          label: [t("It is the most common element in the universe")],
        },
        {
          id: "b",
          label: [t("It stays liquid at extremely low temperatures")],
        },
        { id: "c", label: [t("It combines easily with other elements")] },
        { id: "d", label: [t("It glows when electricity passes through it")] },
      ],
      correctOptionId: "b",
    },
    {
      id: "el-p2",
      type: "mcq",
      prompt: [
        t("Which statement is the best definition of a chemical element?"),
      ],
      explanation: [
        t(
          "An element is a pure substance made up of only one type of atom. Calcium contains only calcium atoms; it cannot be broken into simpler substances by chemical reactions.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("A substance made out of carbon")] },
        { id: "b", label: [t("A mixture of different types of atoms")] },
        { id: "c", label: [t("A substance made up of only one type of atom")] },
        {
          id: "d",
          label: [t("Any substance whose atoms are too small to see")],
        },
      ],
      correctOptionId: "c",
    },
    {
      id: "el-p3",
      type: "mcq",
      prompt: [
        t(
          "Calcium is an element. What type of atoms is a pure sample of calcium made from?",
        ),
      ],
      explanation: [
        t(
          "Because calcium is an element, a pure sample contains only calcium atoms. Carbon and cadmium are different elements with their own atom types.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Cadmium atoms")] },
        { id: "b", label: [t("Carbon atoms")] },
        { id: "c", label: [t("Calcium atoms")] },
        { id: "d", label: [t("Both calcium and carbon atoms")] },
      ],
      correctOptionId: "c",
    },
    {
      id: "el-p4",
      type: "mcq",
      prompt: [
        t("Which of the following are elements? (Select all that apply.)"),
      ],
      explanation: [
        t(
          "Carbon and gold are elements — each is made of only one type of atom. Water, air and salt are not: water is a compound (H₂O), air is a mixture of gases, and salt is a compound (NaCl).",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Water")] },
        { id: "b", label: [t("Carbon")] },
        { id: "c", label: [t("Gold")] },
        { id: "d", label: [t("Air")] },
        { id: "e", label: [t("Salt")] },
      ],
      correctOptionId: "c",
    },
    {
      id: "el-p5",
      type: "shortText",
      prompt: [
        t(
          "Helium is rare on Earth even though it is the second most common element in the universe. Give one reason why.",
        ),
      ],
      explanation: [
        t(
          "Helium is so light and unreactive that when it is released into the air it rises to the top of the atmosphere and escapes into space. It does not combine with other elements to stay trapped, so little of it remains on Earth.",
        ),
      ],
      xp: 15,
      accepted: [
        "light",
        "rises",
        "escapes into space",
        "it is too light",
        "floats away",
        "it doesn't combine with anything",
        "rises to the top of the atmosphere",
        "escapes the atmosphere",
      ],
    },
    {
      id: "el-p6",
      type: "mcq",
      prompt: [
        t(
          "Ammonia is a gas used to make fertilisers. When a chemist heats pure ammonia to a very high temperature it breaks down into two other gases. Is ammonia an element?",
        ),
      ],
      explanation: [
        t(
          "No. An element cannot be broken down into simpler substances. Because ammonia breaks down into two other gases, it must be a compound made of two or more elements chemically joined.",
        ),
      ],
      xp: 15,
      options: [
        { id: "a", label: [t("Yes — it is a pure gas")] },
        {
          id: "b",
          label: [t("No — it can be broken down, so it is not an element")],
        },
        { id: "c", label: [t("Yes — all gases are elements")] },
        { id: "d", label: [t("There is not enough information to tell")] },
      ],
      correctOptionId: "b",
    },
    {
      id: "el-p7",
      type: "fillInTheBlank",
      prompt: [
        t(
          "Complete the sentence: An element is a pure substance made of only one type of ___.",
        ),
      ],
      explanation: [
        t(
          "An element contains only one type of atom. The word 'atom' comes from the Greek 'atomos' meaning 'indivisible' — the smallest piece of an element.",
        ),
      ],
      xp: 10,
      template: [
        t("An element is a pure substance made of only one type of ___."),
      ],
      accepted: ["atom", "atoms"],
    },
    {
      id: "el-p8",
      type: "matching",
      prompt: [t("Match each substance to whether it is an element or not.")],
      explanation: [
        t(
          "Carbon and mercury are elements (one type of atom each). Water and sugar are compounds; air is a mixture. The test is whether the substance can be broken down into simpler substances — only elements cannot.",
        ),
      ],
      xp: 15,
      pairs: [
        { id: "a", left: [t("Carbon")], right: [t("Element")] },
        { id: "b", left: [t("Water")], right: [t("Not an element")] },
        { id: "c", left: [t("Mercury")], right: [t("Element")] },
        { id: "d", left: [t("Sugar")], right: [t("Not an element")] },
      ],
    },
  ],
  mastery: [
    {
      id: "el-m1",
      type: "shortText",
      prompt: [
        t(
          "Name the extremely small particles that ordinary matter is composed of, and explain how they are related to elements.",
        ),
      ],
      explanation: [
        t(
          "Ordinary matter is composed of atoms. An element is a pure substance made of only one type of atom. For example, every atom in a sample of pure gold is a gold atom — that is what makes it the element gold.",
        ),
      ],
      xp: 25,
      accepted: [
        "atoms",
        "atom",
        "atoms and an element is made of one type of atom",
        "atoms element is one type",
      ],
    },
    {
      id: "el-m2",
      type: "mcq",
      prompt: [
        t(
          "A student says 'air is an element because it is a gas.' Why is this statement wrong?",
        ),
      ],
      explanation: [
        t(
          "Air is a mixture of several gases — mainly nitrogen, oxygen, argon and carbon dioxide. An element must be made of only one type of atom. Air can be separated into its parts (e.g. fractional distillation), which proves it is not an element.",
        ),
      ],
      xp: 25,
      options: [
        { id: "a", label: [t("Air is not a gas")] },
        {
          id: "b",
          label: [t("Air is a mixture of many gases, not one type of atom")],
        },
        { id: "c", label: [t("All gases are elements, so air is one")] },
        { id: "d", label: [t("Air contains no atoms")] },
      ],
      correctOptionId: "b",
    },
    {
      id: "el-m3",
      type: "mcq",
      prompt: [
        t(
          "Which of the following best explains why elements are described as the 'building blocks' of matter?",
        ),
      ],
      explanation: [
        t(
          "Elements combine in different ways to form the huge variety of compounds and mixtures around us, just as letters combine to form words. Everything you can see, touch and breathe is built from these 118 elements.",
        ),
      ],
      xp: 25,
      options: [
        {
          id: "a",
          label: [t("They are the largest objects in the universe")],
        },
        {
          id: "b",
          label: [
            t(
              "They are the simplest pure substances, and everything else is built from them",
            ),
          ],
        },
        {
          id: "c",
          label: [t("They are all gases at room temperature")],
        },
        {
          id: "d",
          label: [t("They can all be broken down into smaller pieces")],
        },
      ],
      correctOptionId: "b",
    },
  ],
};

// ---------------------------------------------------------------------------
// Lesson 2 – Atoms, symbols and the properties of elements
// ---------------------------------------------------------------------------

const atomsSymbolsLesson: Lesson = {
  id: "atoms-symbols",
  order: 2,
  title: "Atoms, symbols and properties",
  sourceRef: "1.1 Elements (Stile)",
  aiProvenance: {
    tool: "Claude",
    sources: ["Stile: 1.1 Elements", "Cambridge 7.1 Atoms and Elements"],
    role: "generated",
  },
  learnCards: [
    {
      id: "as-symbols",
      heading: "Key idea: element symbols",
      body: [
        t(
          "Because element names can be long and vary between languages, chemists use a one- or two-letter symbol for each element. The first letter is always a capital; if there is a second letter it is lowercase.",
        ),
        t(
          "Some symbols are easy to guess from the English name: H is hydrogen, O is oxygen, C is carbon, He is helium. Others come from older Latin or Greek names, so they do not match the English: Fe is iron (from ferrum), Au is gold (from aurum), Pb is lead (from plumbum), Na is sodium (from natrium).",
        ),
      ],
    },
    {
      id: "as-properties",
      heading: "Each element has unique properties",
      body: [
        t(
          "Each element has a unique set of properties — how it looks, behaves, and reacts. These properties decide whether the element is shiny or dull, solid or gas, or a good conductor of electricity.",
        ),
        t(
          "Elements are sorted into two broad groups. Metals (such as iron, copper and gold) are usually shiny, solid, malleable (can be hammered into shape) and good conductors of heat and electricity. Non-metals (such as oxygen, carbon and chlorine) are usually dull, often gases or brittle solids, and poor conductors.",
        ),
      ],
      figure: figMetalsNonmetals,
    },
    {
      id: "as-misconception",
      heading: "Common mix-up: elements vs compounds vs mixtures",
      body: [
        t(
          "Not everything is an element. Most substances around you are compounds or mixtures. A compound is two or more elements chemically joined in a fixed ratio — water (H₂O) is always two hydrogen atoms bonded to one oxygen atom. A mixture is two or more substances mixed together but not chemically bonded — air is a mixture of nitrogen, oxygen and other gases.",
        ),
        t(
          "The test: if a substance can be broken down into simpler substances, it is a compound, not an element. If its parts could be separated by physical means (filtering, distilling), it is a mixture.",
        ),
      ],
      figure: figMatterClassification,
    },
  ],
  practice: [
    {
      id: "as-p1",
      type: "mcq",
      prompt: [t("Which symbol correctly represents the element sodium?")],
      explanation: [
        t(
          "Sodium's symbol is Na, from its Latin name natrium. 'So' would use a capital S followed by lowercase o, which is the element sulfur (S) — a common trap. Symbols use one capital letter or a capital plus a lowercase letter.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("So")] },
        { id: "b", label: [t("Na")] },
        { id: "c", label: [t("SD")] },
        { id: "d", label: [t("nA")] },
      ],
      correctOptionId: "b",
    },
    {
      id: "as-p2",
      type: "mcq",
      prompt: [
        t("The symbol for gold is Au. Why doesn't it match the English name?"),
      ],
      explanation: [
        t(
          "Many symbols come from Latin names used by early chemists. Gold's symbol Au comes from the Latin word aurum. The same is true for iron (Fe, ferrum) and lead (Pb, plumbum).",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("It is a typo that became standard")] },
        { id: "b", label: [t("It comes from the Latin name aurum")] },
        { id: "c", label: [t("Au is gold's atomic number")] },
        { id: "d", label: [t("English used to spell gold 'au'")] },
      ],
      correctOptionId: "b",
    },
    {
      id: "as-p3",
      type: "matching",
      prompt: [t("Match each element symbol to its element name.")],
      explanation: [
        t(
          "H = hydrogen, O = oxygen, Fe = iron (Latin ferrum), Cl = chlorine. Notice Fe breaks the 'first letter' rule because it comes from Latin.",
        ),
      ],
      xp: 15,
      pairs: [
        { id: "a", left: [t("H")], right: [t("Hydrogen")] },
        { id: "b", left: [t("Fe")], right: [t("Iron")] },
        { id: "c", left: [t("O")], right: [t("Oxygen")] },
        { id: "d", left: [t("Cl")], right: [t("Chlorine")] },
      ],
    },
    {
      id: "as-p4",
      type: "mcq",
      prompt: [
        t(
          "Tungsten is a shiny, silver-coloured element. In old-fashioned light bulbs, electricity was passed through a thin tungsten wire to make it glow. Is tungsten a metal or a non-metal?",
        ),
      ],
      explanation: [
        t(
          "Tungsten is a metal. The clues — shiny, silver-coloured, and carries electricity to glow — are classic metal properties: lustre and good electrical conductivity.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Metal")] },
        { id: "b", label: [t("Non-metal")] },
        { id: "c", label: [t("Neither")] },
        { id: "d", label: [t("Both, depending on temperature")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "as-p5",
      type: "mcq",
      prompt: [
        t("Select TWO properties that distinguish metals from non-metals."),
      ],
      explanation: [
        t(
          "Metals are typically good conductors of electricity and are malleable (can be hammered into sheets). Being dull, brittle or a poor conductor are properties of non-metals.",
        ),
      ],
      xp: 15,
      options: [
        { id: "a", label: [t("Good conductor of electricity")] },
        { id: "b", label: [t("Dull appearance")] },
        { id: "c", label: [t("Malleable")] },
        { id: "d", label: [t("Brittle solid")] },
        { id: "e", label: [t("Poor conductor of heat")] },
      ],
      correctOptionId: "c",
    },
    {
      id: "as-p6",
      type: "fillInTheBlank",
      prompt: [
        t(
          "Complete the sentence: Water (H₂O) is a ___ because it is made of two elements chemically joined together.",
        ),
      ],
      explanation: [
        t(
          "Water is a compound — hydrogen and oxygen are chemically bonded in a fixed ratio of 2:1. A mixture would just be the gases stirred together without bonding.",
        ),
      ],
      xp: 10,
      template: [
        t(
          "Water (H₂O) is a ___ because it is made of two elements chemically joined together.",
        ),
      ],
      accepted: ["compound", "compounds"],
    },
    {
      id: "as-p7",
      type: "mcq",
      prompt: [
        t(
          "A student filters a sample of muddy water and separates the dirt from the water. What does this tell you about the muddy water?",
        ),
      ],
      explanation: [
        t(
          "Because the dirt and water can be separated by a physical method (filtering), muddy water is a mixture. Compounds and elements cannot be separated by physical means.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("It is an element")] },
        { id: "b", label: [t("It is a compound")] },
        { id: "c", label: [t("It is a mixture")] },
        { id: "d", label: [t("It is a pure substance")] },
      ],
      correctOptionId: "c",
    },
    {
      id: "as-p8",
      type: "shortText",
      prompt: [
        t(
          "Describe three properties you could use to tell that an unknown element is a non-metal.",
        ),
      ],
      explanation: [
        t(
          "Any three of: dull (not shiny) appearance; a gas at room temperature or a brittle solid; poor conductor of heat; poor conductor of electricity; low melting point. These contrast with the shiny, solid, malleable, conductive metals.",
        ),
      ],
      xp: 15,
      accepted: [
        "dull",
        "poor conductor",
        "brittle",
        "gas",
        "does not conduct",
        "low melting point",
        "non conductive",
      ],
    },
  ],
  mastery: [
    {
      id: "as-m1",
      type: "shortText",
      prompt: [
        t(
          "All elements in their pure forms exist as single atoms. Explain why this statement is NOT true, with an example.",
        ),
      ],
      explanation: [
        t(
          "The statement is false. Some elements exist as molecules — two or more of the same atoms bonded together. Oxygen (O₂) and hydrogen (H₂) both form diatomic molecules. Other elements, such as carbon in diamond, form giant networks of bonded atoms. Only the noble gases (like helium) normally exist as single, unattached atoms.",
        ),
      ],
      xp: 25,
      accepted: [
        "oxygen",
        "o2",
        "diatomic",
        "molecules",
        "hydrogen",
        "diamond",
        "some elements form molecules",
        "not all elements are single atoms",
      ],
    },
    {
      id: "as-m2",
      type: "mcq",
      prompt: [
        t(
          "Both molecules and lattices are formed by chemical bonds between atoms. What is the difference between them?",
        ),
      ],
      explanation: [
        t(
          "A molecule is a small, fixed group of atoms bonded together (like H₂O, three atoms). A lattice is a huge, repeating 3-D network of bonded atoms with no fixed size (like the carbon atoms in diamond, or sodium chloride in table salt). Both use chemical bonds, but molecules are discrete and lattices are extended.",
        ),
      ],
      xp: 25,
      options: [
        {
          id: "a",
          label: [
            t("Molecules are large networks; lattices are small fixed groups"),
          ],
        },
        {
          id: "b",
          label: [
            t(
              "Molecules are small fixed groups of atoms; lattices are huge repeating networks",
            ),
          ],
        },
        {
          id: "c",
          label: [t("Molecules use chemical bonds; lattices do not")],
        },
        {
          id: "d",
          label: [t("There is no difference")],
        },
      ],
      correctOptionId: "b",
    },
  ],
};

// ---------------------------------------------------------------------------
// Lesson 3 – Organising elements: the Periodic Table
// ---------------------------------------------------------------------------

const periodicTableLesson: Lesson = {
  id: "periodic-table",
  order: 3,
  title: "Organising elements: the Periodic Table",
  sourceRef: "1.2 Organising Elements into the Periodic Table (Stile)",
  aiProvenance: {
    tool: "Claude",
    sources: [
      "Stile: 1.2 Organising Elements into the Periodic Table",
      "Cambridge 7.2 Organising Elements",
    ],
    role: "generated",
  },
  learnCards: [
    {
      id: "pt-why",
      heading: "Key idea: finding the pattern",
      body: [
        t(
          "By the 1860s scientists knew of more than 60 elements, each with its own properties. The Russian chemist Dmitri Mendeleev searched for a pattern that would group elements with similar properties together. In 1869 he arranged the known elements in order of increasing atomic weight and spotted repeating ('periodic') trends.",
        ),
        t(
          "Mendeleev's genius was leaving gaps where no known element fitted — and predicting the properties of the elements that would later fill them (like gallium and germanium). His table became the model for today's Periodic Table.",
        ),
      ],
    },
    {
      id: "pt-layout",
      heading: "How the modern table is arranged",
      body: [
        t(
          "The modern Periodic Table lists all 118 known elements. They are arranged in order of increasing atomic number — the number of protons in the atom's nucleus. Hydrogen (1 proton) is first; oganesson (118 protons) is last.",
        ),
        t(
          "The table has two key directions. A period is a horizontal row (there are 7). A group is a vertical column (there are 18, numbered 1–18). Elements in the same group have similar chemical properties because they have the same arrangement of outer electrons.",
        ),
      ],
      figure: figPeriodicTable,
    },
    {
      id: "pt-weight",
      heading: "Atomic weight and the heaviest atoms",
      body: [
        t(
          "Each element has an atomic weight that compares how heavy its atoms are. Hydrogen has the lightest atoms (about 1). Carbon atoms are roughly 12 times heavier; mercury atoms about 200 times heavier.",
        ),
        t(
          "Hydrogen is the most abundant element in the universe, making up about three-quarters of all ordinary matter. In recent decades new 'superheavy' elements have been created in particle accelerators, bringing the total to 118 — but these only exist for fractions of a second.",
        ),
      ],
    },
  ],
  practice: [
    {
      id: "pt-p1",
      type: "mcq",
      prompt: [
        t(
          "True or false: Mendeleev was searching for a pattern in the elements that would group the ones with similar properties together.",
        ),
      ],
      explanation: [
        t(
          "True. Mendeleev's whole goal was to find an organising principle. He arranged elements so that those with similar properties fell into the same columns, revealing a repeating (periodic) pattern.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("True")] },
        { id: "b", label: [t("False")] },
        { id: "c", label: [t("I'm not sure")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "pt-p2",
      type: "mcq",
      prompt: [
        t(
          "In the modern Periodic Table, elements are arranged in order of increasing…",
        ),
      ],
      explanation: [
        t(
          "Elements are ordered by atomic number — the number of protons in the nucleus. Mendeleev used atomic weight because protons were not yet discovered; the modern table fixes a few cases where weight order would misplace an element.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("alphabetical name")] },
        { id: "b", label: [t("atomic weight")] },
        { id: "c", label: [t("atomic number")] },
        { id: "d", label: [t("year of discovery")] },
      ],
      correctOptionId: "c",
    },
    {
      id: "pt-p3",
      type: "mcq",
      prompt: [
        t("What name is given to a vertical column in the Periodic Table?"),
      ],
      explanation: [
        t(
          "A vertical column is a group. Elements in the same group have similar properties because they share the same number of outer electrons. A horizontal row is called a period.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("A period")] },
        { id: "b", label: [t("A group")] },
        { id: "c", label: [t("A family row")] },
        { id: "d", label: [t("A shell")] },
      ],
      correctOptionId: "b",
    },
    {
      id: "pt-p4",
      type: "mcq",
      prompt: [t("Why do elements in the same group have similar properties?")],
      explanation: [
        t(
          "Elements in the same group have the same number of electrons in their outer shell, and that is what governs how an element reacts chemically. So they behave in similar ways.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("They have the same atomic number")] },
        {
          id: "b",
          label: [t("They have the same outer electron arrangement")],
        },
        { id: "c", label: [t("They were discovered in the same year")] },
        { id: "d", label: [t("They have the same number of neutrons")] },
      ],
      correctOptionId: "b",
    },
    {
      id: "pt-p5",
      type: "fillInTheBlank",
      prompt: [
        t(
          "Complete the sentence: A horizontal row in the Periodic Table is called a ___.",
        ),
      ],
      explanation: [
        t(
          "A horizontal row is a period (which is why the table is called 'periodic' — properties repeat from one period to the next). There are 7 periods.",
        ),
      ],
      xp: 10,
      template: [t("A horizontal row in the Periodic Table is called a ___.")],
      accepted: ["period", "periods"],
    },
    {
      id: "pt-p6",
      type: "matching",
      prompt: [t("Match each Periodic Table feature to its description.")],
      explanation: [
        t(
          "Group = vertical column; Period = horizontal row; Atomic number = number of protons; Atomic weight = how heavy an atom is relative to others.",
        ),
      ],
      xp: 15,
      pairs: [
        { id: "a", left: [t("Group")], right: [t("Vertical column")] },
        { id: "b", left: [t("Period")], right: [t("Horizontal row")] },
        {
          id: "c",
          left: [t("Atomic number")],
          right: [t("Number of protons")],
        },
        {
          id: "d",
          left: [t("Atomic weight")],
          right: [t("How heavy atoms are")],
        },
      ],
    },
    {
      id: "pt-p7",
      type: "mcq",
      prompt: [
        t(
          "Mendeleev left gaps in his table. What was his reason for doing this?",
        ),
      ],
      explanation: [
        t(
          "Mendeleev believed the gaps belonged to elements that had not yet been discovered. He even predicted their properties. When gallium and germanium were later found with almost exactly those properties, his table was triumphantly confirmed.",
        ),
      ],
      xp: 15,
      options: [
        { id: "a", label: [t("He ran out of space on the page")] },
        {
          id: "b",
          label: [t("He predicted undiscovered elements would fill them")],
        },
        { id: "c", label: [t("He did not know about protons yet")] },
        { id: "d", label: [t("The gaps were printing errors")] },
      ],
      correctOptionId: "b",
    },
    {
      id: "pt-p8",
      type: "shortText",
      prompt: [
        t(
          "Hydrogen is described as 'the lightest element' and 'the most abundant element in the universe'. Give the approximate number of elements that exist in total today.",
        ),
      ],
      explanation: [
        t(
          "There are 118 known elements today. About 90 occur naturally; the rest are synthetic, made by colliding atoms together in particle accelerators. The last four were confirmed in 2015.",
        ),
      ],
      xp: 15,
      accepted: ["118", "one hundred and eighteen", "around 118", "about 118"],
    },
  ],
  mastery: [
    {
      id: "pt-m1",
      type: "mcq",
      prompt: [
        t(
          "Two elements are in the same group of the Periodic Table. Which statement is most likely to be true?",
        ),
      ],
      explanation: [
        t(
          "Because elements in the same group share the same number of outer electrons, they tend to have similar chemical properties — they react in comparable ways. They will NOT have the same atomic number (that would make them the same element).",
        ),
      ],
      xp: 25,
      options: [
        { id: "a", label: [t("They have the same atomic number")] },
        { id: "b", label: [t("They have similar chemical properties")] },
        { id: "c", label: [t("They were discovered in the same year")] },
        { id: "d", label: [t("They are both gases")] },
      ],
      correctOptionId: "b",
    },
    {
      id: "pt-m2",
      type: "shortText",
      prompt: [
        t(
          "Explain the difference between a group and a period on the Periodic Table, and state what is similar about the elements within a group.",
        ),
      ],
      explanation: [
        t(
          "A group is a vertical column; a period is a horizontal row. Elements within a group have similar chemical properties because they have the same number of outer electrons. As you move across a period, the properties change gradually.",
        ),
      ],
      xp: 25,
      accepted: [
        "group is a column",
        "period is a row",
        "vertical",
        "horizontal",
        "similar properties",
        "same outer electrons",
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Lesson 4 – Inside the atom: subatomic particles
// ---------------------------------------------------------------------------

const subatomicLesson: Lesson = {
  id: "subatomic-particles",
  order: 4,
  title: "Inside the atom: subatomic particles",
  sourceRef: "Build an Atom (Stile, PhET)",
  aiProvenance: {
    tool: "Claude",
    sources: [
      "Stile: Build an Atom (PhET simulation)",
      "YouTube: What is an Atom - Basics for Kids",
    ],
    role: "generated",
  },
  learnCards: [
    {
      id: "sa-particles",
      heading: "Key idea: three subatomic particles",
      body: [
        t(
          "Atoms are not the smallest things after all — they are made of even smaller particles called subatomic particles. There are three to know:",
        ),
        t(
          "Protons have a positive charge (+1) and sit in the central nucleus. Neutrons have no charge (0) and also sit in the nucleus. Electrons have a negative charge (−1) and move around the nucleus in electron shells.",
        ),
      ],
      figure: figAtomStructure,
    },
    {
      id: "sa-number",
      heading: "Atomic number: the atom's identity",
      body: [
        t(
          "The number of protons in the nucleus is called the atomic number. It decides which element the atom is. Every hydrogen atom has 1 proton (atomic number 1); every helium atom has 2 protons (atomic number 2). Change the number of protons and you change the element.",
        ),
        t(
          "In a neutral atom, the number of electrons equals the number of protons, so the charges balance to zero. You can change the number of neutrons without changing the element — that gives different versions called isotopes.",
        ),
      ],
    },
    {
      id: "sa-mass",
      heading: "Mass number and charge",
      body: [
        t(
          "The mass number is the total number of protons plus neutrons in the nucleus (electrons are far too light to count). For example, an atom with 6 protons and 6 neutrons has a mass number of 12 — that is carbon-12.",
        ),
        t(
          "The overall charge of an atom equals protons minus electrons. A neutral atom (equal protons and electrons) has a charge of 0. Add or remove electrons and you get a charged atom called an ion.",
        ),
      ],
    },
  ],
  practice: [
    {
      id: "sa-p1",
      type: "matching",
      prompt: [t("Match each subatomic particle to its charge and location.")],
      explanation: [
        t(
          "Protons are positive and in the nucleus; neutrons are neutral (no charge) and in the nucleus; electrons are negative and move around the nucleus in shells.",
        ),
      ],
      xp: 15,
      pairs: [
        {
          id: "a",
          left: [t("Proton")],
          right: [t("Positive, in the nucleus")],
        },
        {
          id: "b",
          left: [t("Neutron")],
          right: [t("No charge, in the nucleus")],
        },
        {
          id: "c",
          left: [t("Electron")],
          right: [t("Negative, in shells around the nucleus")],
        },
      ],
    },
    {
      id: "sa-p2",
      type: "numeric",
      prompt: [
        t(
          "An atom has 2 protons, 2 neutrons and 2 electrons. What is its atomic number?",
        ),
      ],
      explanation: [
        t(
          "Atomic number = number of protons = 2. This atom is helium (He), which always has 2 protons. The neutrons and electrons don't change the atomic number.",
        ),
      ],
      xp: 10,
      accepted: ["2"],
    },
    {
      id: "sa-p3",
      type: "numeric",
      prompt: [
        t("An atom has 6 protons and 6 neutrons. What is its mass number?"),
      ],
      explanation: [
        t(
          "Mass number = protons + neutrons = 6 + 6 = 12. This is carbon-12. Electrons are far too light to add anything to the mass.",
        ),
      ],
      xp: 10,
      accepted: ["12"],
    },
    {
      id: "sa-p4",
      type: "numeric",
      prompt: [
        t(
          "An atom has 11 protons and 10 electrons. What is its overall charge?",
        ),
      ],
      explanation: [
        t(
          "Charge = protons − electrons = 11 − 10 = +1. With more positive protons than negative electrons, the atom is a positively charged ion.",
        ),
      ],
      xp: 10,
      accepted: ["+1", "1", "positive", "plus 1"],
    },
    {
      id: "sa-p5",
      type: "mcq",
      prompt: [
        t(
          "Which subatomic particle can you change WITHOUT changing the identity of the element?",
        ),
      ],
      explanation: [
        t(
          "Changing the number of neutrons keeps the same element — it just creates a different isotope (a heavier or lighter version). Changing protons turns the atom into a different element; changing electrons turns it into an ion.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Proton")] },
        { id: "b", label: [t("Neutron")] },
        { id: "c", label: [t("Electron")] },
        { id: "d", label: [t("Nucleus")] },
      ],
      correctOptionId: "b",
    },
    {
      id: "sa-p6",
      type: "mcq",
      prompt: [t("What part of the atom decides which element it is?")],
      explanation: [
        t(
          "The number of protons (the atomic number) decides the element. Every carbon atom has 6 protons; if you add one more it becomes nitrogen. Neutrons and electrons can vary for the same element.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("The number of protons")] },
        { id: "b", label: [t("The number of neutrons")] },
        { id: "c", label: [t("The number of electrons")] },
        { id: "d", label: [t("The size of the atom")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "sa-p7",
      type: "fillInTheBlank",
      prompt: [
        t(
          "Complete the sentence: In a neutral atom, the number of electrons equals the number of ___.",
        ),
      ],
      explanation: [
        t(
          "In a neutral atom the positive protons and negative electrons balance exactly, so their numbers are equal. That is why a neutral atom has a charge of 0.",
        ),
      ],
      xp: 10,
      template: [
        t(
          "In a neutral atom, the number of electrons equals the number of ___.",
        ),
      ],
      accepted: ["protons", "proton"],
    },
    {
      id: "sa-p8",
      type: "mcq",
      prompt: [
        t(
          "An atom with 6 protons, 6 neutrons and 6 electrons is neutral. What happens to its charge if it loses one electron?",
        ),
      ],
      explanation: [
        t(
          "Losing an electron leaves 6 protons (+6) but only 5 electrons (−5), so the charge becomes +1. The atom is now a positive ion. Its mass number (12) and identity (carbon) are unchanged.",
        ),
      ],
      xp: 15,
      options: [
        { id: "a", label: [t("It becomes −1")] },
        { id: "b", label: [t("It becomes +1")] },
        { id: "c", label: [t("It stays 0")] },
        { id: "d", label: [t("It becomes +6")] },
      ],
      correctOptionId: "b",
    },
  ],
  mastery: [
    {
      id: "sa-m1",
      type: "shortText",
      prompt: [
        t(
          "Describe the three subatomic particles, stating the charge and location of each. Then explain what determines the identity (element) of an atom.",
        ),
      ],
      explanation: [
        t(
          "Protons: positive, in the nucleus. Neutrons: no charge, in the nucleus. Electrons: negative, in shells around the nucleus. The number of protons (atomic number) determines the element — change the protons and you change the element.",
        ),
      ],
      xp: 25,
      accepted: [
        "protons positive",
        "neutrons neutral",
        "electrons negative",
        "nucleus",
        "number of protons",
        "atomic number",
      ],
    },
    {
      id: "sa-m2",
      type: "mcq",
      prompt: [
        t(
          "Is the following statement true? 'The same element can have atoms with different numbers of neutrons.'",
        ),
      ],
      explanation: [
        t(
          "True. Atoms of the same element always have the same number of protons, but they can have different numbers of neutrons. These versions are called isotopes. For example, carbon-12 and carbon-14 are both carbon (6 protons) but have 6 and 8 neutrons respectively.",
        ),
      ],
      xp: 25,
      options: [
        { id: "a", label: [t("Yes — these are called isotopes")] },
        {
          id: "b",
          label: [t("No — all atoms of an element must be identical")],
        },
        { id: "c", label: [t("Only for metals")] },
        { id: "d", label: [t("Only for non-metals")] },
      ],
      correctOptionId: "a",
    },
  ],
};

// ---------------------------------------------------------------------------
// Boss challenge questions
// ---------------------------------------------------------------------------

const chemistryBossQuestions: Question[] = [
  {
    id: "boss-c-1",
    type: "mcq",
    prompt: [
      t(
        "An unknown substance cannot be broken down into anything simpler by chemical means. It is best described as…",
      ),
    ],
    explanation: [
      t(
        "An element is a pure substance that cannot be broken down chemically. If it could be broken down it would be a compound; if its parts were only physically mixed it would be a mixture.",
      ),
    ],
    xp: 20,
    options: [
      { id: "a", label: [t("A compound")] },
      { id: "b", label: [t("An element")] },
      { id: "c", label: [t("A mixture")] },
      { id: "d", label: [t("A molecule")] },
    ],
    correctOptionId: "b",
  },
  {
    id: "boss-c-2",
    type: "mcq",
    prompt: [
      t("The symbol for iron is Fe. Which statement explains this best?"),
    ],
    explanation: [
      t(
        "Fe comes from the Latin name ferrum. Many element symbols (Au for gold, Pb for lead, Na for sodium) come from Latin or Greek roots used long before modern English names existed.",
      ),
    ],
    xp: 20,
    options: [
      { id: "a", label: [t("'Fe' is iron's atomic number")] },
      { id: "b", label: [t("It comes from the Latin name ferrum")] },
      { id: "c", label: [t("It is short for 'Ferroconcrete'")] },
      { id: "d", label: [t("It is a spelling mistake")] },
    ],
    correctOptionId: "b",
  },
  {
    id: "boss-c-3",
    type: "numeric",
    prompt: [
      t(
        "An atom has 11 protons, 12 neutrons and 11 electrons. Calculate its mass number.",
      ),
    ],
    explanation: [
      t(
        "Mass number = protons + neutrons = 11 + 12 = 23. The electrons are far too light to count. This is sodium-23, the most common isotope of sodium.",
      ),
    ],
    xp: 25,
    accepted: ["23"],
  },
  {
    id: "boss-c-4",
    type: "shortText",
    prompt: [
      t(
        "An atom has 7 protons and 10 electrons. State its overall charge and explain what kind of atom it now is.",
      ),
    ],
    explanation: [
      t(
        "Charge = protons − electrons = 7 − 10 = −3. Because the atom has gained extra electrons it is now a negatively charged ion (an anion). The element is still nitrogen (7 protons) — only the electron count changed.",
      ),
    ],
    xp: 25,
    accepted: [
      "-3",
      "−3",
      "minus 3",
      "negative ion",
      "anion",
      "charge of minus 3",
    ],
  },
  {
    id: "boss-c-5",
    type: "mcq",
    prompt: [t("Which statement about the Periodic Table is correct?")],
    explanation: [
      t(
        "Elements in the same group (column) have similar chemical properties because they share the same number of outer electrons. The table is ordered by atomic number, not by atomic weight or alphabetically.",
      ),
    ],
    xp: 25,
    options: [
      { id: "a", label: [t("Elements are ordered alphabetically")] },
      {
        id: "b",
        label: [t("Elements in the same group have similar properties")],
      },
      { id: "c", label: [t("Each period has exactly 18 elements")] },
      { id: "d", label: [t("There are 90 groups")] },
    ],
    correctOptionId: "b",
  },
  {
    id: "boss-c-6",
    type: "matching",
    prompt: [t("Match each chemistry term to its correct meaning.")],
    explanation: [
      t(
        "Atomic number = number of protons; Mass number = protons + neutrons; Group = vertical column of similar elements; Isotope = same element, different neutron count.",
      ),
    ],
    xp: 25,
    pairs: [
      { id: "a", left: [t("Atomic number")], right: [t("Number of protons")] },
      {
        id: "b",
        left: [t("Mass number")],
        right: [t("Protons plus neutrons")],
      },
      { id: "c", left: [t("Group")], right: [t("Vertical column")] },
      {
        id: "d",
        left: [t("Isotope")],
        right: [t("Same element, different neutrons")],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Track export
// ---------------------------------------------------------------------------

/** The Year 8 Chemistry: Elements & the Periodic Table track. */
export const chemistryTrack: Track = {
  id: "chemistry",
  subjectId: "science",
  title: "Chemistry: Elements & the Periodic Table (Year 8)",
  description:
    "Elements, atoms, symbols, metals and non-metals, and how Mendeleev's Periodic Table organises them all.",
  lessons: [
    elementsIntroLesson,
    atomsSymbolsLesson,
    periodicTableLesson,
    subatomicLesson,
  ],
  challenge: {
    id: "chemistry-boss",
    title: "Boss challenge: Elements & the Periodic Table",
    sourceRef:
      "2026 8 Science - Chemistry (Unit 5) Stile Unit, The Gap State High School",
    questions: chemistryBossQuestions,
    bonusXp: 100,
    passBadgeId: "boss-chemistry",
    aiProvenance: {
      tool: "Claude",
      sources: [
        "Stile: 1.0 Intro: A precious gas",
        "Stile: 1.1 Elements",
        "Stile: 1.2 Organising Elements into the Periodic Table",
        "Stile: Build an Atom",
        "Stile: Check-in 1: Elements",
      ],
      role: "generated",
    },
  },
};
