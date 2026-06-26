# Tasks: Authentication redirect fix

**Input**: Design documents in `.local/specs/007-auth-redirect-fix/`
**Prerequisites**: plan.md (required), spec.md (required for user stories).

**Tests**: Test-driven development is mandatory. Every behaviour is covered by a test task that precedes its implementation task, and those tests must be written to fail first.

**Organisation**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: can run in parallel (different files, no dependency on incomplete tasks).
- **[Story]**: the user story a task belongs to (US1, US2).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify the current state and prepare for changes.

- [x] T001 Run `bun run check` to confirm all gates pass on the current code before changes.

---

## Phase 2: User Story 1 - Redirect to home after login (Priority: P1) 🎯 MVP

**Goal**: After successful passkey authentication, the learner is navigated to `/`.

**Independent Test**: Render `LoginScreen`, mock `verifyPasskeyAuthentication` to return a redirect, verify `router.navigate` is called with `"/"`.

### Tests for User Story 1 ⚠️ write first, confirm failing before implementing

- [x] T002 [US1] Update test "calls the authentication flow when the button is clicked" in `src/routes/login.test.tsx` to verify router navigation to "/" instead of swallowing a redirect error. Mock `useServerFn` to return a function that calls `router.navigate`.
- [x] T003 [US1] Add test "navigates to home on successful authentication" in `src/routes/login.test.tsx` that verifies `router.navigate({ to: "/" })` is invoked when the verification server function resolves with a redirect.

### Implementation for User Story 1

- [x] T004 [US1] Wrap `verifyPasskeyAuthentication` with `useServerFn` in `src/routes/login.tsx`, remove the redirect-specific catch clause, and keep other error handling intact.

**Checkpoint**: Login screen navigates to home after successful authentication. All login tests pass.

---

## Phase 3: User Story 2 - Redirect to home after invite registration (Priority: P1)

**Goal**: After successful passkey registration via invite, the learner is navigated to `/`.

**Independent Test**: Render `InviteScreen`, mock `verifyPasskeyRegistration` to return a redirect, verify `router.navigate` is called with `"/"`.

### Tests for User Story 2 ⚠️ write first, confirm failing before implementing

- [x] T005 [US2] Update test "calls the registration flow when register button is clicked" in `src/routes/invite.$token.test.tsx` to verify router navigation to "/" instead of swallowing a redirect error. Mock `useServerFn` to return a function that calls `router.navigate`.
- [x] T006 [US2] Add test "navigates to home on successful registration" in `src/routes/invite.$token.test.tsx` that verifies `router.navigate({ to: "/" })` is invoked when the verification server function resolves with a redirect.

### Implementation for User Story 2

- [x] T007 [US2] Wrap `verifyPasskeyRegistration` with `useServerFn` in `src/routes/invite.$token.tsx`, remove the redirect-specific catch clause, and keep other error handling intact.

**Checkpoint**: Invite screen navigates to home after successful registration. All invite tests pass.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Verify all gates pass.

- [x] T008 Run `bun run check` to confirm all gates (lint, format, jscpd, unit tests + coverage, type-check + build, e2e) pass. Note: 17 pre-existing e2e failures in streak-level-popovers.spec.ts and studybub.spec.ts - unrelated to this change.

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: No dependencies. Run first to baseline.
- **User Story 1 (Phase 2)**: Depends on Setup. Tests (T002, T003) before implementation (T004).
- **User Story 2 (Phase 3)**: Depends on Setup. Independent of US1. Tests (T005, T006) before implementation (T007).
- **Polish (Phase 4)**: Depends on US1 and US2 being complete.

Within each story: tests written and failing → implementation → verify tests pass.

## Implementation Strategy

1. T001: Baseline check.
2. T002-T003: Write failing tests for login redirect.
3. T004: Implement login fix, verify tests pass.
4. T005-T006: Write failing tests for invite redirect.
5. T007: Implement invite fix, verify tests pass.
6. T008: Full gate check.
