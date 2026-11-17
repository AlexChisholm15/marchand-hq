# Build bank

## 2026-11-17 — Global browser-save warning
Approved → Building. Founder: “Fix up portico and mh … the easy stuff.”
The demo provider silently catches storage failures although Quote Studio already warns for its separate drafts. Add a global failure alert and retry for role/preferences/task-event persistence. Keep existing storage key, auth, finance and demo records unchanged. Base: fa6cd66, existing isolated demo reliability branch. No production release authorized.

2026-11-17: easy save-warning scope Tested (code-level). Browser review pending; not Deployed or Verified.

## 2026-11-17 production integration
Approved → Tested (code/build): verified production base, selected auth/reliability, preserve Team Home and palette picker. Runtime preview tests pending.
Proposed: production tenant auth, shared persistent records, AI rate limiting and provider budget. Not implemented.
