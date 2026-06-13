## Constitution

### Core Principles

#### Principle I: Subject-agnostic platform

The learning loop (learn → practise → master), progress system (XP, levels, streaks, badges), and UI shell MUST NOT embed subject-specific logic or vocabulary. Adding a new subject (e.g., science, history, English) MUST require only new content data — no changes to the platform layer.

**Rationale:** The platform started as a maths-only tool but is intended to grow across subjects. Tightly coupling subjects to the core would make that growth expensive and error-prone.

#### Principle II: Content as validated data

Every lesson, question, and learning resource MUST be typed, structured data that passes `validateContent` (or its successor) before it is surfaced to the learner. Content validation MUST be fast enough to run on every dev start and test run. The validation function MUST catch structural problems (missing explanations, duplicate IDs, undeclared symbols) with clear, human-readable error messages.

**Rationale:** Authoring content by hand (or with AI) is error-prone. Catching mistakes automatically at dev time prevents broken lessons from reaching a learner.

#### Principle III: Pure domain layer

All domain logic — answer marking, progress calculation, content validation, persistence schemas — MUST live in pure TypeScript functions under `src/domain/` with zero React, zero DOM, and zero browser dependencies. These modules MUST be independently unit-testable. The React layer (`src/components/`, `src/state/`) is responsible only for rendering, user interaction, and wiring domain functions to context providers.

**Rationale:** Pure logic is faster to test, easier to reason about, and portable across UI frameworks. This separation also makes it straightforward to generate or check content with AI tooling that operates on data, not screens.

#### Principle IV: Year-8 baseline with explicit year labels

All content MUST be appropriate for the target Year 8 curriculum by default. Content that targets other year levels MUST include the target year in its track title (e.g., "Time (Year 4)", "Geometry (Year 10)"). Extension content that goes beyond Year 8 MUST be visually distinguishable from core Year-8 content.

**Rationale:** The primary learner is in Year 8. Content that is too advanced without clear labelling risks frustration; content that is too basic without labelling wastes time. Transparent year labels let the learner self-select.

#### Principle V: Source traceability and AI provenance

Every lesson and boss challenge MUST carry a `sourceRef` that links back to the originating worksheet, textbook, or practice paper. AI-generated or AI-checked content MUST additionally carry an `aiProvenance` marker declaring (a) which AI tool was used, (b) which source materials were provided, and (c) whether the content was generated, checked, or both. AI-produced content MUST pass the same validation gates as hand-authored content.

**Rationale:** Source references let the learner revisit original material. AI provenance ensures reviewers can distinguish human-authored from AI-assisted content, and that AI output is held to the same quality bar.
