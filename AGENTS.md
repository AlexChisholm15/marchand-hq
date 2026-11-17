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
- **One app, one permanent home.** Never create a replacement application, duplicate production project, or new permanent URL without explicit authorization — new releases update the existing application.
- **Preserve the design language.** Don't change the established visual/design direction unless a redesign is specifically approved.
- **Never silently remove features, overwrite user history, or reset settings**, even when replacing the underlying code.

## Versioning

Use the application's current version as the starting point for every change. Never invent a version number or overwrite existing release history.

- **Incremental release** (e.g. V3.1 → V3.2 → V3.3): routine fixes, UI refinements, and smaller features. Multiple related fixes may ship together as one release.
- **Major release** (e.g. V3.4 → V4.0): significant new capability, an architectural change, or a substantial approved feature package.
- Agents recommend the version classification; the founder retains final authority.
- Use one consistent version reference across the app, release notes, and deployment record.
- The version advances only after a successful production release — never merely because work was proposed or tested.

## Commander Commands

The control layer over the Discuss → Bank → Preview → Verify → Ship workflow above. Interpret these consistently:

- **BANK IT** — Record the idea in this project's Idea Bank (its bank doc), preserving the description, intended benefit, and context. Do not implement or deploy. Status: `BANKED`.
- **BUILD IT** — Implement the specified scope in an isolated Testing Grounds (a feature branch and, where available, a preview deployment), preserving existing production functionality and data. Run relevant tests and prepare a reviewable Proposed Update (see below). Do not deploy to production. Status: `BUILDING` → `TESTED`.
- **APPROVE** — Accept the specific Proposed Update for a release. Approval alone does not authorize production deployment. Status: `APPROVED`.
- **REVISE** — Return the work to Testing Grounds with the founder's requested changes, preserving previous progress and context.
- **GO LIVE / SHIP UPDATE** — Authorize production release of the clearly identified, approved changes only. Deploy to the existing application's production environment and permanent URL. Never include unrelated or unapproved work. Verify the new version is actually live and functioning before reporting success. Status: `DEPLOYED` → `VERIFIED`.

If the release scope is ambiguous, identify the ambiguity rather than guessing.

**Operating principle:** the founder commands; agents build and verify; the founder approves; authorized changes ship to the same evolving product.

## Protected Release Procedure

Before every production release (triggered by GO LIVE / SHIP UPDATE):

1. Identify the actual current production deployment, project, source branch, commit, and version.
2. Check for newer changes, conflicting work, and automatic deployment triggers.
3. Confirm the proposed release contains only authorized changes.
4. Verify relevant automated tests, security checks, and existing functionality.
5. Confirm data changes are safe, backups are available where applicable, and the rollback path is understood.
6. Release to the existing production application.
7. Run production smoke tests, including authentication, critical workflows, and data persistence.
8. Record the version, commit, deployment ID, release time, changes, and rollback target.
9. Report what is verified and what remains uncertain.

Never declare a release successful merely because a deployment completed. If a security issue, destructive data change, source mismatch, or major regression is discovered, stop and report the blocker rather than proceeding. A rollback must protect user data — never blindly roll back a live database.

## Proposed Updates & Release Batches

Every Proposed Update must show: the app and requested outcome; what changed and why; benefits and visible user impact; tests performed and their results; security findings and risks; a preview link when safely available; the recommended version impact; and the exact decision needed from the founder.

Approved updates may be grouped into a Release Batch to reduce unnecessary deployments. A Release Batch must identify its exact included updates and pass integration testing before release. Banked ideas, unfinished work, and unrelated changes must never be included automatically.

## Handoffs & Continuity

- Maintain accurate handoffs and release history. Never erase or reinterpret historical version records.
- Before building, inspect the current production state, existing instructions, active work, and relevant handoffs.
- Don't restart completed work, rebuild entire apps, or duplicate features unnecessarily.
- Use the existing Banked → Approved → Building → Tested → Deployed → Verified vocabulary to distinguish where each item stands — don't invent alternate terms.

## Founder working style & reporting

The founder is product director: vision, priorities, and approval authority rest with them, not manual code management. Agents investigate, propose, build, test, document, and execute authorized releases. Every application is a continuously evolving product — preserve what exists and improve it incrementally. Applies to Claude Code and Codex.

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

**Founder View reporting**
- GREEN — Completed: what changed and what is verified.
- YELLOW — Attention: risks, failures, and unfinished work (omit if none).
- BLUE — Decision: what needs the founder's approval, or what should happen next.
- Mark each with a colored status icon per the Visual Clarity Standard where supported; otherwise use the plain text label.
- State the actual status: proposed, built, tested, deployed, or verified live. Include the working preview/production URL when relevant.
- Show useful evidence and links without overwhelming the founder with source code or technical logs.
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

## Agent handoffs

- **Before starting work**: read `docs/HANDOFF.md` (if present) and this file.
- **After finishing meaningful work**: update `docs/HANDOFF.md` — overwrite in place, don't accumulate history. Keep it short:
  - What changed
  - What was tested
  - What's unfinished
  - Current branch / PR
  - Exact next step

## Repo-specific notes

- Earliest-stage repo of the set (only `docs/LEGACY.md` exists currently). No bank doc yet — create `BUILD_BANK.md` (same status vocabulary as the other repos: Banked → Approved → Building → Tested → Deployed → Verified) when real build work starts here.
- Review `docs/LEGACY.md` before making assumptions about prior context.

---
*This file is the single source of truth for agent instructions in this repo. `CLAUDE.md` only points here.*
