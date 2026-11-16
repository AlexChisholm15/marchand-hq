# Marchand HQ — Jeff / Scott five-minute demo QA

**Environment:** isolated preview, not production. **Data:** sample only.
**Baseline:** `fix/demo-reliability-20261116`.
**Evidence:** source-contract tests cover navigation and guardrails; live browser interactions require human or interactive browser verification.

## Rehearsal sequence
1. **Jeff / Owner pulse:** open Home, select Jeff, inspect urgent decisions and project health. Check role label, next action, and demo-only disclosures.
2. **Scott / Operations:** use the five-minute walkthrough to switch to Scott and open Site Issues. Confirm role, add one harmless sample issue, resolve/reopen it, then refresh.
3. **One home:** open a sample home, inspect status, change history and relevant tasks. Follow a task link and confirm the correct task opens under the correct role.
4. **Quote Studio:** switch to Jeff; add a sample line (2 × $125.50). Expect subtotal $251.00, demo HST 14% = $35.14, total = $286.14. Confirm save locally, export sample CSV, reopen and check persisted line. Never use real client data.
5. **Closing:** switch to Scott, open Closing Desk, toggle one sample checklist item, reload and verify its saved state.
6. **Floating Ask Marchand:** open the bottom-right assistant and ask "What needs me today?" Verify an instant sample-data answer. If provider AI is configured, inspect its separately labeled response; otherwise expect the honest demo fallback.

## Failure scenarios
- Block local storage: must display a visible warning, not pretend the draft saved.
- Attempt `/studio` as homeowner or realtor: must show role-access notice instead of owner sample projects.
- Open `/?task=<id>` from Decision Desk: must retain the valid selected task.
- Narrow/mobile view: task sheet, Quote Studio controls, and floating assistant must remain usable.

## Release gate
Do not promote to production until the interactive walkthrough, mobile layout, browser-local persistence, and API fallback have been inspected. Existing deployment build/test success alone does not establish these outcomes.
