# WRITEUP — GLP-1 Eligibility Screening

## Architecture Overview

### Monorepo Structure
I chose a pnpm workspace monorepo with three packages:
- `packages/shared` — pure TypeScript with zero runtime dependencies. Contains the form schema JSON, shared types, and the eligibility evaluator function. This allows the frontend to import types/schema at build time and the backend to import the evaluator at runtime without duplication.
- `apps/api` — NestJS 11 with Prisma 6 for database access. Thin service layer that persists answers and delegates all eligibility logic to `@glp1/shared`.
- `apps/web` — Next.js 15 App Router frontend with Zustand for client state, Tailwind for styles.

### Key Design Decisions

**Pure Evaluator Function**
The `evaluateEligibility()` function in `@glp1/shared` is intentionally pure (no side effects, no I/O). This made it trivial to achieve 100% branch coverage with unit tests and enabled the same function to run in both the API (server-side final evaluation) and the shared package (for documentation/schema reference).

**State Persistence Strategy**
- Zustand store + `localStorage` for optimistic client state (survives refresh without network round-trip)
- Backend session + answers table as source of truth
- On page load: if `sessionId` exists in localStorage → hydrate from API → restore state. If API returns 404 (stale session), reset to start.

**BMI as a Computed Step**
Screen 4 (BMI) is never shown to the user — it's computed server-side after step 3 (height) is submitted. The API calculates `weight / (height/100)²`, stores it as step 4, and immediately returns the correct next step based on the BMI branch. This keeps the form schema consistent (15 screens, 4 is `type: 'computed'`) while hiding the computation from the UI.

---

## Spec Ambiguities and Resolutions

### 1. Screen 9 — Blood Pressure multi-select vs. mutually exclusive reality
**Spec:** Screen 9 is a `checkbox` (multi-select), but blood pressure readings are physiologically mutually exclusive.

**Resolution:** The UI allows multi-select as specified. The evaluator uses the **highest-severity selection**: hypertensive_crisis > stage2 > stage1 > elevated > normal. This is documented in `edge-cases.spec.ts` which asserts that selecting both "Normal" and "Hypertensive Crisis" results in Clinical Review (not Eligible).

### 2. GLP-1 — Ineligible (Screen 15 summary) vs. Clinical Review (Screen 10 logic)
**Spec:** The Screen 15 rules summary lists "GLP-1 receptor agonist currently used" under "Immediate Ineligibility". However, Screen 10 explicitly states "Clinical Review Required — Already On GLP-1 Therapy".

**Resolution:** Screen 10's per-screen logic takes precedence. Clinical Review is more medically appropriate — a patient already on GLP-1 medication needs a prescriber review before switching or adding therapy, not a flat rejection. The evaluator returns `{ outcome: 'clinical_review', reason: 'Already On Therapy' }`.

### 3. "Daily alcohol + moderate/high risk factors" — undefined criteria
**Spec:** The evaluator should trigger Clinical Review for "daily alcohol + moderate or high risk factors" but the spec doesn't define what constitutes moderate/high risk.

**Resolution:** Defined conservatively as: `smoking === 'yes' OR bloodPressure includes stage1/stage2 OR comorbidities.length >= 2`. This is documented in the evaluator source code and tested explicitly.

### 4. Age > 75 — "Proceed with caution" vs. immediate end
**Spec:** Screen 1 says for age > 75: "Proceed with caution → Clinical Review Required". This is ambiguous: end the form immediately or continue collecting data?

**Resolution:** Continue through all 15 screens to collect the full clinical picture. The `evaluateEligibility()` function returns Clinical Review if `age > 75` (after checking all ineligibility conditions). This gives the clinician a complete picture. If the age was < 18 (hard stop), the flow terminates immediately — the distinction is deliberate.

### 5. Checkbox screens with no options selected
**Spec:** Screens 6 (comorbidities), 10 (medications), and 14 (dietary habits) use checkbox inputs. It's unclear if "none selected" is valid.

**Resolution:** These screens allow an empty selection (interpreted as "none of the above"). The UI provides a "Skip" button for these screens. The evaluator treats an empty array as no relevant risk factors for that dimension.

---

## Testing Strategy

### Unit Tests (`packages/shared`)
- 43 tests on `evaluateEligibility()` with 100% branch coverage
- 22 tests on form schema structure + snapshot

### Unit Tests (`apps/api`)
- 11 tests on `SessionService` — mocked Prisma using direct class instantiation
- 7 tests on `SessionController` — same pattern

**Note on NestJS + Vitest:** Vitest uses esbuild which doesn't emit TypeScript decorator metadata. `@nestjs/testing`'s DI container relies on `reflect-metadata` for DI injection tokens. The fix is to bypass the container entirely and use `new SessionService(mockPrisma)` — this is faster anyway.

### Unit Tests (`apps/web`)
- 16 tests on UI components (ProgressBar, RadioInput, CheckboxInput, NumberInput, ResultScreen)
- @testing-library/react with jsdom

### E2E Tests (`apps/web/e2e`)
- `happy-path.spec.ts` — completes all 15 screens → Eligible
- `terminal-states.spec.ts` — underage, pregnant, already on GLP-1
- `mid-flow-refresh.spec.ts` — refresh mid-form → session resumes
- `edge-cases.spec.ts` — BP multi-select highest severity wins

---

## AI Tool Usage

This project was built with GitHub Copilot CLI:
- Used to scaffold boilerplate (NestJS module/service/controller structure, Next.js component skeletons)
- Helped generate comprehensive test case matrices for the eligibility evaluator
- Used to draft the Prisma schema and migration
- All business logic (eligibility rules, branching decisions, ambiguity resolutions) was authored by the developer

All AI-generated code was reviewed and modified as needed.

---

## Trade-offs and Known Limitations

1. **No authentication** — Sessions are identified by a random CUID. Anyone with the session ID can access/modify that session. For production, this would require auth.

2. **No rate limiting** — The API has no rate limiting. For production, add `@nestjs/throttler`.

3. **BMI precision** — BMI is computed with full float precision and compared with simple `>` / `<` operators. Clinically, BMI is typically rounded to one decimal place. The current implementation is more conservative.

4. **Docker not tested locally** — Docker was not available in the development environment. The `docker-compose.yml` was written to spec and follows standard patterns but was not run end-to-end.

5. **Next.js 15 + Zustand persist** — The `persist` middleware requires client-side localStorage access. Pages that render on the server don't have access to persisted state until hydration, so the initial render shows a loading spinner. This is expected behavior.
