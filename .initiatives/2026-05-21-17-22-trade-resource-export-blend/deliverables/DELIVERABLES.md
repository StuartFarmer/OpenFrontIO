# Deliverables

## D1: Shared Trade Blend Helper
**Outcome**: A reusable resource helper converts a scalar trade value into a Biomass/Fuels/Metals payload based on an exporter stockpile.
**Demo**:
`npx vitest run tests/core/game/Resources.test.ts`
**Acceptance Checks**:
- [x] Blended payload totals equal the input trade value.
- [x] Rounding remainder is assigned deterministically.
- [x] Zero-resource exporters fall back to an even split.
**Dependencies**: None
**Notes**: Keep `resourcesFromGoldAmount` unchanged for legacy compatibility paths.

## D2: Train Trade Uses Exporter Blend
**Outcome**: Train stops award blended resources based on the train owner's current stockpile.
**Demo**:
`npx vitest run tests/core/game/TrainStation.test.ts`
**Acceptance Checks**:
- [x] Internal train trade uses the train owner's own blend.
- [x] External station-owner payout uses the train owner's blend.
- [x] Train stats still receive the scalar trade value.
**Dependencies**: D1
**Notes**: Compute the blended payload before any recipient `addResources` call.

## D3: Ship Trade Uses Exporter Blend
**Outcome**: Trade ships award blended resources based on the source/exporting player's current stockpile.
**Demo**:
`npx vitest run tests/core/executions/TradeShipExecution.test.ts`
**Acceptance Checks**:
- [x] Source and destination owners receive payloads based on the source owner's blend.
- [x] Captured ship payout behavior is covered by an explicit test.
- [x] Ship stats and distance-based trade value remain unchanged.
**Dependencies**: D1
**Notes**: Captured ship blend source should be confirmed or documented during implementation.

## D4: Type Safety And Regression Pass
**Outcome**: The trade conversion is type-safe and does not regress nearby resource, construction, or AI behavior.
**Demo**:
`npx vitest run tests/core/game/Resources.test.ts tests/core/game/TrainStation.test.ts tests/core/executions/TradeShipExecution.test.ts tests/economy/ConstructionGold.test.ts tests/core/configuration/ResourceCapacity.test.ts tests/NationStructureBehavior.test.ts`
**Acceptance Checks**:
- [x] Focused economy and AI tests pass.
- [x] `npx tsc --noEmit` passes.
- [x] No unrelated uncommitted files are reverted or rewritten.
**Dependencies**: D1, D2, D3
**Notes**: Include the current AI changes in validation because they are already in the worktree.
