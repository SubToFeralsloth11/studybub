/**
 * The Black Death track content (Year 8 HSS, Term 1).
 *
 * Covers the arrival of the Black Death in medieval Europe, its short-term
 * effects, and its long-term consequences for feudal society. Based on the
 * 2026 8 HSS T1 Black Death Stile unit at The Gap State High School,
 * enriched with standard Year 8 medieval history references.
 *
 * External references:
 * - Stile: 3.1 The Black Death Arrives (Cambridge 8.15; Silk Road video)
 * - Stile: L11 Short Term Effects of the Black Plague
 * - Stile: L12 Long Term Effects of the Black Plague
 * - Stile: Medieval Europe WebQuest (feudal system context)
 * - Kahoot: Medieval Europe Social Structure
 *
 * @author John Grimes
 * @module content/tracks/blackDeath
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

const figBlackDeathSpread: Figure = {
  id: "black-death-spread-map",
  alt: "Map of Eurasia showing the spread of the Black Death (1346–1353). Arrows trace the plague from its origin in Central Asia, westward along Silk Road trade routes, across the Black Sea to Constantinople, then through the Mediterranean and into Europe by ship. Major cities Constantinople, Genoa, Venice, Paris and London are marked.",
  textFallback:
    "[Map: Spread of the Black Death 1346–1353 — from Central Asia along Silk Road trade routes, across the Black Sea to Europe by ship, reaching Constantinople, Genoa, Venice, Paris and London]",
};

const figFeudalPyramid: Figure = {
  id: "feudal-system-pyramid",
  alt: "A pyramid showing the medieval feudal system. King at the top, then nobles/barons, then knights, and peasants/serfs at the bottom. Arrows show land granted downwards and loyalty/service given upwards.",
  textFallback:
    "[Diagram: Feudal system pyramid — King at top, Nobles, Knights, Peasants/serfs at bottom; land flows down, loyalty and service flow up]",
};

const figPlagueTypes: Figure = {
  id: "plague-types",
  alt: "Diagram of the three types of plague. Bubonic: flea bite causes swollen buboes. Septicaemic: bacteria enter the bloodstream. Pneumonic: bacteria infect the lungs and spread by coughing. All are caused by the Yersinia pestis bacterium carried by fleas on black rats.",
  textFallback:
    "[Diagram: Three plague types — Bubonic (swollen buboes from flea bites), Septicaemic (blood infection), Pneumonic (lungs, spread by coughing); all caused by Yersinia pestis bacteria in rat fleas]",
};

export const blackDeathFigures: Figure[] = [
  figBlackDeathSpread,
  figFeudalPyramid,
  figPlagueTypes,
];

// ---------------------------------------------------------------------------
// Lesson 1 – The Black Death arrives
// ---------------------------------------------------------------------------

const blackDeathArrivesLesson: Lesson = {
  id: "black-death-arrives",
  order: 1,
  title: "The Black Death arrives",
  sourceRef: "3.1 The Black Death Arrives (Stile)",
  aiProvenance: {
    tool: "Claude",
    sources: [
      "Stile: 3.1 The Black Death Arrives",
      "Cambridge 8.15 The Black Death",
      "YouTube: Silk Road - History for Beginners",
    ],
    role: "generated",
  },
  learnCards: [
    {
      id: "bd-pandemic",
      heading: "Key idea: a pandemic sweeps the medieval world",
      body: [
        t(
          "A pandemic is an outbreak of disease that spreads across many countries or continents, affecting huge numbers of people. The Black Death was the deadliest pandemic in recorded history — a plague that tore through Asia, the Middle East and Europe in the mid-1300s.",
        ),
        t(
          "It became known as the 'Black Death' because of the dark black or purple patches (called buboes) that appeared on sufferers' skin. From the time symptoms appeared, most victims died within a week, and many within just a few days. The disease was terrifying because it killed so quickly and no one understood what caused it.",
        ),
      ],
    },
    {
      id: "bd-origin",
      heading: "Where it came from: the Silk Road",
      body: [
        t(
          "Historians believe the plague began somewhere in Central or East Asia. From there it travelled westward along the Silk Road — the vast network of trade routes that linked China and Central Asia to the Middle East and the Mediterranean. Merchants, soldiers and travellers carried the disease with them, often without knowing it.",
        ),
        t(
          "The plague reached the Crimean peninsula on the Black Sea by 1346. There, Italian merchants from the city of Genoa were trading. As the disease broke out, they fled to their ships — carrying the rats and fleas that spread the plague with them. By 1347 the first infected ships had reached Italy, and from there the Black Death raced across Europe.",
        ),
      ],
      figure: figBlackDeathSpread,
    },
    {
      id: "bd-three-types",
      heading: "Three forms of the plague",
      body: [
        t(
          "The Black Death was caused by a bacterium now called Yersinia pestis, carried in the stomachs of fleas that lived on black rats. When the fleas bit humans, the bacteria entered the body. There were three main forms:",
        ),
        t(
          "Bubonic plague — the most common form, spread by flea bites. It caused painful, swollen lymph nodes called buboes in the groin, neck and armpits.",
        ),
        t(
          "Septicaemic plague — bacteria entered the bloodstream directly, causing rapid death and dark skin discolouration.",
        ),
        t(
          "Pneumonic plague — the most contagious and deadliest form. The bacteria attacked the lungs and spread from person to person through coughs and sneezes, like a modern flu.",
        ),
      ],
      figure: figPlagueTypes,
    },
  ],
  practice: [
    {
      id: "bd-p1",
      type: "fillInTheBlank",
      prompt: [
        t(
          "Complete the sentence: A disease outbreak that spreads across many countries or continents is called a ___.",
        ),
      ],
      explanation: [
        t(
          "A pandemic is a disease that spreads worldwide or across many regions. An epidemic affects a smaller region; the Black Death was a pandemic because it reached Asia, the Middle East and Europe.",
        ),
      ],
      xp: 10,
      template: [
        t(
          "A disease outbreak that spreads across many countries or continents is called a ___.",
        ),
      ],
      accepted: ["pandemic", "pandemics"],
    },
    {
      id: "bd-p2",
      type: "mcq",
      prompt: [
        t("The disease became known as the 'Black Death' mainly because…"),
      ],
      explanation: [
        t(
          "Sufferers developed dark, black or purple swollen lumps called buboes under their skin, and their skin could turn black as tissue died. The name 'Black Death' describes these frightening symptoms.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("It only struck at night")] },
        {
          id: "b",
          label: [t("Victims developed dark buboes and blackened skin")],
        },
        { id: "c", label: [t("It came from black clouds of smoke")] },
        { id: "d", label: [t("The rats that spread it were black")] },
      ],
      correctOptionId: "b",
    },
    {
      id: "bd-p3",
      type: "mcq",
      prompt: [
        t(
          "How did the Black Death travel from Central Asia to the Mediterranean and Europe?",
        ),
      ],
      explanation: [
        t(
          "The plague moved west along the Silk Road trade routes. Italian merchant ships fleeing the Crimea then carried infected rats and fleas across the Mediterranean to Europe. Trade was the highway the disease travelled on.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Through invading armies only")] },
        { id: "b", label: [t("Along trade routes and merchant ships")] },
        { id: "c", label: [t("Through contaminated water supplies")] },
        { id: "d", label: [t("By migrating birds")] },
      ],
      correctOptionId: "b",
    },
    {
      id: "bd-p4",
      type: "matching",
      prompt: [t("Match each type of plague to how it spread.")],
      explanation: [
        t(
          "Bubonic was spread by flea bites (the most common form); septicaemic occurred when bacteria flooded the bloodstream; pneumonic spread through coughs and sneezes from person to person (the most contagious).",
        ),
      ],
      xp: 15,
      pairs: [
        { id: "a", left: [t("Bubonic")], right: [t("Spread by flea bites")] },
        {
          id: "b",
          left: [t("Septicaemic")],
          right: [t("Bacteria in the bloodstream")],
        },
        {
          id: "c",
          left: [t("Pneumonic")],
          right: [t("Spread by coughs and sneezes")],
        },
      ],
    },
    {
      id: "bd-p5",
      type: "mcq",
      prompt: [
        t("What organism actually carried and spread the plague bacteria?"),
      ],
      explanation: [
        t(
          "The bacterium Yersinia pestis lived in the stomachs of fleas. Those fleas lived on black rats, which travelled on ships and in cargo. When the rats died, the fleas moved to humans, spreading the plague.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Mosquitoes")] },
        { id: "b", label: [t("Fleas on black rats")] },
        { id: "c", label: [t("Bats")] },
        { id: "d", label: [t("Contaminated well water")] },
      ],
      correctOptionId: "b",
    },
    {
      id: "bd-p6",
      type: "shortText",
      prompt: [
        t(
          "Why was the plague so frightening to people in the 1300s? Give one reason.",
        ),
      ],
      explanation: [
        t(
          "Any valid reason: it killed victims within days, no one knew what caused it, doctors had no cure, entire families and villages died together, and it spread unseen. People felt helpless against something they could not explain.",
        ),
      ],
      xp: 15,
      accepted: [
        "killed quickly",
        "no cure",
        "did not know what caused it",
        "spread fast",
        "spread quickly",
        "died within days",
        "no one understood",
        "couldn't be stopped",
      ],
    },
    {
      id: "bd-p7",
      type: "mcq",
      prompt: [
        t("In which decade did the Black Death first reach Europe in force?"),
      ],
      explanation: [
        t(
          "The Black Death reached Europe in 1347, when infected ships arrived in Italy. The worst years of the pandemic in Europe were 1347–1351, so the correct decade is the 1340s.",
        ),
      ],
      xp: 15,
      options: [
        { id: "a", label: [t("The 1240s")] },
        { id: "b", label: [t("The 1340s")] },
        { id: "c", label: [t("The 1440s")] },
        { id: "d", label: [t("The 1540s")] },
      ],
      correctOptionId: "b",
    },
    {
      id: "bd-p8",
      type: "mcq",
      prompt: [
        t(
          "Which of the following was the deadliest and most contagious form of plague?",
        ),
      ],
      explanation: [
        t(
          "Pneumonic plague attacked the lungs and spread directly from person to person through coughing. It was nearly always fatal and the most contagious form — though bubonic was the most common.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("Bubonic")] },
        { id: "b", label: [t("Septicaemic")] },
        { id: "c", label: [t("Pneumonic")] },
        { id: "d", label: [t("They were all equally contagious")] },
      ],
      correctOptionId: "c",
    },
  ],
  mastery: [
    {
      id: "bd-m1",
      type: "shortText",
      prompt: [
        t(
          "In your own words, define the term 'pandemic' and explain why the Black Death is classed as one.",
        ),
      ],
      explanation: [
        t(
          "A pandemic is a disease that spreads across many countries or continents, affecting huge numbers of people. The Black Death counts because it spread from Central Asia along trade routes through the Middle East and across nearly all of Europe in the 1340s–50s, killing millions on several continents.",
        ),
      ],
      xp: 25,
      accepted: [
        "disease spreads across many countries",
        "many continents",
        "spread from asia to europe",
        "affected huge numbers",
        "worldwide",
      ],
    },
    {
      id: "bd-m2",
      type: "mcq",
      prompt: [
        t(
          "A student writes: 'The plague spread mainly because soldiers carried it into battle.' Why is this incomplete?",
        ),
      ],
      explanation: [
        t(
          "Trade, not warfare, was the main route of spread. The plague travelled along Silk Road trade routes and on merchant ships carrying goods (and infected rats and fleas). Armies played a part, but merchants and ships were the primary way the disease crossed continents.",
        ),
      ],
      xp: 25,
      options: [
        {
          id: "a",
          label: [t("It is wrong — soldiers were not involved at all")],
        },
        {
          id: "b",
          label: [
            t("Trade routes and merchant ships were the main route of spread"),
          ],
        },
        { id: "c", label: [t("The plague never reached Europe")] },
        { id: "d", label: [t("Only soldiers could catch the plague")] },
      ],
      correctOptionId: "b",
    },
    {
      id: "bd-m3",
      type: "mcq",
      prompt: [
        t(
          "Which statement best summarises why the Black Death reached so many countries so quickly?",
        ),
      ],
      explanation: [
        t(
          "Medieval Europe and Asia were connected by busy trade networks (the Silk Road and shipping routes). These routes moved people, goods — and rats and fleas — rapidly across huge distances, carrying the plague with them before anyone realised what was happening.",
        ),
      ],
      xp: 25,
      options: [
        {
          id: "a",
          label: [t("People travelled faster in the 1300s than today")],
        },
        {
          id: "b",
          label: [
            t(
              "Busy trade routes carried infected people, rats and fleas across continents",
            ),
          ],
        },
        {
          id: "c",
          label: [t("The plague could fly through the air for miles")],
        },
        {
          id: "d",
          label: [t("Kings deliberately spread it to weaken rivals")],
        },
      ],
      correctOptionId: "b",
    },
  ],
};

// ---------------------------------------------------------------------------
// Lesson 2 – Short-term effects of the Black Death
// ---------------------------------------------------------------------------

const shortTermEffectsLesson: Lesson = {
  id: "short-term-effects",
  order: 2,
  title: "Short-term effects of the Black Death",
  sourceRef: "L11 Short Term Effects of the Black Plague (Stile)",
  aiProvenance: {
    tool: "Claude",
    sources: [
      "Stile: L11 Short Term Effects of the Black Plague",
      "Cambridge 8.15 The Black Death",
    ],
    role: "generated",
  },
  learnCards: [
    {
      id: "st-death-toll",
      heading: "Key idea: staggering death toll",
      body: [
        t(
          "The immediate effect of the Black Death was mass death on a scale the medieval world had never seen. Historians estimate that between one-third and one-half of Europe's population died between 1347 and 1351 — perhaps 25 to 50 million people across Europe alone, and many more in Asia and North Africa.",
        ),
        t(
          "Whole villages were wiped out. In some cities, more than half the population died in a single summer. There were not enough healthy people to bury the dead, and bodies piled up in the streets.",
        ),
      ],
    },
    {
      id: "st-panic",
      heading: "Panic, blame and fear",
      body: [
        t(
          "Because no one understood what caused the plague, people searched for someone to blame. Some communities turned on minority groups — particularly Jewish communities, who were falsely accused of poisoning wells, leading to terrible massacres.",
        ),
        t(
          "Others joined extreme religious groups like the Flagellants, who travelled from town to town whipping themselves in public, believing they could appease God's anger. The Church struggled to explain why so many were dying, and its authority was shaken.",
        ),
      ],
    },
    {
      id: "st-breakdown",
      heading: "Society breaks down",
      body: [
        t(
          "With so many dead, daily life collapsed. Farms were abandoned because there were no peasants left to work them. Trade slowed as markets emptied and merchants fled. Doctors and priests — who tended the sick and dying — died at very high rates, leaving communities without care or comfort.",
        ),
        t(
          "Prices rose and food grew scarce. Survivors were traumatised, and many lived in constant fear that the plague would return — which it did, in waves, for centuries afterwards.",
        ),
      ],
      figure: figFeudalPyramid,
    },
  ],
  practice: [
    {
      id: "st-p1",
      type: "numeric",
      prompt: [
        t(
          "Historians estimate that roughly what FRACTION of Europe's population died in the first wave of the Black Death? Give your answer as a single digit (e.g. '1' for one in one).",
        ),
      ],
      explanation: [
        t(
          "About one-third (1 in 3) of Europe's population is estimated to have died — roughly 25–50 million people. Some regions lost even more, up to one-half.",
        ),
      ],
      xp: 15,
      accepted: ["3"],
    },
    {
      id: "st-p2",
      type: "mcq",
      prompt: [t("Why did Jewish communities suffer during the Black Death?")],
      explanation: [
        t(
          "In their fear and ignorance, some Christians falsely blamed Jewish people for causing the plague by 'poisoning wells'. These baseless accusations led to terrible massacres and the destruction of entire Jewish communities across Europe.",
        ),
      ],
      xp: 15,
      options: [
        { id: "a", label: [t("They had started the plague on purpose")] },
        {
          id: "b",
          label: [
            t(
              "They were falsely accused of poisoning wells and blamed for the disease",
            ),
          ],
        },
        { id: "c", label: [t("They refused to treat the sick")] },
        { id: "d", label: [t("They controlled the trade routes")] },
      ],
      correctOptionId: "b",
    },
    {
      id: "st-p3",
      type: "mcq",
      prompt: [t("Who were the Flagellants?")],
      explanation: [
        t(
          "The Flagellants were extreme religious groups who travelled between towns whipping themselves in public. They believed their suffering would appease God's anger and stop the plague. Their movement showed how desperate and fearful people had become.",
        ),
      ],
      xp: 15,
      options: [
        { id: "a", label: [t("Doctors who treated plague victims")] },
        {
          id: "b",
          label: [t("People who whipped themselves to appease God's anger")],
        },
        { id: "c", label: [t("Soldiers who defended the cities")] },
        { id: "d", label: [t("Merchants who fled the plague")] },
      ],
      correctOptionId: "b",
    },
    {
      id: "st-p4",
      type: "mcq",
      prompt: [
        t("What happened to many farms during the worst of the plague?"),
      ],
      explanation: [
        t(
          "With so many peasants dead or fleeing, farms were abandoned and crops rotted in the fields. The shortage of workers also caused food shortages and rising prices in the short term.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("They produced more food than ever")] },
        { id: "b", label: [t("They were abandoned as workers died or fled")] },
        { id: "c", label: [t("They were given to the Church")] },
        {
          id: "d",
          label: [t("Nothing — plague did not affect the countryside")],
        },
      ],
      correctOptionId: "b",
    },
    {
      id: "st-p5",
      type: "shortText",
      prompt: [
        t(
          "Give two reasons why the Church's authority was shaken by the Black Death.",
        ),
      ],
      explanation: [
        t(
          "Any two of: priests and monks died at high rates while tending the sick, leaving communities without spiritual care; the Church could not explain why God allowed such suffering; prayers and religious rituals failed to stop the plague; the rise of groups like the Flagellants challenged the Church's role as the only path to God.",
        ),
      ],
      xp: 15,
      accepted: [
        "could not explain",
        "priests died",
        "prayers failed",
        "could not stop the plague",
        "flagellants",
        "lost authority",
        "god allowed",
      ],
    },
    {
      id: "st-p6",
      type: "mcq",
      prompt: [
        t(
          "Doctors and priests died at very high rates during the plague. What was a consequence of this?",
        ),
      ],
      explanation: [
        t(
          "Because those who cared for the sick and dying were in close contact with plague victims, they caught the disease themselves. Their deaths left communities without medical care, religious comfort, or people to bury the dead — deepening the social breakdown.",
        ),
      ],
      xp: 15,
      options: [
        { id: "a", label: [t("More doctors were trained overnight")] },
        {
          id: "b",
          label: [t("Communities lost their healers and spiritual leaders")],
        },
        { id: "c", label: [t("The plague immediately stopped")] },
        { id: "d", label: [t("Only peasants were left to die")] },
      ],
      correctOptionId: "b",
    },
    {
      id: "st-p7",
      type: "fillInTheBlank",
      prompt: [
        t(
          "Complete the sentence: After the plague, survivors lived in fear because the disease returned in ___ for centuries afterwards.",
        ),
      ],
      explanation: [
        t(
          "The Black Death did not vanish after 1351. It returned in waves (outbreaks) for centuries, striking every generation. This kept fear alive long after the first, deadliest wave.",
        ),
      ],
      xp: 10,
      template: [
        t(
          "After the plague, survivors lived in fear because the disease returned in ___ for centuries afterwards.",
        ),
      ],
      accepted: ["waves", "wave", "outbreaks", "outbreak"],
    },
    {
      id: "st-p8",
      type: "matching",
      prompt: [t("Match each short-term effect to its description.")],
      explanation: [
        t(
          "Mass death = 1/3 to 1/2 of Europe died; Persecution = minorities blamed and attacked; Abandoned farms = no workers left; Lost authority = the Church couldn't explain or stop the plague.",
        ),
      ],
      xp: 15,
      pairs: [
        {
          id: "a",
          left: [t("Mass death")],
          right: [t("One-third to one-half of Europe died")],
        },
        {
          id: "b",
          left: [t("Persecution")],
          right: [t("Minorities blamed and attacked")],
        },
        {
          id: "c",
          left: [t("Abandoned farms")],
          right: [t("No peasants left to work the land")],
        },
        {
          id: "d",
          left: [t("Lost authority")],
          right: [t("The Church could not explain or stop it")],
        },
      ],
    },
  ],
  mastery: [
    {
      id: "st-m1",
      type: "shortText",
      prompt: [
        t(
          "Describe THREE short-term effects of the Black Death on medieval European society.",
        ),
      ],
      explanation: [
        t(
          "Any three of: massive death toll (1/3–1/2 of the population); persecution of minorities like Jewish communities who were blamed for the plague; abandoned farms and food shortages as workers died; panic and the rise of groups like the Flagellants; weakening of the Church's authority; breakdown of trade and daily life.",
        ),
      ],
      xp: 25,
      accepted: [
        "death",
        "persecution",
        "jewish",
        "abandoned farms",
        "panic",
        "flagellants",
        "church authority",
        "fear",
      ],
    },
    {
      id: "st-m2",
      type: "mcq",
      prompt: [
        t(
          "Which statement best captures why the Black Death caused such social breakdown?",
        ),
      ],
      explanation: [
        t(
          "It was not just the deaths — it was the speed, the fear, and the loss of the people who held society together (priests, doctors, farmers). Without them, and with no understanding of the cause, panic, blame and collapse followed.",
        ),
      ],
      xp: 25,
      options: [
        { id: "a", label: [t("Only the rich were affected")] },
        {
          id: "b",
          label: [
            t(
              "The huge, fast death toll removed the people and trust that held society together",
            ),
          ],
        },
        { id: "c", label: [t("The plague lasted only a few days total")] },
        { id: "d", label: [t("It was easily cured once doctors arrived")] },
      ],
      correctOptionId: "b",
    },
  ],
};

// ---------------------------------------------------------------------------
// Lesson 3 – Long-term effects of the Black Death
// ---------------------------------------------------------------------------

const longTermEffectsLesson: Lesson = {
  id: "long-term-effects",
  order: 3,
  title: "Long-term effects of the Black Death",
  sourceRef: "L12 Long Term Effects of the Black Plague (Stile)",
  aiProvenance: {
    tool: "Claude",
    sources: [
      "Stile: L12 Long Term Effects of the Black Plague",
      "Cambridge 8.15 The Black Death",
    ],
    role: "generated",
  },
  learnCards: [
    {
      id: "lt-feudalism",
      heading: "Key idea: the fall of feudalism",
      body: [
        t(
          "The Black Death changed medieval society forever. Under the feudal system, kings granted land to nobles, who let knights and peasants farm it in return for labour and loyalty. Peasants (serfs) were tied to the land and had few rights.",
        ),
        t(
          "When the plague killed so many workers, those who survived suddenly became valuable. There were not enough peasants to farm the land, so labourers could demand higher wages and better conditions. Lords competed for workers, and the old feudal bonds began to break apart.",
        ),
      ],
      figure: figFeudalPyramid,
    },
    {
      id: "lt-wages-revolt",
      heading: "Higher wages — and peasant revolts",
      body: [
        t(
          "With workers scarce, many peasants left their home villages to find better-paid work elsewhere. This threatened the lords' power. Governments tried to freeze wages at pre-plague levels with laws like the Statute of Labourers (1351), but workers often ignored them.",
        ),
        t(
          "Resentment boiled over into uprisings. The Peasants' Revolt in England in 1381 saw thousands of commoners march on London, demanding an end to serfdom and fair treatment. Although the revolt was crushed, it showed that ordinary people would no longer simply accept the old order.",
        ),
      ],
    },
    {
      id: "lt-church-power",
      heading: "Weaker Church and new ideas",
      body: [
        t(
          "The Church's failure to stop the plague — and the death of so many priests — weakened its grip on people's minds. Survivors began to question the Church's teachings and its power. This long-term doubt helped pave the way for new thinking, including the Renaissance and later the Reformation.",
        ),
        t(
          "Medicine and science also changed. The plague forced people to look beyond superstition for answers, encouraging early ideas about hygiene, quarantine and the spread of disease. The word 'quarantine' itself comes from this era (from the Italian for 'forty days').",
        ),
      ],
    },
  ],
  practice: [
    {
      id: "lt-p1",
      type: "mcq",
      prompt: [
        t(
          "Why did surviving peasants become more valuable after the Black Death?",
        ),
      ],
      explanation: [
        t(
          "With so many workers dead, there was a shortage of labour. Lords needed peasants to farm their land, so survivors could demand higher wages and better conditions — the first cracks in the feudal system.",
        ),
      ],
      xp: 10,
      options: [
        { id: "a", label: [t("They owned more land")] },
        {
          id: "b",
          label: [t("There were fewer of them, so labour was scarce")],
        },
        { id: "c", label: [t("They had learned new farming skills")] },
        { id: "d", label: [t("The king gave them titles")] },
      ],
      correctOptionId: "b",
    },
    {
      id: "lt-p2",
      type: "mcq",
      prompt: [
        t(
          "What did governments try to do in response to workers demanding higher wages?",
        ),
      ],
      explanation: [
        t(
          "Governments passed laws like the Statute of Labourers (1351) to freeze wages at pre-plague levels and stop peasants moving for better pay. These laws were hard to enforce and often ignored, fuelling anger that led to revolts.",
        ),
      ],
      xp: 15,
      options: [
        { id: "a", label: [t("They doubled everyone's wages")] },
        {
          id: "b",
          label: [t("They tried to freeze wages at pre-plague levels")],
        },
        { id: "c", label: [t("They abolished the feudal system immediately")] },
        { id: "d", label: [t("They ignored the issue completely")] },
      ],
      correctOptionId: "b",
    },
    {
      id: "lt-p3",
      type: "mcq",
      prompt: [t("The Peasants' Revolt in England (1381) is evidence that…")],
      explanation: [
        t(
          "The revolt showed that ordinary people were no longer willing to accept the old feudal order. Even though it was crushed, it revealed how the Black Death had emboldened peasants to demand freedom, fair wages and an end to serfdom.",
        ),
      ],
      xp: 15,
      options: [
        { id: "a", label: [t("The plague never actually happened")] },
        {
          id: "b",
          label: [t("Ordinary people were challenging the old feudal order")],
        },
        { id: "c", label: [t("Peasants were happy with their lives")] },
        { id: "d", label: [t("The Church had become more powerful")] },
      ],
      correctOptionId: "b",
    },
    {
      id: "lt-p4",
      type: "fillInTheBlank",
      prompt: [
        t(
          "Complete the sentence: The word 'quarantine' comes from an Italian word meaning ___ days.",
        ),
      ],
      explanation: [
        t(
          "'Quarantine' comes from the Italian 'quaranta' meaning forty. Ships arriving in port during plague times were made to wait forty days before landing, to check they were disease-free — an early public-health measure born from the Black Death.",
        ),
      ],
      xp: 15,
      template: [
        t("The word 'quarantine' comes from an Italian word meaning ___ days."),
      ],
      accepted: ["40", "forty", "forty 40"],
    },
    {
      id: "lt-p5",
      type: "mcq",
      prompt: [
        t("How did the Black Death weaken the Church's long-term power?"),
      ],
      explanation: [
        t(
          "The Church could not explain or stop the plague, and many priests died. This made people doubt the Church's authority and teachings. That doubt contributed to later movements like the Renaissance and Reformation, which reshaped European thought.",
        ),
      ],
      xp: 15,
      options: [
        {
          id: "a",
          label: [t("The Church cured the plague and became richer")],
        },
        {
          id: "b",
          label: [
            t(
              "Its failure to stop the plague made people question its authority",
            ),
          ],
        },
        { id: "c", label: [t("The Church banned all science")] },
        { id: "d", label: [t("The plague had no effect on religion")] },
      ],
      correctOptionId: "b",
    },
    {
      id: "lt-p6",
      type: "matching",
      prompt: [t("Match each long-term effect to its cause.")],
      explanation: [
        t(
          "End of serfdom ← labour shortage made peasants demand freedom; Higher wages ← fewer workers made labour scarce; Weaker Church ← it could not explain or stop the plague; Early quarantine ← health measures to stop disease spreading by ship.",
        ),
      ],
      xp: 15,
      pairs: [
        {
          id: "a",
          left: [t("End of serfdom")],
          right: [t("Labour shortage gave peasants bargaining power")],
        },
        {
          id: "b",
          left: [t("Higher wages")],
          right: [t("Fewer workers made labour scarce")],
        },
        {
          id: "c",
          left: [t("Weaker Church")],
          right: [t("It failed to explain or stop the plague")],
        },
        {
          id: "d",
          left: [t("Early quarantine")],
          right: [t("Ships waited 40 days before landing")],
        },
      ],
    },
    {
      id: "lt-p7",
      type: "shortText",
      prompt: [
        t(
          "Explain how a disease that killed millions actually improved life for some surviving peasants.",
        ),
      ],
      explanation: [
        t(
          "The huge death toll created a labour shortage. With fewer workers available, surviving peasants became valuable and could demand higher wages, better conditions, and the freedom to leave their lord's land. Over time this helped break down the feudal system of tied serfdom.",
        ),
      ],
      xp: 15,
      accepted: [
        "labour shortage",
        "shortage of workers",
        "higher wages",
        "demand",
        "more bargaining power",
        "freedom",
        "leave the land",
        "valuable",
      ],
    },
    {
      id: "lt-p8",
      type: "mcq",
      prompt: [
        t(
          "Which is the best summary of the Black Death's long-term impact on Europe?",
        ),
      ],
      explanation: [
        t(
          "The plague did not just kill people — it transformed society. It weakened feudalism and the Church, gave workers more power, and encouraged new thinking in science and religion. It helped end the medieval world order.",
        ),
      ],
      xp: 15,
      options: [
        { id: "a", label: [t("It changed almost nothing")] },
        {
          id: "b",
          label: [
            t("It weakened feudalism and the Church and reshaped society"),
          ],
        },
        { id: "c", label: [t("It made Europe more religious and united")] },
        { id: "d", label: [t("It only affected the very rich")] },
      ],
      correctOptionId: "b",
    },
  ],
  mastery: [
    {
      id: "lt-m1",
      type: "shortText",
      prompt: [
        t(
          "Explain the connection between the Black Death and the decline of feudalism.",
        ),
      ],
      explanation: [
        t(
          "The plague killed a huge share of the peasant workforce. Those who survived became scarce and valuable, so they could demand wages, move to better land, and refuse the old duties of serfdom. Lords and kings tried to hold wages down, sparking revolts like the Peasants' Revolt of 1381. Over time the feudal bonds of land-for-labour broke apart, and feudalism declined.",
        ),
      ],
      xp: 25,
      accepted: [
        "labour shortage",
        "shortage of workers",
        "peasants demanded",
        "higher wages",
        "serfdom",
        "peasants revolt",
        "1381",
        "workers became valuable",
      ],
    },
    {
      id: "lt-m2",
      type: "mcq",
      prompt: [
        t(
          "Which pair of long-term effects best describes the Black Death's legacy?",
        ),
      ],
      explanation: [
        t(
          "The two biggest long-term changes were the decline of feudalism (as workers gained power) and the weakening of the Church (as its authority was questioned). Together these helped end the medieval social order.",
        ),
      ],
      xp: 25,
      options: [
        { id: "a", label: [t("Stronger kings and a richer Church")] },
        {
          id: "b",
          label: [t("Decline of feudalism and a weaker Church")],
        },
        { id: "c", label: [t("More serfdom and less trade")] },
        { id: "d", label: [t("Higher taxes and larger armies")] },
      ],
      correctOptionId: "b",
    },
  ],
};

// ---------------------------------------------------------------------------
// Boss challenge questions
// ---------------------------------------------------------------------------

const blackDeathBossQuestions: Question[] = [
  {
    id: "boss-bd-1",
    type: "mcq",
    prompt: [
      t(
        "Which combination of factors allowed the Black Death to spread so widely?",
      ),
    ],
    explanation: [
      t(
        "Busy trade routes (the Silk Road) and merchant ships carried infected people, rats and fleas across continents. No one understood the cause, so there was no effective way to stop it spreading.",
      ),
    ],
    xp: 20,
    options: [
      { id: "a", label: [t("Cold weather and clean water")] },
      {
        id: "b",
        label: [t("Trade routes, ships, rats and fleas")],
      },
      { id: "c", label: [t("Modern medicine failing")] },
      { id: "d", label: [t("Invading armies only")] },
    ],
    correctOptionId: "b",
  },
  {
    id: "boss-bd-2",
    type: "fillInTheBlank",
    prompt: [
      t(
        "Complete the sentence: The Black Death is estimated to have killed between one-third and one-___ of Europe's population.",
      ),
    ],
    explanation: [
      t(
        "The death toll is estimated at one-third to one-half of Europe's population — roughly 25 to 50 million people in the first wave alone. Some regions lost even more.",
      ),
    ],
    xp: 20,
    template: [
      t(
        "The Black Death is estimated to have killed between one-third and one-___ of Europe's population.",
      ),
    ],
    accepted: ["half", "half of", "half the"],
  },
  {
    id: "boss-bd-3",
    type: "shortText",
    prompt: [
      t(
        "Explain how the Black Death helped bring about the decline of feudalism. Refer to the labour shortage in your answer.",
      ),
    ],
    explanation: [
      t(
        "The plague killed a huge share of the peasantry, creating a labour shortage. Surviving workers became scarce and valuable, so they could demand higher wages and freedom to move. Lords and kings tried to freeze wages, but peasants resisted, culminating in revolts like the Peasants' Revolt of 1381. Over time the old feudal ties of land-for-labour broke down.",
      ),
    ],
    xp: 25,
    accepted: [
      "labour shortage",
      "shortage of workers",
      "peasants demanded",
      "higher wages",
      "serfdom",
      "peasants revolt",
      "workers valuable",
      "feudal",
    ],
  },
  {
    id: "boss-bd-4",
    type: "mcq",
    prompt: [
      t(
        "The Peasants' Revolt of 1381 was a direct long-term consequence of which short-term effect of the plague?",
      ),
    ],
    explanation: [
      t(
        "The mass death of workers caused a labour shortage, which drove peasants to demand better pay and freedom. When governments tried to freeze wages, anger built into revolt. So the revolt traces back to the labour shortage caused by the death toll.",
      ),
    ],
    xp: 25,
    options: [
      { id: "a", label: [t("The rise of the Flagellants")] },
      { id: "b", label: [t("The labour shortage from mass death")] },
      { id: "c", label: [t("The persecution of minorities")] },
      { id: "d", label: [t("The breakdown of trade")] },
    ],
    correctOptionId: "b",
  },
  {
    id: "boss-bd-5",
    type: "matching",
    prompt: [t("Match each event or concept to the correct description.")],
    explanation: [
      t(
        "Silk Road = trade route that carried the plague west; Buboes = dark swollen lumps that gave the disease its name; Quarantine = 40-day ship waiting period; Peasants' Revolt = 1381 uprising for fair treatment.",
      ),
    ],
    xp: 25,
    pairs: [
      {
        id: "a",
        left: [t("Silk Road")],
        right: [t("Trade route that carried the plague west")],
      },
      {
        id: "b",
        left: [t("Buboes")],
        right: [t("Dark swollen lumps that named the disease")],
      },
      {
        id: "c",
        left: [t("Quarantine")],
        right: [t("Forty-day ship waiting period")],
      },
      {
        id: "d",
        left: [t("Peasants' Revolt")],
        right: [t("1381 uprising against the old order")],
      },
    ],
  },
  {
    id: "boss-bd-6",
    type: "mcq",
    prompt: [
      t(
        "A historian claims the Black Death 'changed Europe more than any war.' Which evidence best supports this?",
      ),
    ],
    explanation: [
      t(
        "The plague ended feudalism, weakened the Church, gave workers power, and reshaped medicine and ideas — transforming the whole social order. A war might change borders, but the plague changed the structure of medieval society itself.",
      ),
    ],
    xp: 25,
    options: [
      { id: "a", label: [t("It killed the same number as one battle")] },
      {
        id: "b",
        label: [
          t("It ended feudalism, weakened the Church, and reshaped society"),
        ],
      },
      { id: "c", label: [t("It only affected a single city")] },
      { id: "d", label: [t("It made Europe stronger and richer")] },
    ],
    correctOptionId: "b",
  },
];

// ---------------------------------------------------------------------------
// Track export
// ---------------------------------------------------------------------------

/** The Black Death (Year 8 HSS) track. */
export const blackDeathTrack: Track = {
  id: "black-death",
  subjectId: "hss",
  title: "The Black Death (Year 8)",
  description:
    "How a medieval pandemic spread along the Silk Road and reshaped European society, feudalism, and the Church.",
  lessons: [
    blackDeathArrivesLesson,
    shortTermEffectsLesson,
    longTermEffectsLesson,
  ],
  challenge: {
    id: "black-death-boss",
    title: "Boss challenge: The Black Death",
    sourceRef:
      "2026 8 HSS T1 Black Death Stile Unit, The Gap State High School",
    questions: blackDeathBossQuestions,
    bonusXp: 100,
    passBadgeId: "boss-black-death",
    aiProvenance: {
      tool: "Claude",
      sources: [
        "Stile: 3.1 The Black Death Arrives",
        "Stile: L11 Short Term Effects of the Black Plague",
        "Stile: L12 Long Term Effects of the Black Plague",
        "Stile: Medieval Europe WebQuest",
      ],
      role: "generated",
    },
  },
};
