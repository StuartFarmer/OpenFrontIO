# W1: Runtime Front Contract

**Status**: DONE
**Entry**: Analysis complete; current runtime uses clicked target distance for all front concentration.
**Exit**: Command payload and domain share calculation support uniform and focused modes with tests.
**Parallelization**: Sequential (1 owner) because protocol, router, and domain share helpers touch the same command path.
**Deliverables**: D1, D2

## Tickets

- S1.1-command-front-contract.md
- S1.2-front-share-modes.md
- S1.3-runtime-behavior-tests.md

## Exit Criteria

- [x] Grow command can carry front mode and normalized focus.
- [x] Plain click can be represented as uniform expansion.
- [x] Focused mode applies `wildernessDistanceFocus` as max concentration sharpness.

## Working Notes

- 2026-06-08: Completed W1 runtime contract and behavior tests.
- 2026-06-08: Validation passed with `npx vitest run tests/games/foundation/runtime.test.ts` and `npx vitest run tests/games/foundation/wilderness_elevation.test.ts`.
