# Legacy source (V3 to V5)

V6 is a clean rebuild. The old app is not in this repo.

## Why
- The production source was deployed with the Vercel CLI and was never committed to Git.
- The Vercel connector returns only ~2 KB per file, so 55 of 64 source files could not be recovered in full.
- The Drive "Marchand HQ Build Transfer" folder holds a Nov 13 V3 copy, older than production.
- V6 replaces every screen, so porting the layered UI was not worth it.

## Archive
- Frozen production deployment: `dpl_Z8CSU1qVjVWB5NAGKM2AD1VBWGdK` (project `marchand-hq-v2`, team `alexs-projects-4be04152`).
- It stays reachable at its immutable deployment URL. It is the rollback target.
- It is deliberately NOT linked from V6: old screens contain real customer data.

## Logic carried forward (re-implemented and re-tested in V6)
- `finance.mjs` forecast engine: deposits never double count, unsold homes have no closing proceeds, delays move timing not contract value, cash and credit stay separate.
- `engine-rules.mjs` approval and role-matching ideas.
- `mh-icon.ts` monogram icon (rebuilt as SVG, test fixed).
