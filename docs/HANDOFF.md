# Marchand HQ — 2026-11-17, connected home record (PR #8)

**Base (unchanged, still true):** production deployed `5470f20` / `dpl_GMJzoHbdJfL5HQnTLHq7245hjNc1`. `main` is documentation-only. Auth integration (signed-cookie session, staff-only Studio, visible storage-failure warnings) landed on `integration/production-auth-reliability-20261117` at `0b08de1`; 8 test files + build/typecheck passed locally, hosted preview checks (307 to `/login`, 401 on the API) passed on an isolated preview; **no production release authorized yet**. Intelligence route still has no `OPENAI_API_KEY`; honest 503 fallback, no real AI calls, no cost.

**This branch (`feature/connected-home-record`, PR #8 → `integration/production-auth-reliability-20261117`):** one buyer-requested change (e.g. the shower upgrade) now flows as one versioned `Change` record through Quote Studio (lines/total + structured install spec, entered once), the buyer's approval, the PM's install card (spec/lot/location/revision, no cost), and the office's closing adjustment (source change + delta on a revision). A later revision can supersede an earlier one without double-counting the closing amount or leaving duplicate tasks — see `Change.supersedes`, `isSuperseded`/`activeApprovedChanges` in `src/lib/engine.ts`.

**What was tested:** `npm run typecheck` clean; `npm test` 58/58 (52 pre-existing + 6 new in `tests/connected-home.test.ts`); `npm run build` succeeds. Playwright click-through at desktop and iPhone width against an isolated local session (throwaway lab-auth secrets, not shared credentials): happy path, declined revision (original untouched), approved revision (supersedes original, one active spec, no duplicate task), refresh/role-switch/repeat-tap, unrelated second home. No hosted/Vercel preview from this session (no Vercel access here) — local build only.

**What's unfinished:** the Changes *list* row still shows a plain "Approved" pill for a superseded change until opened (the detail sheet already says "Superseded by CO #N") — minor, noted as a follow-up in the PR, not fixed here.

**Current branch / PR:** `feature/connected-home-record` → draft PR [#8](https://github.com/AlexChisholm15/marchand-hq/pull/8) against `integration/production-auth-reliability-20261117`. Not merged, not deployed.

**Exact next step:** founder review of PR #8. On approval, merge into the integration branch (still gated behind the separate auth-integration release decision) — do not deploy or merge without that explicit instruction.
