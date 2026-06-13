# Mapping OneNote to StudyBub Content Model

Map the extracted OneNote JSON (`extracted.json`) into `AppContent` conforming
to `src/contracts/contentModel.md`.

## Structural mapping

| OneNote concept | StudyBub type | Notes |
|-----------------|---------------|-------|
| Notebook (e.g. "2026 - Year 8 Maths") | Subject | One Subject per notebook |
| Section (e.g. "Term 1") | Track | One Track per section with lesson pages |
| Page with lesson content | Lesson | learnCards from explanatory text, practice from worksheets |
| Page with exercise lists | Lesson | practice/mastery arrays built from question rows |
| Page with boss challenge | BossChallenge | Full-page challenge with mixed question types |
| Embedded image in page | Figure | Copy PNG to `public/figures/`, reference by filename stem |

## Subject mapping

Each Class Notebook maps to a Subject:

```typescript
{
  id: "maths",                    // Lowercase slug
  title: "Maths",
  description: "Algebra, geometry, statistics, and more — from the Year 8 curriculum",
  icon: "🧮",
  accent: "#6D4AFF",
}
```

The notebook title includes the year level and subject. Extract these to
populate the Subject.

## Track mapping

Each OneNote section that contains lesson pages maps to a Track:

```typescript
{
  id: "term-1",                   // Derived from section name, lowercased
  subjectId: "maths",
  title: "Term 1 (Year 8)",      // Include year level per Principle IV
  description: "Number and algebra fundamentals",
  lessons: [...],
  challenge: { ... },
}
```

Year level comes from the notebook title. If a section targets a different
year level, include it in the track title (e.g. "Time (Year 4)").

## Lesson mapping

Each OneNote page with substantive content (>100 chars after cleaning) maps to
a Lesson. The page title becomes the lesson title. Content is split into
learnCards and questions:

```typescript
{
  id: "term-1-week-2",           // Derived from section + page, lowercased
  order: 1,                       // 1-based, contiguous within track
  title: "1E/1F Adding and subtracting fractions",
  sourceRef: "2026 T1 Yr 8 Maths Planner — Term 1, Week 2",
  learnCards: [...],
  practice: [...],
  mastery: [...],
  passThreshold: 0.8,
  aiProvenance: {                 // Always mark AI-processed content
    tool: "onenote-extraction",
    sources: ["2026 - Year 8 Maths Class Notebook"],
    role: "generated",
  },
}
```

### Splitting content into learnCards vs questions

OneNote pages mix explanatory text with exercise questions. Heuristic:

1. **If the page contains an exercise table** (columns: Exercise, Fluency,
   Problem Solving, Enrichment): each row is a Question set. The page title
   text before the table becomes a learnCard.
2. **If the page has headings** (bold/large text followed by body text):
   each heading section is a learnCard. Questions at the end become practice.
3. **If the page is predominantly images**: extract alt text as learnCard
   body, treat the page as a single learnCard with no practice questions
   (or create comprehension questions if alt text describes a problem).

### Exercise table parsing

The "Questions" page renders as (tab-separated):

```
Term 1 Questions
Exercise  Fluency  Problem Solving  Enrichment
1E        1, 3, 4  7, 9, 10         15
1F        2, 4     7, 8, 10         15
...
```

Parse each row into question IDs (e.g. `term-1-1e-q1`, `term-1-1e-q3`,
`term-1-1e-q4`). Each question references the source textbook exercise:

```typescript
{
  type: "numeric",
  id: "term-1-1e-q1",
  prompt: [t("Exercise 1E, Question 1 (Fluency)")],
  explanation: [t("See worked solution in textbook.")],
  xp: 10,
  accepted: ["(answer to be filled)"],
  sourceRef: "Cambridge Maths Year 8, Exercise 1E Q1",
}
```

**Important:** When the exercise questions are not authored into the notebook
(only exercise numbers are listed), the questions serve as placeholders. The
`accepted` array and `explanation` must be filled by a content author. Mark
these with `aiProvenance.role: "generated"` and a TODO comment in the
generated file.

## Question type detection

When actual question text is present on a page, detect the type:

| Pattern | Question type |
|---------|--------------|
| Multiple choice options (A/B/C/D with labels) | `mcq` |
| "Find the value of x", "Solve for …", equation present | `expression` or `numeric` |
| "Calculate …", numeric answer expected | `numeric` |
| "Explain …", "Describe …", "What is …" | `shortText` |
| Fill-in-the-blank with `___` marker | `fillInTheBlank` |
| Matching pairs (two-column layout) | `matching` |

## Figure mapping

For each extracted image:

1. Copy the PNG from `/tmp/onenote-extraction/` to `public/figures/`
2. Use the filename stem (without extension) as the `Figure.id`
3. Use the `alt` text from the extraction JSON, or generate a description
4. The `textFallback` should describe what the image shows in plain text

```typescript
{
  id: "term-1-maths-planner",
  alt: "Term 1 Year 8 Maths Planner — weekly topic schedule",
  textFallback: "A table showing the weekly maths topics for Term 1: Week 1 — 1A/1B Integers, Week 2 — 1E/1F Adding and subtracting fractions, …",
}
```

## BossChallenge mapping

A section that contains a "Quizzes" or "Test" page maps to a BossChallenge.
If the page has a mix of question types, create a BossChallenge with those
questions. Otherwise, create a synthetic BossChallenge from the hardest
questions across the track's lessons.

## Example output file

```typescript
// src/content/oneNoteContent.ts
import type { AppContent } from "../domain/content/types";

export const oneNoteContent: AppContent = {
  subjects: [{ /* maths subject */ }],
  tracks: [{ /* term-1 track with lessons */ }],
  badges: [{ /* boss-pass badge */ }],
};
```

Import and merge with other content sources in the app's content loader.
