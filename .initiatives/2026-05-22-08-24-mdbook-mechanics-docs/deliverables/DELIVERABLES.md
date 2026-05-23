# Deliverables

## D1: mdBook Foundation
**Outcome**: The repository has a pinned, documented mdBook workflow with book configuration, npm scripts, and a first navigable docs tree that preserves existing Markdown docs.
**Demo**:
`npm run docs:build`
**Acceptance Checks**:
- [ ] `book.toml` and `docs/src/SUMMARY.md` define a working mechanics documentation book.
- [ ] Existing docs are reachable from the book without losing their current content.
- [ ] Local setup explains how to install the pinned mdBook version.
**Dependencies**: None
**Notes**: mdBook remains a rendering tool; game code should not depend on Rust tooling.

## D2: Mechanics Metadata And Generator
**Outcome**: A TypeScript-owned mechanics metadata model and generator can produce mdBook Markdown from side-effect-free code exports.
**Demo**:
`npm run docs:generate`
**Acceptance Checks**:
- [ ] Mechanics metadata supports categories, labels, values, units, descriptions, formulas, source paths, and notes.
- [ ] Generated Markdown is deterministic and formatted consistently.
- [ ] Generator tests cover ordering, table rendering, formula rendering, and stale-output behavior.
**Dependencies**: D1
**Notes**: Avoid AST scraping as the primary approach. Prefer explicit metadata that code can consume.

## D3: Initial Core Mechanics Coverage
**Outcome**: The first generated mechanics chapters cover the main balance surfaces in core without changing gameplay behavior.
**Demo**:
`npm run docs:generate && npm run test -- --run tests/core/configuration`
**Acceptance Checks**:
- [ ] Unit and structure costs, construction durations, upgrades, and caps are documented from code-owned metadata.
- [ ] Economy, troop growth, resource capacity, resource regeneration, and terrain production are documented.
- [ ] Combat, spawn, diplomacy, donation, nuke, SAM, and warship values are documented or explicitly marked as formula-backed.
**Dependencies**: D2
**Notes**: Preserve existing `Config` APIs while moving simple values behind metadata.

## D4: Adjustable Parameter Catalog
**Outcome**: Lobby and single-player adjustable parameters are documented from a shared metadata surface aligned with schema validation and UI defaults.
**Demo**:
`npm run docs:generate && npm run build-prod`
**Acceptance Checks**:
- [ ] `GameConfig` fields with player-facing balance effects have documented defaults, min/max bounds, units, and gameplay meaning.
- [ ] Generated docs distinguish runtime rules from lobby-adjustable settings and host cheats.
- [ ] UI/schema changes do not require manually editing parameter docs.
**Dependencies**: D2
**Notes**: Metadata must stay browser-safe and side-effect-free if imported by client UI.

## D5: Drift Checks And CI Integration
**Outcome**: CI can verify mdBook generation, docs freshness, and relevant TypeScript/test safety for mechanics documentation changes.
**Demo**:
`npm run docs:check && npm run lint && npm run test -- --run`
**Acceptance Checks**:
- [ ] `docs:check` fails when generated mechanics docs are stale.
- [ ] CI installs or provisions the pinned mdBook version before building docs.
- [ ] Validation covers docs generation, type safety, formatting, and focused mechanics tests.
**Dependencies**: D1, D2, D3, D4
**Notes**: Keep docs checks scoped enough that ordinary game changes get clear failures and fixes.
