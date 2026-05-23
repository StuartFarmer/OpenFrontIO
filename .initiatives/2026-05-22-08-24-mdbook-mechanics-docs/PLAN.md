# Plan: mdBook Mechanics Documentation

**Stack**: TypeScript, npm, Vite, Vitest, Lit client UI, deterministic `src/core`, GitHub Actions, mdBook binary
**Created**: 2026-05-22 08:24

## Summary
- Deliverables: 5
- Waves: 4
- Tickets: 14

## Execution Order
1. W1: mdBook Foundation
2. W2: Metadata And Generator
3. W3: Core Mechanics Coverage
4. W4: Adjustable Parameters And CI

## Links
- `INITIATIVE.md`
- `REPORT.md`
- `deliverables/DELIVERABLES.md`
- `waves/todo/`
- `tasks/todo/`

## Implementation Spine

1. Add mdBook as a thin, pinned docs rendering workflow around existing Markdown.
2. Add a TypeScript mechanics metadata model and generator before moving significant values.
3. Populate high-value mechanics domains from code-owned metadata while preserving `Config` APIs.
4. Add adjustable `GameConfig` parameter metadata and generated docs.
5. Add CI drift checks so generated docs stay current.

## Parallelism Model

- W1 is sequential because docs layout and npm scripts are shared.
- W2 allows generator and validation work to proceed in parallel after the metadata model exists.
- W3 allows metadata population by gameplay domain, but any shared `Config.ts` edits should be coordinated through the join ticket.
- W4 allows adjustable-parameter metadata and book navigation polish in parallel before CI joins them.

## MVP Boundaries

- Do not rebalance game mechanics.
- Do not require mdBook for normal game build/test/dev commands.
- Do not make generated Markdown the source of gameplay behavior.
- Do not rely on broad TypeScript AST scraping for the first generator.
- Do not import browser-only modules from docs generation scripts.
