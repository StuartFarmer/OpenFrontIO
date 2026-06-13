# W0: 1x1 Placeable Contract

**Status**: DOING
**Entry**: Initiative analysis is complete.
**Exit**: Farmland semantics and transport/model choices are documented enough for implementation.
**Parallelization**: Sequential (1 owner)
**Deliverables**: D1

## Tickets

- S0.1-placeable-model-decision.md
- S0.2-paint-intent-contract.md

## Exit Criteria

- [x] Farmland is confirmed as `UnitType` or a separate tile-overlay model.
- [x] Painting uses either repeated `build_unit` intents or a new batched intent by explicit decision.
- [x] Validation, production, cost, and upgrade semantics are recorded before code work begins.

## Working Notes

- Farmland will be implemented as a normal `UnitType` in the player-buildable/structure domain.
- Painting will emit repeated existing `build_unit` intents, one per accepted tile.
- Contract recorded in `CONTRACT.md`.
