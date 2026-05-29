# W1: Foundation Domain And Map

**Status**: DONE
**Entry**: Parent engine-module direction is documented; Foundation MVP initiative exists.
**Exit**: Foundation has a module skeleton, semantic-free map primitive, terrain query layer, plain player record, and fixed-radius placement domain with tests.
**Parallelization**: 2 parallel tracks after S1.1: Track A = S1.2 map primitive, Track B = S1.3 player/placement domain, then S1.4 joins with tests.
**Deliverables**: D1, D2, D6

## Tickets

- S1.1-foundation-skeleton.md
- S1.2-engine-tile-map.md
- S1.3-player-placement-domain.md
- S1.4-domain-map-tests.md

## Exit Criteria

- [x] `src/games/foundation` exists with clean internal boundaries.
- [x] Foundation map base has no semantic terrain methods.
- [x] Fixed-radius placement claims valid in-bounds tiles and updates owner state.
- [x] Domain/map tests pass.

## Working Notes

- Completed Foundation W1 domain/map groundwork only.
- Verification: `npx vitest run tests/games/foundation/map.test.ts tests/games/foundation/placement.test.ts` passed.
- Verification: `npx tsc --noEmit` passed.
