# W1: Schema And Engine

**Status**: DONE
**Entry**: Initiative analysis accepted; no page implementation started.
**Exit**: Portable graph schema, food template fixture, compiler, and simulator are covered by focused unit tests.
**Parallelization**: 2 parallel tracks after S1.1: Track A = S1.2 schema/templates, Track B = S1.3 compiler/simulator spike; S1.4 joins them.
**Deliverables**: D1, D2 foundation, D5 template foundation.

## Tickets

- S1.1-dynamics-module-skeleton.md
- S1.2-schema-and-template-types.md
- S1.3-compiler-and-simulator-core.md
- S1.4-food-stock-template-fixture.md

## Exit Criteria

- [x] Dynamics graph schema is versioned and framework-neutral.
- [x] Food-stock template compiles and simulates without React Flow.
- [x] Tests prove stock delta and overflow behavior.

## Working Notes

- 2026-06-05: Started W1 execution.
- 2026-06-05: Completed S1.1-S1.4.
- 2026-06-05: Verified W1 with `npx vitest run tests/core/systems/dynamics` and `npx tsc --noEmit`.
