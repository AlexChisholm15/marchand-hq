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

## Founder working style & reporting

The project owner is a product-focused, non-technical founder who directs outcomes and does not manage code directly. Applies to Claude Code and Codex.

**Communication**
- Keep responses short, conversational, and easy to scan. Don't dump code, terminal output, logs, or long implementation narratives unless asked.
- Preserve meaningful details: actual features, tradeoffs, risks, regressions, blockers, decisions, and test results.
- Explain technical problems in plain English and why they matter.
- Use status indicators per the Visual Clarity Standard below (not emoji).
- On long jobs, give brief milestone updates only when useful.
- Don't interrupt with questions answerable by inspection. Ask only when a decision genuinely needs the founder.

**Execution**
- Read these shared rules, existing project context, and the latest handoff before working.
- Preserve working features, data, design decisions, and the existing production URL.
- Prefer surgical changes over rebuilding.
- Use existing branches and previews; don't create unnecessary copies.
- Test the changed interaction and relevant existing functionality.
- Keep deep technical detail in PRs, test evidence, and handoffs — available when needed, not forced into chat.
- Never imply a successful build proves a feature works.

**End-of-task report**
- GREEN — what changed and what works.
- YELLOW — important limitations, risks, or unverified items (omit if none).
- BLUE — what's next, including any decision needed from the founder.
- Mark each with a colored status icon per the Visual Clarity Standard where supported; otherwise use the plain text label.
- State the actual status: proposed, built, tested, deployed, or verified live. Include the working preview/production URL when relevant.
- For substantial work, include enough detail that the founder understands exactly what was gained — don't artificially cap findings at three bullets.

**Scope**: Open PRs for review. Do not merge, deploy, or change application functionality beyond what's explicitly requested.

## Visual Clarity Standard

Applies to any surface that can render rich content (artifacts, rendered Markdown, UI). If the surface is plain text only, skip straight to clean text — never fake the visuals.

- Use crisp, colorful Lucide-style line icons wherever supported. Never standard emoji, unless explicitly requested.
- Use charts, graphs, diagrams, dropdowns, selectors, and interactive controls naturally when they make something easier to understand or act on — not for decoration.
- Keep answers compact, beautiful, dark-mode friendly, and easy to scan.
- Preserve important details. Never sacrifice useful information for minimalism.
- Avoid giant cards, unnecessary scrolling, overwhelming technical output, and fake interactions.
- For simple questions, just answer naturally.
- If the interface can't support visual elements, use clean text instead.

## Repo-specific notes

- Earliest-stage repo of the set (only `docs/LEGACY.md` exists currently). No bank doc yet — create `BUILD_BANK.md` (same status vocabulary as the other repos: Banked → Approved → Building → Tested → Deployed → Verified) when real build work starts here.
- Review `docs/LEGACY.md` before making assumptions about prior context.

---
*This file is the single source of truth for agent instructions in this repo. `CLAUDE.md` only points here.*
