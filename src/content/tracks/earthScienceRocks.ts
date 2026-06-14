/**
 * Earth Science - Rocks track content (Year 8 Science).
 *
 * Covers the layers of the Earth, the rock cycle, igneous, sedimentary and
 * metamorphic rocks, and how the properties of rocks influence their use.
 * Based on the 2026 8 Science - Earth Science Stile unit at The Gap State
 * High School.
 *
 * @author John Grimes
 * @module content/tracks/earthScienceRocks
 */

import { t } from "../blocks";

import type {
  Lesson,
  Track,
  Question,
  Figure,
} from "../../domain/content/types";

// ---------------------------------------------------------------------------
// Figures
// ---------------------------------------------------------------------------

const figEarthLayers: Figure = {
  id: "earth-layers",
  alt: "Cross-section of the Earth showing the four main layers: thin outer crust, thick rocky mantle, liquid outer core, and solid inner core.",
  textFallback:
    "[Diagram: Cross-section of the Earth — crust, mantle, outer core, inner core]",
};

const figRockCycle: Figure = {
  id: "rock-cycle",
  alt: "Diagram of the rock cycle showing how igneous, sedimentary and metamorphic rocks transform through melting, cooling, weathering, erosion, deposition, compaction, cementation, heat and pressure.",
  textFallback:
    "[Diagram: The rock cycle — igneous, sedimentary and metamorphic rocks linked by processes such as melting, cooling, erosion, compaction and heat]",
};

const figIgneousTextures: Figure = {
  id: "igneous-textures",
  alt: "Two igneous rock samples side by side: coarse-grained granite with large visible crystals, and fine-grained basalt with tiny crystals.",
  textFallback:
    "[Image: Coarse-grained intrusive igneous rock and fine-grained extrusive igneous rock]",
};

const figSedimentaryLayers: Figure = {
  id: "sedimentary-layers",
  alt: "Diagram showing sediment being deposited in horizontal layers on a riverbed or seabed, then compacted and cemented to form sedimentary rock.",
  textFallback:
    "[Diagram: Sediment deposited in layers, compacted and cemented into sedimentary rock]",
};

const figMetamorphicExamples: Figure = {
  id: "metamorphic-examples",
  alt: "Examples of metamorphic rocks including slate, schist, gneiss and marble, showing foliated and non-foliated textures.",
  textFallback:
    "[Image: Examples of metamorphic rocks — slate, schist, gneiss and marble]",
};

/** All figures referenced within the Earth Science - Rocks track. */
export const earthScienceRocksFigures: Figure[] = [
  figEarthLayers,
  figRockCycle,
  figIgneousTextures,
  figSedimentaryLayers,
  figMetamorphicExamples,
];

// ---------------------------------------------------------------------------
// Lesson 1 – Layers of the Earth
// ---------------------------------------------------------------------------

const layersOfEarth: Lesson = {
  id: "layers-of-earth",
  order: 1,
  title: "Layers of the Earth",
  sourceRef: "1. Layers of the Earth (Stile)",
  aiProvenance: {
    tool: "Claude",
    sources: [
      "Stile: 1. Layers of the Earth",
      "Stile: Cambridge Chapter 5 Rocks",
    ],
    role: "generated",
  },
  learnCards: [
    {
      id: "layers-overview",
      heading: "Four layers beneath our feet",
      figure: figEarthLayers,
      body: [
        t(
          "The Earth is not a solid ball of rock. It is made up of four main layers, each with different composition, temperature and physical state. From the outside in, these are the crust, the mantle, the outer core and the inner core.",
        ),
        t(
          "The crust is the thin, solid outer shell where we live. Oceanic crust under the oceans is only 5–10 km thick, while continental crust beneath the continents ranges from about 20–70 km.",
        ),
        t(
          "Beneath the crust lies the mantle, the thickest layer of all. It extends roughly 2,900 km down and is made of hot, solid rock that can flow very slowly over geological time.",
        ),
        t(
          "At the centre of the Earth is the core. The outer core is a layer of liquid iron and nickel about 2,200 km thick. Its movement generates Earth's magnetic field. The inner core is a solid ball of iron and nickel with a radius of about 1,220 km.",
        ),
      ],
    },
    {
      id: "layers-composition",
      heading: "Composition of each layer",
      body: [
        t(
          "The crust is made of solid rock rich in elements such as silicon, oxygen, aluminium, iron, calcium, sodium and potassium. Continental crust is less dense and granite-like, while oceanic crust is denser and basalt-like.",
        ),
        t(
          "The mantle is mostly solid but behaves like a very thick fluid over millions of years. It is composed mainly of silicate minerals rich in iron and magnesium. Convection currents in the mantle drive the movement of tectonic plates.",
        ),
        t(
          "The core is made mostly of iron and nickel. The liquid outer core's motion creates Earth's protective magnetic field. The inner core is kept solid by immense pressure.",
        ),
      ],
    },
    {
      id: "layers-discovery",
      heading: "How do we know what is inside?",
      body: [
        t(
          "Humans have never drilled deeper than about 12.3 km, far less than the distance to the mantle. Much of our knowledge comes from studying seismic waves generated by earthquakes.",
        ),
        t(
          "As seismic waves travel through the Earth, they change speed and direction depending on the material they pass through. Scientists use this data to map the layers and discovered that the outer core is liquid because certain earthquake waves cannot pass through it.",
        ),
      ],
    },
  ],
  practice: [
    {
      id: "layers-p1",
      type: "mcq",
      prompt: [t("Which lists Earth's layers in order from the outside in?")],
      explanation: [
        t(
          "The Earth has four main layers from the outside in: crust, mantle, outer core, inner core.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Crust, mantle, outer core, inner core")] },
        { id: "b", label: [t("Crust, inner core, outer core, mantle")] },
        { id: "c", label: [t("Inner core, outer core, mantle, crust")] },
        { id: "d", label: [t("Mantle, crust, outer core, inner core")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "layers-p2",
      type: "mcq",
      prompt: [t("Which layer is the thickest?")],
      explanation: [
        t(
          "The mantle is the thickest layer, extending roughly 2,900 km from the base of the crust to the top of the outer core.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Mantle")] },
        { id: "b", label: [t("Crust")] },
        { id: "c", label: [t("Outer core")] },
        { id: "d", label: [t("Inner core")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "layers-p3",
      type: "fillInTheBlank",
      prompt: [t("Complete the sentence about Earth's core.")],
      template: [
        t(
          "The outer core is liquid iron and nickel, while the inner core is ___ because of enormous pressure.",
        ),
      ],
      explanation: [
        t(
          "The inner core is solid iron and nickel. Even though it is extremely hot, the pressure from above is so great that the metal remains solid.",
        ),
      ],
      xp: 10,
      accepted: ["solid"],
    },
    {
      id: "layers-p4",
      type: "mcq",
      prompt: [t("Which layer generates Earth's magnetic field?")],
      explanation: [
        t(
          "The movement of liquid iron and nickel in the outer core generates Earth's magnetic field, which protects the planet from harmful solar radiation.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Outer core")] },
        { id: "b", label: [t("Inner core")] },
        { id: "c", label: [t("Mantle")] },
        { id: "d", label: [t("Crust")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "layers-p5",
      type: "matching",
      prompt: [t("Match each Earth layer to its description.")],
      explanation: [
        t(
          "The crust is the thin outer solid shell. The mantle is the thick, slowly flowing rocky layer. The outer core is liquid iron-nickel. The inner core is solid iron-nickel.",
        ),
      ],
      xp: 15,
      pairs: [
        {
          id: "a",
          left: [t("Crust")],
          right: [t("Thin, solid outer shell where we live")],
        },
        {
          id: "b",
          left: [t("Mantle")],
          right: [t("Thick, hot, slowly flowing rock")],
        },
        {
          id: "c",
          left: [t("Outer core")],
          right: [t("Liquid iron and nickel")],
        },
        {
          id: "d",
          left: [t("Inner core")],
          right: [t("Solid iron and nickel sphere")],
        },
      ],
    },
    {
      id: "layers-p6",
      type: "shortText",
      prompt: [
        t(
          "Why can't humans simply drill down to study the mantle and core directly?",
        ),
      ],
      explanation: [
        t(
          "The deepest hole ever drilled is only about 12.3 km deep, while the mantle begins about 30–70 km below the surface and the core is thousands of kilometres away. The temperature and pressure increase dramatically with depth, making direct exploration impossible with current technology.",
        ),
      ],
      xp: 15,
      accepted: [
        "too deep",
        "too hot",
        "too much pressure",
        "temperature",
        "pressure",
        "technology",
      ],
    },
    {
      id: "layers-p7",
      type: "mcq",
      prompt: [t("Which type of crust is denser?")],
      explanation: [
        t(
          "Oceanic crust is denser than continental crust because it is made mainly of basalt-like rocks, whereas continental crust is made mainly of lighter granite-like rocks.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Oceanic crust")] },
        { id: "b", label: [t("Continental crust")] },
        { id: "c", label: [t("They have the same density")] },
        { id: "d", label: [t("It depends on the location")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "layers-p8",
      type: "numeric",
      prompt: [
        t(
          "The inner core has a radius of about 1,220 km. Rounded to the nearest thousand, what is this?",
        ),
      ],
      explanation: [
        t(
          "1,220 km rounded to the nearest thousand is 1,000 km. The inner core is a solid sphere of iron and nickel about 1,220 km in radius.",
        ),
      ],
      xp: 10,
      accepted: ["1000"],
      unit: "km",
    },
  ],
  mastery: [
    {
      id: "layers-m1",
      type: "shortText",
      prompt: [
        t(
          "Explain why the inner core is solid even though it is hotter than the outer core.",
        ),
      ],
      explanation: [
        t(
          "The inner core is solid because of the extreme pressure from the layers above. Pressure raises the melting point of iron and nickel, so even though the temperature is very high, the metal remains solid. The outer core has less pressure pressing down on it, so it remains liquid.",
        ),
      ],
      xp: 20,
      accepted: [
        "pressure",
        "extreme pressure",
        "high pressure",
        "melting point",
      ],
    },
    {
      id: "layers-m2",
      type: "mcq",
      prompt: [
        t(
          "Which statement best explains how scientists have mapped Earth's interior without drilling deep?",
        ),
      ],
      explanation: [
        t(
          "Scientists study seismic waves from earthquakes. These waves behave differently in solids and liquids and at different temperatures and pressures, allowing scientists to infer the structure of Earth's interior.",
        ),
      ],
      xp: 15,
      options: [
        {
          id: "a",
          label: [
            t(
              "They analyse seismic waves that change speed and direction in different materials",
            ),
          ],
        },
        {
          id: "b",
          label: [t("They use satellites to photograph deep underground")],
        },
        {
          id: "c",
          label: [t("They collect samples from volcanic eruptions")],
        },
        {
          id: "d",
          label: [t("They send probes down deep boreholes")],
        },
      ],
      correctOptionId: "a",
    },
    {
      id: "layers-m3",
      type: "fillInTheBlank",
      prompt: [t("Complete the sentence about convection.")],
      template: [
        t(
          "Slow-moving convection currents in the ___ drive the movement of tectonic plates in the crust.",
        ),
      ],
      explanation: [
        t(
          "Convection currents in the mantle drive plate tectonics. Hot mantle rock rises, cooler rock sinks, and this slow circulation drags the rigid tectonic plates across the surface.",
        ),
      ],
      xp: 15,
      accepted: ["mantle"],
    },
  ],
};

// ---------------------------------------------------------------------------
// Lesson 2 – The rock cycle
// ---------------------------------------------------------------------------

const rockCycle: Lesson = {
  id: "rock-cycle",
  order: 2,
  title: "The rock cycle",
  sourceRef: "2. Processes in the Rock Cycle (Stile)",
  aiProvenance: {
    tool: "Claude",
    sources: [
      "Stile: 2. Processes in the Rock Cycle",
      "Stile: Annotated Diagrams: The Rock Cycle",
    ],
    role: "generated",
  },
  learnCards: [
    {
      id: "cycle-overview",
      heading: "Rocks are always changing",
      figure: figRockCycle,
      body: [
        t(
          "Rocks might look permanent, but they are constantly being recycled. The rock cycle is a series of processes that use energy to change rocks from one type to another. Some processes take millions of years; others, like volcanic eruptions, are fast and dramatic.",
        ),
        t(
          "There are three main types of rock: igneous, sedimentary and metamorphic. Each forms through different physical changes — melting, cooling, weathering, erosion, compaction, cementation, heat and pressure — that are all part of the rock cycle.",
        ),
      ],
    },
    {
      id: "cycle-processes",
      heading: "Key processes in the cycle",
      body: [
        t(
          "Weathering and erosion break rocks down into smaller pieces called sediment. Wind, rivers, glaciers and ocean currents transport sediment and deposit it in layers. Over time, compaction and cementation turn these sediments into sedimentary rock.",
        ),
        t(
          "Heat and pressure deep underground can change any existing rock into metamorphic rock without melting it. If the temperature becomes high enough, rocks can melt completely to form magma. When magma or lava cools and crystallises, igneous rock forms.",
        ),
        t(
          "Uplift can bring buried rocks back to the surface, where weathering and erosion begin the cycle again. No rock stays the same forever.",
        ),
      ],
    },
    {
      id: "cycle-timescales",
      heading: "Fast and slow changes",
      body: [
        t(
          "Some parts of the rock cycle happen quickly. A volcanic eruption can produce new igneous rock in days or weeks. A landslide can erode and deposit sediment in minutes.",
        ),
        t(
          "Other parts are extremely slow. It can take millions of years for sediments to be buried, compacted and cemented into sedimentary rock. Metamorphic rocks may remain deep underground for tens of millions of years before being uplifted and exposed.",
        ),
      ],
    },
  ],
  practice: [
    {
      id: "cycle-p1",
      type: "mcq",
      prompt: [t("What are the three main types of rock?")],
      explanation: [
        t(
          "The three main types of rock are igneous, sedimentary and metamorphic. Each forms through different processes in the rock cycle.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Igneous, sedimentary and metamorphic")] },
        { id: "b", label: [t("Granite, basalt and limestone")] },
        { id: "c", label: [t("Intrusive, extrusive and foliated")] },
        { id: "d", label: [t("Crust, mantle and core")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "cycle-p2",
      type: "matching",
      prompt: [t("Match each rock-cycle process to what it produces.")],
      explanation: [
        t(
          "Cooling magma or lava forms igneous rock. Compaction and cementation form sedimentary rock. Heat and pressure form metamorphic rock. Melting forms magma.",
        ),
      ],
      xp: 15,
      pairs: [
        {
          id: "a",
          left: [t("Cooling of magma or lava")],
          right: [t("Igneous rock")],
        },
        {
          id: "b",
          left: [t("Compaction and cementation")],
          right: [t("Sedimentary rock")],
        },
        {
          id: "c",
          left: [t("Heat and pressure")],
          right: [t("Metamorphic rock")],
        },
        {
          id: "d",
          left: [t("Melting")],
          right: [t("Magma")],
        },
      ],
    },
    {
      id: "cycle-p3",
      type: "mcq",
      prompt: [
        t(
          "A sedimentary rock is buried deep beneath a mountain range. What is it most likely to become?",
        ),
      ],
      explanation: [
        t(
          "Deep burial beneath a mountain range exposes rock to intense heat and pressure, which transforms it into metamorphic rock without melting it.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Metamorphic rock")] },
        { id: "b", label: [t("Igneous rock")] },
        { id: "c", label: [t("Sedimentary rock")] },
        { id: "d", label: [t("Magma")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "cycle-p4",
      type: "shortText",
      prompt: [
        t(
          "Explain the difference between weathering and erosion in the rock cycle.",
        ),
      ],
      explanation: [
        t(
          "Weathering is the breakdown of rock while it stays in place, caused by wind, rain, temperature changes, plants and chemical reactions. Erosion is the transport of the broken pieces away from their original location by water, wind, ice or gravity.",
        ),
      ],
      xp: 15,
      accepted: [
        "breakdown in place",
        "transport",
        "weathering breaks down",
        "erosion moves",
        "erosion transports",
      ],
    },
    {
      id: "cycle-p5",
      type: "mcq",
      prompt: [
        t("Which process turns loose sediment into solid sedimentary rock?"),
      ],
      explanation: [
        t(
          "Compaction squeezes sediment grains closer together as more layers pile on top. Cementation fills the spaces between grains with new minerals, gluing the sediment into solid rock.",
        ),
      ],
      xp: 10,
      options: [
        {
          id: "a",
          label: [t("Compaction and cementation")],
        },
        { id: "b", label: [t("Melting and cooling")] },
        { id: "c", label: [t("Heat and pressure")] },
        { id: "d", label: [t("Uplift and weathering")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "cycle-p6",
      type: "fillInTheBlank",
      prompt: [t("Complete the sentence about the rock cycle.")],
      template: [
        t(
          "When any type of rock is heated enough to melt completely, it becomes ___.",
        ),
      ],
      explanation: [
        t(
          "Melting turns solid rock into molten magma. If this magma later cools and crystallises, it will form igneous rock.",
        ),
      ],
      xp: 10,
      accepted: ["magma"],
    },
    {
      id: "cycle-p7",
      type: "mcq",
      prompt: [t("Which statement about the rock cycle is true?")],
      explanation: [
        t(
          "Rocks can change from one type to another and can be recycled many times. They can change at the surface through weathering and erosion, or deep underground through heat and pressure.",
        ),
      ],
      xp: 10,
      options: [
        {
          id: "a",
          label: [t("Rocks can change from one type to another")],
        },
        {
          id: "b",
          label: [t("Once a rock changes, it can never change again")],
        },
        {
          id: "c",
          label: [t("Rocks only change when exposed at the surface")],
        },
        {
          id: "d",
          label: [t("The rock cycle only affects sedimentary rocks")],
        },
      ],
      correctOptionId: "a",
    },
    {
      id: "cycle-p8",
      type: "shortText",
      prompt: [t("Why does uplift matter in the rock cycle?")],
      explanation: [
        t(
          "Uplift brings rocks that formed deep underground back up to the surface. Once exposed, they can be weathered and eroded, starting the rock cycle again and allowing the materials to be recycled.",
        ),
      ],
      xp: 15,
      accepted: [
        "brings rocks to the surface",
        "surface",
        "weathering",
        "erosion",
        "exposed",
      ],
    },
  ],
  mastery: [
    {
      id: "cycle-m1",
      type: "shortText",
      prompt: [
        t(
          "Describe the journey of a granite rock as it becomes a sedimentary rock and then a metamorphic rock.",
        ),
      ],
      explanation: [
        t(
          "Granite is an igneous rock. If it is exposed at the surface, weathering and erosion break it into smaller pieces called sediment. This sediment is transported, deposited in layers, and then compacted and cemented to form sedimentary rock such as sandstone. If the sedimentary rock is buried deeply and subjected to heat and pressure, it can become metamorphic rock such as quartzite.",
        ),
      ],
      xp: 20,
      accepted: [
        "weathering",
        "erosion",
        "sediment",
        "compaction",
        "cementation",
        "heat",
        "pressure",
        "metamorphic",
      ],
    },
    {
      id: "cycle-m2",
      type: "mcq",
      prompt: [
        t(
          "Which pair of processes usually takes the longest in the rock cycle?",
        ),
      ],
      explanation: [
        t(
          "Compaction and cementation of sediment into sedimentary rock, and the deep burial and metamorphism of rocks, typically take millions of years. Volcanic cooling can be much faster.",
        ),
      ],
      xp: 15,
      options: [
        {
          id: "a",
          label: [t("Compaction/cementation and metamorphism")],
        },
        { id: "b", label: [t("Melting and volcanic eruption")] },
        { id: "c", label: [t("Weathering and erosion")] },
        { id: "d", label: [t("Uplift and landslides")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "cycle-m3",
      type: "matching",
      prompt: [t("Match each process to its description.")],
      explanation: [
        t(
          "Weathering breaks rock in place. Erosion transports pieces away. Deposition drops sediment in a new location. Cementation glues grains together with minerals.",
        ),
      ],
      xp: 15,
      pairs: [
        {
          id: "a",
          left: [t("Weathering")],
          right: [t("Breaking rock down where it lies")],
        },
        {
          id: "b",
          left: [t("Erosion")],
          right: [t("Moving broken rock fragments away")],
        },
        {
          id: "c",
          left: [t("Deposition")],
          right: [t("Dropping sediment in a new place")],
        },
        {
          id: "d",
          left: [t("Cementation")],
          right: [t("Minerals gluing sediment grains together")],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Lesson 3 – Igneous rocks
// ---------------------------------------------------------------------------

const igneousRocks: Lesson = {
  id: "igneous-rocks",
  order: 3,
  title: "Igneous rocks",
  sourceRef: "3. Types of Rock: Igneous (Stile)",
  aiProvenance: {
    tool: "Claude",
    sources: [
      "Stile: 3. Types of Rock: Igneous",
      "Stile: 8SCI_ES_Cambridge_V9_Igneous_Rocks.pdf",
    ],
    role: "generated",
  },
  learnCards: [
    {
      id: "igneous-formation",
      heading: "From molten rock to solid crystals",
      figure: figIgneousTextures,
      body: [
        t(
          "Igneous rocks form from the cooling and crystallisation of magma or lava. The word igneous comes from the Latin word ignis, meaning fire. These rocks do not contain fossils or organic matter because the extreme heat destroys any remains.",
        ),
        t(
          "The size of the crystals in an igneous rock depends on how quickly the molten material cooled. Slow cooling allows large crystals to grow, while rapid cooling produces tiny crystals or even glassy rock with no crystals at all.",
        ),
      ],
    },
    {
      id: "igneous-types",
      heading: "Intrusive and extrusive igneous rocks",
      body: [
        t(
          "Intrusive igneous rocks form when magma cools slowly beneath the Earth's surface. Because the surrounding rock insulates the magma, cooling takes thousands to millions of years. This slow cooling produces large, visible crystals. Granite and gabbro are common intrusive igneous rocks.",
        ),
        t(
          "Extrusive igneous rocks form when lava erupts onto the surface and cools quickly in contact with air or water. Rapid cooling produces fine-grained or glassy rocks. Basalt, pumice and obsidian are examples of extrusive igneous rocks.",
        ),
        t(
          "Pumice is so full of gas bubbles that it can float on water. Obsidian cools so rapidly that it forms a smooth, glassy volcanic glass rather than crystalline rock.",
        ),
      ],
    },
    {
      id: "igneous-examples",
      heading: "Common igneous rocks",
      body: [
        t(
          "Granite is a coarse-grained intrusive rock often used for kitchen benchtops and buildings because it is hard and attractive. Gabbro is a dark, coarse-grained intrusive rock made mostly of iron- and magnesium-rich minerals.",
        ),
        t(
          "Basalt is the most common extrusive igneous rock. Much of the ocean floor is made of basalt. It is also the rock that makes up volcanic islands such as Hawaii.",
        ),
      ],
    },
  ],
  practice: [
    {
      id: "igneous-p1",
      type: "mcq",
      prompt: [t("What determines the crystal size in an igneous rock?")],
      explanation: [
        t(
          "Crystal size in igneous rocks is determined by cooling rate. Slow cooling deep underground produces large crystals; rapid cooling at the surface produces small crystals or glassy rock.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("How quickly the magma or lava cooled")] },
        { id: "b", label: [t("The colour of the rock")] },
        { id: "c", label: [t("How old the rock is")] },
        { id: "d", label: [t("The size of the volcano")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "igneous-p2",
      type: "mcq",
      prompt: [t("Which of these is an intrusive igneous rock?")],
      explanation: [
        t(
          "Granite is an intrusive igneous rock that forms when magma cools slowly beneath the surface, producing large visible crystals. Basalt, pumice and obsidian are extrusive.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Granite")] },
        { id: "b", label: [t("Basalt")] },
        { id: "c", label: [t("Obsidian")] },
        { id: "d", label: [t("Pumice")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "igneous-p3",
      type: "fillInTheBlank",
      prompt: [t("Complete the sentence about intrusive igneous rocks.")],
      template: [
        t(
          "Intrusive igneous rocks form when magma cools slowly ___, producing large crystals.",
        ),
      ],
      explanation: [
        t(
          "Intrusive igneous rocks form beneath the Earth's surface, where the surrounding rock insulates the magma and slows cooling. This allows large crystals to grow.",
        ),
      ],
      xp: 10,
      accepted: ["underground", "beneath the surface", "under the surface"],
    },
    {
      id: "igneous-p4",
      type: "mcq",
      prompt: [
        t("Why do extrusive igneous rocks usually have small crystals?"),
      ],
      explanation: [
        t(
          "Extrusive igneous rocks form when lava cools quickly at the surface. There is not enough time for large crystals to grow before the rock solidifies.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("They cool quickly at the surface")] },
        { id: "b", label: [t("They are very old")] },
        { id: "c", label: [t("They form under high pressure")] },
        { id: "d", label: [t("They contain a lot of water")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "igneous-p5",
      type: "matching",
      prompt: [t("Match each igneous rock to its description.")],
      explanation: [
        t(
          "Granite is coarse-grained intrusive rock. Basalt is fine-grained extrusive rock from lava flows. Obsidian is volcanic glass. Pumice is frothy volcanic rock full of gas bubbles.",
        ),
      ],
      xp: 15,
      pairs: [
        {
          id: "a",
          left: [t("Granite")],
          right: [t("Coarse-grained intrusive rock with large crystals")],
        },
        {
          id: "b",
          left: [t("Basalt")],
          right: [t("Fine-grained extrusive rock common in ocean crust")],
        },
        {
          id: "c",
          left: [t("Obsidian")],
          right: [t("Glassy volcanic rock")],
        },
        {
          id: "d",
          left: [t("Pumice")],
          right: [t("Frothy rock that can float on water")],
        },
      ],
    },
    {
      id: "igneous-p6",
      type: "shortText",
      prompt: [
        t(
          "Diorite cools slowly underground; basalt cools quickly on the surface. Which has larger crystals and why?",
        ),
      ],
      explanation: [
        t(
          "Diorite has larger crystals because it cools slowly underground. Slow cooling gives mineral grains time to grow. Basalt cools quickly at the surface, so its crystals are small or even too tiny to see.",
        ),
      ],
      xp: 15,
      accepted: ["diorite", "slow cooling", "large crystals", "underground"],
    },
    {
      id: "igneous-p7",
      type: "mcq",
      prompt: [t("Why are fossils never found in igneous rocks?")],
      explanation: [
        t(
          "Igneous rocks form from molten material at very high temperatures. Any organic remains would be burned or destroyed by the heat, so fossils cannot survive.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("The extreme heat destroys organic remains")] },
        { id: "b", label: [t("They form too quickly for fossils to form")] },
        { id: "c", label: [t("Fossils only form underwater")] },
        { id: "d", label: [t("Igneous rocks are too soft")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "igneous-p8",
      type: "mcq",
      prompt: [
        t(
          "Which pair of rocks both form from magma cooling beneath the surface?",
        ),
      ],
      explanation: [
        t(
          "Granite and gabbro are both intrusive igneous rocks because they form from magma that cools slowly beneath the Earth's surface. Basalt and obsidian are extrusive.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Granite and gabbro")] },
        { id: "b", label: [t("Basalt and obsidian")] },
        { id: "c", label: [t("Pumice and basalt")] },
        { id: "d", label: [t("Obsidian and pumice")] },
      ],
      correctOptionId: "a",
    },
  ],
  mastery: [
    {
      id: "igneous-m1",
      type: "shortText",
      prompt: [
        t(
          "Explain how the same magma can produce two very different igneous rocks depending on where it cools.",
        ),
      ],
      explanation: [
        t(
          "If magma cools slowly deep underground, it forms intrusive igneous rock with large crystals, such as granite. If magma reaches the surface as lava and cools quickly, it forms extrusive igneous rock with small crystals or a glassy texture, such as basalt or obsidian. The same chemical composition can therefore produce different rocks depending on cooling rate and location.",
        ),
      ],
      xp: 20,
      accepted: [
        "cooling rate",
        "underground",
        "surface",
        "crystals",
        "intrusive",
        "extrusive",
      ],
    },
    {
      id: "igneous-m2",
      type: "mcq",
      prompt: [
        t(
          "A geologist finds a rock with large interlocking crystals of quartz, feldspar and mica. Where did it most likely form?",
        ),
      ],
      explanation: [
        t(
          "Large interlocking crystals indicate slow cooling deep underground, which is characteristic of intrusive igneous rocks such as granite. Extrusive rocks would have small or glassy crystals.",
        ),
      ],
      xp: 15,
      options: [
        { id: "a", label: [t("Deep underground from slow-cooling magma")] },
        { id: "b", label: [t("On the surface from fast-cooling lava")] },
        { id: "c", label: [t("From compacted sediment on a riverbed")] },
        { id: "d", label: [t("From limestone altered by heat and pressure")] },
      ],
      correctOptionId: "a",
    },
  ],
};

// ---------------------------------------------------------------------------
// Lesson 4 – Sedimentary rocks
// ---------------------------------------------------------------------------

const sedimentaryRocks: Lesson = {
  id: "sedimentary-rocks",
  order: 4,
  title: "Sedimentary rocks",
  sourceRef: "4. Types of Rock: Sedimentary (Stile)",
  aiProvenance: {
    tool: "Claude",
    sources: [
      "Stile: 4. Types of Rock: Sedimentary",
      "Stile: 8SCI_ES_Cambridge_V9_Sedimentary_Rocks.pdf",
    ],
    role: "generated",
  },
  learnCards: [
    {
      id: "sedimentary-formation",
      heading: "From sediment to solid rock",
      figure: figSedimentaryLayers,
      body: [
        t(
          "Sedimentary rocks form at or near the Earth's surface. They are built from pieces of older rocks, minerals and organic material that have been weathered, eroded, transported and deposited in layers.",
        ),
        t(
          "Weathering breaks rock down in place. Erosion moves the broken pieces away. Wind, rivers, glaciers and ocean currents transport sediment and drop it in new locations in a process called deposition. Over time, the layers are compacted by the weight of overlying material and cemented together by minerals that grow between the grains.",
        ),
      ],
    },
    {
      id: "sedimentary-types",
      heading: "Three types of sedimentary rock",
      body: [
        t(
          "Clastic sedimentary rocks are made from fragments of pre-existing rocks. Conglomerate contains rounded pebbles, sandstone contains sand-sized grains, siltstone contains silt, and mudstone contains very fine mud particles.",
        ),
        t(
          "Chemical sedimentary rocks form when dissolved minerals precipitate out of water. Rock salt forms when seawater evaporates, leaving salt crystals behind. Limestone can also form chemically from calcium carbonate precipitating in warm, shallow seas.",
        ),
        t(
          "Organic sedimentary rocks form from the remains of living things. Limestone can form from shells and coral fragments, while coal forms from buried plant material compressed over millions of years.",
        ),
      ],
    },
    {
      id: "sedimentary-features",
      heading: "Clues in the layers",
      body: [
        t(
          "Sedimentary rocks often contain fossils because they form in conditions where dead organisms can be buried and preserved. They also show layering, or bedding, which records changes in the environment over time.",
        ),
        t(
          "Geologists can read sedimentary rock layers like a history book. The size and type of sediment reveal information about ancient environments, climates and landscapes.",
        ),
      ],
    },
  ],
  practice: [
    {
      id: "sedimentary-p1",
      type: "mcq",
      prompt: [t("What is the difference between weathering and erosion?")],
      explanation: [
        t(
          "Weathering is the breakdown of rock in place, while erosion is the transport of the broken pieces away from their original location.",
        ),
      ],
      xp: 10,
      options: [
        {
          id: "a",
          label: [t("Weathering breaks rock down; erosion moves pieces away")],
        },
        {
          id: "b",
          label: [t("Weathering is sudden; erosion is gradual")],
        },
        {
          id: "c",
          label: [
            t("Weathering occurs underground; erosion occurs at the surface"),
          ],
        },
        {
          id: "d",
          label: [t("Weathering and erosion are the same process")],
        },
      ],
      correctOptionId: "a",
    },
    {
      id: "sedimentary-p2",
      type: "mcq",
      prompt: [t("Which process turns loose sediment into sedimentary rock?")],
      explanation: [
        t(
          "Compaction squeezes sediment grains together under the weight of overlying layers. Cementation glues the grains together with minerals that crystallise in the pore spaces.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Compaction and cementation")] },
        { id: "b", label: [t("Melting and cooling")] },
        { id: "c", label: [t("Heat and pressure")] },
        { id: "d", label: [t("Evaporation and precipitation")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "sedimentary-p3",
      type: "fillInTheBlank",
      prompt: [t("Complete the sentence about fossils.")],
      template: [
        t(
          "Sedimentary rocks are the only major rock type that commonly contains ___.",
        ),
      ],
      explanation: [
        t(
          "Sedimentary rocks commonly contain fossils because they form at or near the surface where organisms can be buried and preserved. The heat of igneous rock formation destroys fossils, and the heat and pressure of metamorphism usually destroy them too.",
        ),
      ],
      xp: 10,
      accepted: ["fossils"],
    },
    {
      id: "sedimentary-p4",
      type: "matching",
      prompt: [t("Match each sedimentary rock to how it formed.")],
      explanation: [
        t(
          "Conglomerate forms from rounded pebbles cemented together. Sandstone forms from sand grains. Coal forms from compressed plant remains. Limestone can form from shells or chemical precipitation.",
        ),
      ],
      xp: 15,
      pairs: [
        {
          id: "a",
          left: [t("Conglomerate")],
          right: [t("Cemented rounded pebbles")],
        },
        {
          id: "b",
          left: [t("Sandstone")],
          right: [t("Compacted sand grains")],
        },
        {
          id: "c",
          left: [t("Coal")],
          right: [t("Compressed plant remains")],
        },
        {
          id: "d",
          left: [t("Limestone")],
          right: [t("Shells, coral or chemically precipitated calcite")],
        },
      ],
    },
    {
      id: "sedimentary-p5",
      type: "mcq",
      prompt: [
        t(
          "A mining company discovers a large coal seam underground. What does this suggest about the ancient environment?",
        ),
      ],
      explanation: [
        t(
          "Coal forms from buried plant material in swampy environments where plants grew and were buried before they could fully decay. Finding coal suggests the area was once covered by lush vegetation such as a forest or swamp.",
        ),
      ],
      xp: 10,
      options: [
        {
          id: "a",
          label: [
            t(
              "The area was once covered by vegetation such as a forest or swamp",
            ),
          ],
        },
        { id: "b", label: [t("The area was once a desert")] },
        { id: "c", label: [t("The area was once an active volcano")] },
        { id: "d", label: [t("The area was once covered by ice")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "sedimentary-p6",
      type: "shortText",
      prompt: [
        t(
          "Describe how a piece of granite on a mountainside could become part of a sandstone sedimentary rock.",
        ),
      ],
      explanation: [
        t(
          "The granite is exposed and weathered, breaking into smaller pieces. Erosion transports these fragments downhill. Rivers deposit the sand-sized grains in a riverbed, lake or sea. Over time, more layers bury the sediment, compacting it and cementing the grains together to form sandstone.",
        ),
      ],
      xp: 15,
      accepted: [
        "weathering",
        "erosion",
        "transport",
        "deposit",
        "compaction",
        "cementation",
      ],
    },
    {
      id: "sedimentary-p7",
      type: "mcq",
      prompt: [t("Which of these is a chemical sedimentary rock?")],
      explanation: [
        t(
          "Rock salt is a chemical sedimentary rock that forms when seawater or salt lakes evaporate, leaving dissolved salt behind. Sandstone and conglomerate are clastic; coal is organic.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Rock salt")] },
        { id: "b", label: [t("Sandstone")] },
        { id: "c", label: [t("Conglomerate")] },
        { id: "d", label: [t("Coal")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "sedimentary-p8",
      type: "mcq",
      prompt: [t("Why do sedimentary rocks often form in layers?")],
      explanation: [
        t(
          "Sediment is deposited in horizontal layers over time. Each layer represents a particular episode of deposition, and different layers may contain different sediment types depending on the environment.",
        ),
      ],
      xp: 10,
      options: [
        {
          id: "a",
          label: [t("Sediment is deposited in horizontal layers over time")],
        },
        { id: "b", label: [t("Heat and pressure squeeze rock into layers")] },
        { id: "c", label: [t("Magma cools in flat sheets")] },
        { id: "d", label: [t("Crystals grow in parallel lines")] },
      ],
      correctOptionId: "a",
    },
  ],
  mastery: [
    {
      id: "sedimentary-m1",
      type: "shortText",
      prompt: [
        t(
          "Why are sedimentary rocks important for understanding Earth's history?",
        ),
      ],
      explanation: [
        t(
          "Sedimentary rocks preserve fossils and form in layers that record past environments. By studying them, geologists can reconstruct ancient climates, landscapes, ecosystems and even past life forms.",
        ),
      ],
      xp: 20,
      accepted: [
        "fossils",
        "layers",
        "history",
        "past environments",
        "climate",
      ],
    },
    {
      id: "sedimentary-m2",
      type: "matching",
      prompt: [t("Match each sedimentary rock type category to its origin.")],
      explanation: [
        t(
          "Clastic rocks form from rock fragments. Chemical rocks form from dissolved minerals precipitating from water. Organic rocks form from the remains of organisms.",
        ),
      ],
      xp: 15,
      pairs: [
        {
          id: "a",
          left: [t("Clastic")],
          right: [t("Fragments of pre-existing rock")],
        },
        {
          id: "b",
          left: [t("Chemical")],
          right: [t("Minerals precipitated from water")],
        },
        {
          id: "c",
          left: [t("Organic")],
          right: [t("Remains of plants or animals")],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Lesson 5 – Metamorphic rocks
// ---------------------------------------------------------------------------

const metamorphicRocks: Lesson = {
  id: "metamorphic-rocks",
  order: 5,
  title: "Metamorphic rocks",
  sourceRef: "5. Types of Rock: Metamorphic (Stile)",
  aiProvenance: {
    tool: "Claude",
    sources: [
      "Stile: 5. Types of Rock: Metamorphic",
      "Stile: 8SCI_ES_Cambridge_V9_Metamorphic_Rocks.pdf",
    ],
    role: "generated",
  },
  learnCards: [
    {
      id: "metamorphic-formation",
      heading: "Rocks transformed by heat and pressure",
      figure: figMetamorphicExamples,
      body: [
        t(
          "Metamorphic rocks form when existing rocks are changed by heat and pressure deep below the Earth's surface. The name comes from Greek words meaning 'change form'. The rock does not melt completely; instead, its minerals recrystallise into new forms that are stable under the new conditions.",
        ),
        t(
          "The original rock is called the parent rock or protolith. It can be sedimentary, igneous or even another metamorphic rock. Common metamorphic rocks include marble from limestone, slate from shale, and quartzite from sandstone.",
        ),
      ],
    },
    {
      id: "metamorphic-types",
      heading: "Contact and regional metamorphism",
      body: [
        t(
          "Contact metamorphism happens when magma intrudes into nearby solid rock. The heat from the magma bakes the surrounding country rock, changing its mineral composition. This usually affects a small area close to the magma body.",
        ),
        t(
          "Regional metamorphism happens over large areas, usually where tectonic plates collide to form mountain ranges. Rocks are squeezed and heated over vast regions, producing metamorphic rocks such as slate, schist and gneiss.",
        ),
      ],
    },
    {
      id: "metamorphic-texture",
      heading: "Foliated and non-foliated",
      body: [
        t(
          "Foliated metamorphic rocks have bands or layers caused by minerals being squeezed into parallel alignment. Slate, phyllite, schist and gneiss are foliated. The higher the grade of metamorphism, the coarser the foliation becomes.",
        ),
        t(
          "Non-foliated metamorphic rocks do not show layering. They form when pressure is equal in all directions or when the parent rock has few platy minerals. Marble and quartzite are common non-foliated metamorphic rocks.",
        ),
      ],
    },
  ],
  practice: [
    {
      id: "metamorphic-p1",
      type: "mcq",
      prompt: [t("What two main factors form metamorphic rocks?")],
      explanation: [
        t(
          "Metamorphic rocks form when existing rocks are subjected to heat and pressure without melting. The minerals recrystallise into new forms.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Heat and pressure")] },
        { id: "b", label: [t("Wind and rain")] },
        { id: "c", label: [t("Melting and cooling")] },
        { id: "d", label: [t("Compaction and cementation")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "metamorphic-p2",
      type: "mcq",
      prompt: [t("What is the parent rock of marble?")],
      explanation: [
        t(
          "Marble forms when limestone, which is made mostly of calcite, is metamorphosed by heat and pressure. The calcite recrystallises to form the interlocking crystals characteristic of marble.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Limestone")] },
        { id: "b", label: [t("Shale")] },
        { id: "c", label: [t("Sandstone")] },
        { id: "d", label: [t("Granite")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "metamorphic-p3",
      type: "fillInTheBlank",
      prompt: [t("Complete the sentence about slate.")],
      template: [
        t(
          "Slate is a foliated metamorphic rock that forms from the parent rock called ___.",
        ),
      ],
      explanation: [
        t(
          "Slate forms from shale, a fine-grained sedimentary rock, when it is subjected to low-grade heat and pressure. The clay minerals in shale align to form the fine layers characteristic of slate.",
        ),
      ],
      xp: 10,
      accepted: ["shale"],
    },
    {
      id: "metamorphic-p4",
      type: "mcq",
      prompt: [t("Which type of metamorphism affects the largest area?")],
      explanation: [
        t(
          "Regional metamorphism occurs over large areas, typically where tectonic plates collide to form mountain ranges. Contact metamorphism affects only the rock immediately surrounding a magma intrusion.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Regional metamorphism")] },
        { id: "b", label: [t("Contact metamorphism")] },
        { id: "c", label: [t("Chemical metamorphism")] },
        { id: "d", label: [t("Surface metamorphism")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "metamorphic-p5",
      type: "mcq",
      prompt: [t("Which metamorphic rock is non-foliated?")],
      explanation: [
        t(
          "Marble is a non-foliated metamorphic rock because it forms from limestone, which has few platy minerals that could align into layers. Slate, schist and gneiss are foliated.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Marble")] },
        { id: "b", label: [t("Slate")] },
        { id: "c", label: [t("Schist")] },
        { id: "d", label: [t("Gneiss")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "metamorphic-p6",
      type: "matching",
      prompt: [t("Match each metamorphic rock to its parent rock.")],
      explanation: [
        t(
          "Marble forms from limestone. Slate forms from shale. Quartzite forms from sandstone. Gneiss can form from several parent rocks subjected to high-grade metamorphism.",
        ),
      ],
      xp: 15,
      pairs: [
        {
          id: "a",
          left: [t("Marble")],
          right: [t("Limestone")],
        },
        {
          id: "b",
          left: [t("Slate")],
          right: [t("Shale")],
        },
        {
          id: "c",
          left: [t("Quartzite")],
          right: [t("Sandstone")],
        },
        {
          id: "d",
          left: [t("Gneiss")],
          right: [t("Granite or other rocks under high heat and pressure")],
        },
      ],
    },
    {
      id: "metamorphic-p7",
      type: "shortText",
      prompt: [
        t(
          "Explain the difference between contact metamorphism and regional metamorphism.",
        ),
      ],
      explanation: [
        t(
          "Contact metamorphism happens when magma heats nearby rock, usually affecting a small area. Regional metamorphism happens over large areas where tectonic forces create heat and pressure, such as in mountain-building zones.",
        ),
      ],
      xp: 15,
      accepted: [
        "magma",
        "heat",
        "small area",
        "large area",
        "mountain",
        "tectonic",
        "pressure",
      ],
    },
    {
      id: "metamorphic-p8",
      type: "mcq",
      prompt: [
        t(
          "Why is marble valued more than its parent rock limestone for sculptures and benchtops?",
        ),
      ],
      explanation: [
        t(
          "Marble is harder and stronger than limestone because heat and pressure during metamorphism cause the calcite crystals to recrystallise into a denser, more durable structure. Marble also takes a high polish.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Marble is harder and stronger than limestone")] },
        { id: "b", label: [t("Marble is softer and easier to carve")] },
        { id: "c", label: [t("Marble forms from fossils")] },
        { id: "d", label: [t("Marble is an igneous rock")] },
      ],
      correctOptionId: "a",
    },
  ],
  mastery: [
    {
      id: "metamorphic-m1",
      type: "shortText",
      prompt: [t("Why don't metamorphic rocks melt during their formation?")],
      explanation: [
        t(
          "Metamorphic rocks form under high heat and pressure, but the temperature is not high enough to melt the rock completely. The solid minerals recrystallise into new minerals without melting.",
        ),
      ],
      xp: 20,
      accepted: [
        "not hot enough",
        "not enough heat",
        "pressure",
        "recrystallise",
        "without melting",
      ],
    },
    {
      id: "metamorphic-m2",
      type: "mcq",
      prompt: [
        t(
          "A geologist finds a rock with clear bands of light and dark minerals. What type of metamorphic rock feature is this?",
        ),
      ],
      explanation: [
        t(
          "Bands of light and dark minerals indicate foliation. This texture forms when minerals are squeezed and align perpendicular to the pressure during regional metamorphism.",
        ),
      ],
      xp: 15,
      options: [
        { id: "a", label: [t("Foliation")] },
        { id: "b", label: [t("Crystallisation")] },
        { id: "c", label: [t("Cementation")] },
        { id: "d", label: [t("Weathering")] },
      ],
      correctOptionId: "a",
    },
  ],
};

// ---------------------------------------------------------------------------
// Lesson 6 – Uses of rocks
// ---------------------------------------------------------------------------

const usesOfRocks: Lesson = {
  id: "uses-of-rocks",
  order: 6,
  title: "Uses of rocks",
  sourceRef: "6. Uses of Metamorphic Rock; 7. Uses of Sedimentary Rock (Stile)",
  aiProvenance: {
    tool: "Claude",
    sources: [
      "Stile: 6. Uses of Metamorphic Rock",
      "Stile: 7. Uses of Sedimentary Rock",
    ],
    role: "generated",
  },
  learnCards: [
    {
      id: "uses-properties",
      heading: "Properties determine uses",
      body: [
        t(
          "The way a rock forms gives it particular properties, and those properties determine what humans use it for. Hardness, durability, grain size, ability to be polished, resistance to weathering and appearance all influence a rock's suitability for different purposes.",
        ),
        t(
          "For example, slate splits easily into thin sheets along its foliation, making it ideal for roof tiles. Marble can be polished to a beautiful finish and is hard enough for benchtops, but it can be damaged by acids.",
        ),
      ],
    },
    {
      id: "uses-examples",
      heading: "Rocks in everyday life",
      body: [
        t(
          "Sandstone is rough, durable and slip-resistant, so it is often used for outdoor paving. Limestone is used to make cement and in agriculture to reduce soil acidity. Granite is hard and attractive, so it is popular for buildings and kitchen surfaces.",
        ),
        t(
          "Coal is burned as a fossil fuel to generate electricity. Quartzite is extremely hard and used as a railway ballast and in some road surfaces. Slate is used for roofs and blackboards because it splits into flat sheets.",
        ),
      ],
    },
    {
      id: "uses-aboriginal",
      heading: "Stone tools and Indigenous knowledge",
      body: [
        t(
          "Aboriginal and Torres Strait Islander peoples have crafted stone tools for thousands of years. Understanding geology, biology, chemistry and physics helps create tools that are fit for purpose.",
        ),
        t(
          "Different rocks have different fracture properties. Basalt, an extrusive igneous rock, can be flaked to make sharp cutting edges. Slate can be ground to make food-processing tools. The right rock for a tool depends on its hardness, fracture pattern and durability.",
        ),
      ],
    },
  ],
  practice: [
    {
      id: "uses-p1",
      type: "mcq",
      prompt: [t("Why is slate commonly used for roof tiles?")],
      explanation: [
        t(
          "Slate has foliation that allows it to split easily into thin, flat sheets. It is also durable and weather-resistant, making it ideal for roofing.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("It splits easily into thin, flat sheets")] },
        { id: "b", label: [t("It melts easily in sunlight")] },
        { id: "c", label: [t("It is very soft")] },
        { id: "d", label: [t("It floats on water")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "uses-p2",
      type: "mcq",
      prompt: [t("Which property makes sandstone good for outdoor flooring?")],
      explanation: [
        t(
          "Sandstone is rough and slip-resistant, and it weathers well outdoors. These properties make it a good choice for outdoor paving and flooring.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Rough and slip-resistant")] },
        { id: "b", label: [t("Soft and easy to scratch")] },
        { id: "c", label: [t("Transparent")] },
        { id: "d", label: [t("Reacts strongly with acid")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "uses-p3",
      type: "matching",
      prompt: [t("Match each rock to a common use.")],
      explanation: [
        t(
          "Marble is used for sculptures and benchtops because it is hard and polishes well. Granite is used for buildings and benchtops. Coal is burned as fuel. Limestone is used to make cement.",
        ),
      ],
      xp: 15,
      pairs: [
        {
          id: "a",
          left: [t("Marble")],
          right: [t("Sculptures and benchtops")],
        },
        {
          id: "b",
          left: [t("Granite")],
          right: [t("Building facades and kitchen surfaces")],
        },
        {
          id: "c",
          left: [t("Coal")],
          right: [t("Burned as a fossil fuel")],
        },
        {
          id: "d",
          left: [t("Limestone")],
          right: [t("Making cement")],
        },
      ],
    },
    {
      id: "uses-p4",
      type: "shortText",
      prompt: [
        t(
          "Why is marble suitable for sculptures but not ideal for kitchen benchtops where acidic foods are common?",
        ),
      ],
      explanation: [
        t(
          "Marble is hard, takes a high polish and can be carved with fine detail, making it excellent for sculptures. However, marble is made of calcite, which reacts with acids such as lemon juice and vinegar. This means it can be etched or damaged by acidic spills, making it less ideal for kitchens than granite.",
        ),
      ],
      xp: 15,
      accepted: ["acid", "calcite", "reactive", "polish", "hard", "carve"],
    },
    {
      id: "uses-p5",
      type: "mcq",
      prompt: [
        t("Which rock would be most suitable for making a sharp cutting tool?"),
      ],
      explanation: [
        t(
          "Basalt is a hard extrusive igneous rock that can be flaked to produce sharp edges. It has been used by many cultures, including Aboriginal peoples, to make cutting and scraping tools.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Basalt")] },
        { id: "b", label: [t("Chalk")] },
        { id: "c", label: [t("Talc")] },
        { id: "d", label: [t("Mudstone")] },
      ],
      correctOptionId: "a",
    },
    {
      id: "uses-p6",
      type: "fillInTheBlank",
      prompt: [t("Complete the sentence about choosing a rock for a purpose.")],
      template: [
        t(
          "When choosing a rock for a particular use, you must consider its properties, such as hardness, durability, grain size and resistance to ___.",
        ),
      ],
      explanation: [
        t(
          "Different uses require different properties. Outdoor rocks need to resist weathering. Kitchen surfaces need hardness. Roofing tiles need to split into flat sheets. Sculptures need to be carved and polished.",
        ),
      ],
      xp: 10,
      accepted: ["weathering", "acid", "heat", "pressure", "erosion"],
    },
    {
      id: "uses-p7",
      type: "shortText",
      prompt: [
        t("Suggest one reason why quartzite might be used as railway ballast."),
      ],
      explanation: [
        t(
          "Quartzite is an extremely hard metamorphic rock formed from sandstone. Its hardness and durability make it resistant to being crushed under the weight of trains, so it is useful as railway ballast.",
        ),
      ],
      xp: 15,
      accepted: ["hard", "durable", "strong", "resistant", "crushing"],
    },
    {
      id: "uses-p8",
      type: "mcq",
      prompt: [
        t(
          "A builder wants a rock that is attractive, hard and does not react with acids. Which is the best choice?",
        ),
      ],
      explanation: [
        t(
          "Granite is hard, attractive and does not react with acids, making it ideal for kitchen benchtops and building facades. Marble reacts with acids, and chalk and mudstone are too soft.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Granite")] },
        { id: "b", label: [t("Marble")] },
        { id: "c", label: [t("Chalk")] },
        { id: "d", label: [t("Mudstone")] },
      ],
      correctOptionId: "a",
    },
  ],
  mastery: [
    {
      id: "uses-m1",
      type: "shortText",
      prompt: [
        t(
          "Explain how the formation of marble makes it suitable for sculptures.",
        ),
      ],
      explanation: [
        t(
          "Marble forms when limestone is metamorphosed by heat and pressure. The calcite recrystallises into interlocking crystals, making the rock harder and stronger than limestone while still soft enough to carve. Marble also takes a high polish, giving sculptures a smooth, attractive finish.",
        ),
      ],
      xp: 20,
      accepted: [
        "harder",
        "stronger",
        "carve",
        "polish",
        "metamorphism",
        "crystals",
      ],
    },
    {
      id: "uses-m2",
      type: "mcq",
      prompt: [
        t(
          "Which rock property is most important when choosing a material for an outdoor statue exposed to wind and rain?",
        ),
      ],
      explanation: [
        t(
          "For an outdoor statue, resistance to weathering is crucial because wind, rain and temperature changes will attack the rock over time. Hardness and durability are also important, but weather resistance is the key property.",
        ),
      ],
      xp: 15,
      options: [
        { id: "a", label: [t("Resistance to weathering")] },
        { id: "b", label: [t("Ability to float on water")] },
        { id: "c", label: [t("Reaction with acid")] },
        { id: "d", label: [t("Ability to split into sheets")] },
      ],
      correctOptionId: "a",
    },
  ],
};

// ---------------------------------------------------------------------------
// Boss challenge questions
// ---------------------------------------------------------------------------

const challengeQuestions: Question[] = [
  {
    id: "rocks-boss-1",
    type: "mcq",
    prompt: [t("Which layer of the Earth is liquid?")],
    explanation: [
      t(
        "The outer core is a layer of liquid iron and nickel. The inner core is solid, and the mantle behaves like a very thick solid over short timescales.",
      ),
    ],
    xp: 20,
    options: [
      { id: "a", label: [t("Outer core")] },
      { id: "b", label: [t("Inner core")] },
      { id: "c", label: [t("Mantle")] },
      { id: "d", label: [t("Crust")] },
    ],
    correctOptionId: "a",
  },
  {
    id: "rocks-boss-2",
    type: "matching",
    prompt: [t("Match each rock to the process that forms it.")],
    explanation: [
      t(
        "Igneous rocks form from cooling magma or lava. Sedimentary rocks form from compaction and cementation of sediment. Metamorphic rocks form from heat and pressure acting on existing rock.",
      ),
    ],
    xp: 25,
    pairs: [
      {
        id: "a",
        left: [t("Igneous")],
        right: [t("Cooling and crystallisation of magma or lava")],
      },
      {
        id: "b",
        left: [t("Sedimentary")],
        right: [t("Compaction and cementation of sediment")],
      },
      {
        id: "c",
        left: [t("Metamorphic")],
        right: [t("Heat and pressure without melting")],
      },
    ],
  },
  {
    id: "rocks-boss-3",
    type: "shortText",
    prompt: [
      t(
        "A rock has large visible crystals and is found deep underground. What type of rock is it, and how did it form?",
      ),
    ],
    explanation: [
      t(
        "The rock is intrusive igneous rock. It formed when magma cooled slowly beneath the Earth's surface, allowing large crystals to grow. Granite is a common example.",
      ),
    ],
    xp: 25,
    accepted: [
      "intrusive igneous",
      "slow cooling",
      "underground",
      "large crystals",
      "granite",
    ],
  },
  {
    id: "rocks-boss-4",
    type: "mcq",
    prompt: [
      t(
        "Which sequence correctly describes the formation of most sedimentary rock?",
      ),
    ],
    explanation: [
      t(
        "Sedimentary rock typically forms through weathering and erosion producing sediment, deposition of that sediment in layers, and then compaction and cementation turning it into solid rock.",
      ),
    ],
    xp: 20,
    options: [
      {
        id: "a",
        label: [t("Weathering/erosion → deposition → compaction/cementation")],
      },
      {
        id: "b",
        label: [t("Melting → cooling → weathering")],
      },
      {
        id: "c",
        label: [t("Heat → pressure → melting")],
      },
      {
        id: "d",
        label: [t("Crystallisation → uplift → erosion")],
      },
    ],
    correctOptionId: "a",
  },
  {
    id: "rocks-boss-5",
    type: "mcq",
    prompt: [
      t(
        "Marble is often used for sculptures. Which pair of properties best explains this?",
      ),
    ],
    explanation: [
      t(
        "Marble is hard enough to be durable but can still be carved with fine detail. It also takes a high polish, giving sculptures an attractive finish.",
      ),
    ],
    xp: 25,
    options: [
      {
        id: "a",
        label: [t("Hard and polishable")],
      },
      {
        id: "b",
        label: [t("Soft and reactive with acid")],
      },
      {
        id: "c",
        label: [t("Foliated and slippery")],
      },
      {
        id: "d",
        label: [t("Porous and lightweight")],
      },
    ],
    correctOptionId: "a",
  },
  {
    id: "rocks-boss-6",
    type: "fillInTheBlank",
    prompt: [t("Complete the sentence about the rock cycle.")],
    template: [
      t(
        "Any type of rock — igneous, sedimentary or metamorphic — can be changed into another type through the processes of the ___.",
      ),
    ],
    explanation: [
      t(
        "The rock cycle is the continuous process by which rocks are formed, broken down and transformed into other types of rocks. No rock type is permanent.",
      ),
    ],
    xp: 20,
    accepted: ["rock cycle"],
  },
];

// ---------------------------------------------------------------------------
// Track export
// ---------------------------------------------------------------------------

/** The Year 8 Earth Science - Rocks track. */
export const earthScienceRocksTrack: Track = {
  id: "earth-science-rocks",
  subjectId: "science",
  title: "Earth Science - Rocks (Year 8)",
  description:
    "Explore the layers of the Earth, the rock cycle, igneous, sedimentary and metamorphic rocks, and how rock properties determine their uses.",
  lessons: [
    layersOfEarth,
    rockCycle,
    igneousRocks,
    sedimentaryRocks,
    metamorphicRocks,
    usesOfRocks,
  ],
  challenge: {
    id: "earth-science-rocks-boss",
    title: "Boss challenge: Earth Science - Rocks",
    sourceRef:
      "2026 8 Science - Earth Science Stile Unit, The Gap State High School",
    questions: challengeQuestions,
    bonusXp: 125,
    passBadgeId: "boss-earth-science-rocks",
    aiProvenance: {
      tool: "Claude",
      sources: ["Stile: 2026 8 Science - Earth Science - Rocks (all lessons)"],
      role: "generated",
    },
  },
};
