# Engineering Instructions (Claude Code & Codex)

These rules apply to any AI agent (Claude Code, Codex, or other) working in this repository. They are permanent — follow them on every task unless the user explicitly overrides them for that task.

## Workflow: Discuss → Bank → Preview → Verify → Ship

1. **Discuss** — Understand the request. Inspect existing code/docs before proposing changes. Ask only if a critical detail is genuinely missing.
2. **Bank** — Record the proposed idea/change in this repo's bank/status doc (see "Repo-specific notes" below) before building, using that doc's status vocabulary. Banked ≠ authorized to build.
3. **Preview** — Before shipping, show the exact diff or file content that will change. No surprise rewrites.
4. **Verify** — Test the actual change (not just "it compiles"). State what was tested and the result. Never claim something works without checking it.
5. **Ship** — Commit with a clear message. Do not deploy or push to production unless explicitly asked.

## Non-negotiable safety rules

- **Preserve existing code, data, and deployments.** Never delete, rewrite wholesale, or silently break working functionality.
- **Inspect before editing.** Read the current file/section before changing it. Make surgical edits — do not regenerate whole files for small changes.
- **No functionality changes without being asked.** Do not add features, refactor, or "improve" scope beyond what was requested.
- **No deploys.** Do not trigger, push to, or modify production deployments, CI/CD, or release pipelines unless explicitly instructed for that specific action.
- **No secrets.** Never commit API keys, tokens, passwords, or private financial/user data to this repository.
- **Flag, don't silently fix, architectural or scope conflicts.** Surface them and ask.

## Agent handoffs

- **Before starting work**: read `docs/HANDOFF.md` (if present) and this file.
- **After finishing meaningful work**: update `docs/HANDOFF.md` — overwrite in place, don't accumulate history. Keep it short:
  - What changed
  - What was tested
  - What's unfinished
  - Current branch / PR
  - Exact next step

## Tool parity (Claude Code & Codex)

- Do not add tool-specific hidden configuration (e.g. `.claude/`, `.cursorrules`, `.windsurfrules`) that changes behavior for one agent but not another, without mirroring the same rule here in `AGENTS.md`.
- Before claiming Codex (or any other agent) is "tested" or "compliant" against this file, confirm it actually produced output that was checked against these rules — don't assume parity with Claude Code without evidence.
- Before trusting that a deployed/production environment matches a given branch, verify the actual deployment's commit SHA — git-connected auto-deploy is not guaranteed to be wired up correctly just because a production URL exists.

## Repo-specific notes

- Earliest-stage repo of the set (only `docs/LEGACY.md` exists currently). No bank doc yet — create `BUILD_BANK.md` (same status vocabulary as the other repos: Banked → Approved → Building → Tested → Deployed → Verified) when real build work starts here.
- Review `docs/LEGACY.md` before making assumptions about prior context.
- **`main` does not contain the live application.** Per a 2026-11-16 audit, `main` holds only `docs/LEGACY.md` plus the shared template — the actual production deployment (`marchand-hq-v2.vercel.app`, confirmed via the Vercel API) is built from a separate feature/sprint branch, not `main`. Before assuming "nothing is built yet," confirm which branch is actually live.

---
*This file is the single source of truth for agent instructions in this repo. `CLAUDE.md` only points here.*
