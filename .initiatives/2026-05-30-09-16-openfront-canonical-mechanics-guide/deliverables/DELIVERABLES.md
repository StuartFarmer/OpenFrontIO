# Deliverables

## D1: Canonical Source Map
**Outcome**: A source-index chapter that pins the guide to `main@782702c1d6c8614f2c44590584b0b34c1016020d` and maps mechanics families to exact files, tests, and asset inputs.
**Demo**:
`npm run docs:build`
**Acceptance Checks**:
- [x] `docs/canonical-mechanics/SourceIndex.md` exists and groups canonical files by mechanics family.
- [x] The source index states the canonical ref and explains that the active branch may differ.
- [x] The source index includes tests and map assets, not only runtime files.
**Dependencies**: Existing analysis report and detached `main` worktree.
**Notes**: This deliverable protects the rest of the guide from branch drift.

## D2: mdBook Mechanics Skeleton
**Outcome**: The existing mdBook has a canonical mechanics section with stable chapter files and navigation.
**Demo**:
`npm run docs:build`
**Acceptance Checks**:
- [x] `docs/SUMMARY.md` links the canonical mechanics section.
- [x] Every linked guide chapter exists and has a clear scope note.
- [x] Existing docs remain linked and are not overwritten.
**Dependencies**: D1.
**Notes**: Use a dedicated `docs/canonical-mechanics/` subtree to avoid mixing modified-branch docs with canonical mechanics.

## D3: Core Rules Chapters
**Outcome**: Core chapters cover data model, map and terrain, engine loop, spawning, territory expansion, combat, economy, and win conditions with source-backed formulas.
**Demo**:
`npm run docs:build`
**Acceptance Checks**:
- [x] Chapters cite canonical source files and line numbers from `main@782702c1`.
- [x] Numeric constants and formulas identify units such as ticks, tiles, troops, resources, or gold.
- [x] Human, bot, nation, and Terra Nullius behavior are distinguished where rules differ.
**Dependencies**: D1, D2.
**Notes**: These chapters are the minimum useful "equal implementation" reference.

## D4: Advanced Systems Chapters
**Outcome**: Advanced chapters cover structures, units, naval systems, rail/trade, nukes/SAMs, diplomacy, nation AI, UI command surfaces, and test evidence.
**Demo**:
`npm run docs:build`
**Acceptance Checks**:
- [x] Each advanced system identifies execution classes, state transitions, and tests.
- [x] AI nation behavior has its own chapter.
- [x] Nuke/SAM and warship chapters include ordered lifecycle notes, not only constants.
**Dependencies**: D1, D2, D3.
**Notes**: This is where most procedural behavior lives.

## D5: Verification And Maintenance Notes
**Outcome**: The guide has build verification, source-baseline notes, and a maintenance procedure for refreshing canonical references.
**Demo**:
`npm run docs:build`
**Acceptance Checks**:
- [x] mdBook build succeeds.
- [x] A maintenance chapter explains how to inspect canonical `main` without overwriting current branch changes.
- [x] Known limitations and follow-up extraction opportunities are recorded.
**Dependencies**: D1-D4.
**Notes**: No runtime code should be changed for this initiative unless docs scripts are broken.
