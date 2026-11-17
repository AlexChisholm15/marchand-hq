# Marchand production integration — 2026-11-17
Base: deployed 5470f20a49a6c5cbb76e0a182d6fd7267ea5e76a / dpl_GMJzoHbdJfL5HQnTLHq7245hjNc1. main is documentation-only.
Compared divergent fa6cd66 branch; selected signed-cookie auth, scoped task selection, staff-only Studio, visible draft/store persistence failures. Kept production Team Home/Community, custom palette picker, finance and existing navigation; did not import guided-tour redesign. Existing branches intact.
All 8 test files and production build/type validation pass locally. Runtime page/API auth checks pending. Preview-only auth config names exist; values never read.
Existing intelligence POST route uses OpenAI Responses, validates and limits sample context, 20s timeout, 450 output tokens, read-only sample instructions, clean errors. OPENAI_API_KEY absent; smallest enablement step is secure preview credential setup plus separately approved paid-test budget. No real AI calls made. Shared lab gate does not provide tenant/role security for real records.
No production release authorized.
