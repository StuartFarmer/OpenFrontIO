# Deliverables

## D1: Delivery-Time Manifest Math
**Outcome**: A pure, tested helper calculates resource-conserving trade manifests from sender surplus, receiver deficit, receiver capacity, and the existing scalar max payload.
**Demo**:
`npx vitest run tests/core/game/ResourceTrade.test.ts`
**Acceptance Checks**:
- [x] Default equal-blend surplus and deficit are computed from current stockpile mix.
- [x] Reciprocal exchange manifests preserve each player's total resource count.
- [x] Zero/empty manifests are returned when no matching surplus and deficit exists.
**Dependencies**: None
**Notes**: No route capacity, fuel cost, or route scoring in this pass.

## D2: Trains Transfer Resources Instead Of Minting
**Outcome**: Train deliveries keep current spawning/routing behavior but exchange existing resources between different owners at delivery time.
**Demo**:
`npx vitest run tests/core/game/TrainStation.test.ts`
**Acceptance Checks**:
- [x] External train delivery removes resources from each exporter before adding reciprocal manifests to receivers.
- [x] Empty train deliveries produce no popup/log/stat resource movement.
- [x] Same-owner train delivery does not convert a player's own resource mix.
**Dependencies**: D1
**Notes**: Existing `trainGold(...)` remains as max payload size.

## D3: Ships Transfer Resources Instead Of Minting
**Outcome**: Trade ships keep current spawning/path/capture behavior but transfer existing resources at delivery time.
**Demo**:
`npx vitest run tests/core/executions/TradeShipExecution.test.ts`
**Acceptance Checks**:
- [x] Normal ship delivery exchanges existing resources between source and destination owners.
- [x] Captured ship delivery steals an available manifest from original source to captor.
- [x] Empty ship deliveries are silent and do not mint resources.
**Dependencies**: D1
**Notes**: Existing `tradeShipGold(...)` remains as max payload size.

## D4: Regression And Playtest Safety
**Outcome**: Resource transfer changes are type-safe and do not regress nearby construction, capacity, AI, popup, or trade tests.
**Demo**:
`npx vitest run tests/core/game/ResourceTrade.test.ts tests/core/game/TrainStation.test.ts tests/core/executions/TradeShipExecution.test.ts tests/core/game/Resources.test.ts tests/PlayerImpl.test.ts tests/economy/ConstructionGold.test.ts tests/core/configuration/ResourceCapacity.test.ts tests/NationStructureBehavior.test.ts`
**Acceptance Checks**:
- [x] Focused resource/trade tests pass.
- [x] Nearby economy/resource/AI tests pass.
- [x] `npx tsc --noEmit` passes.
**Dependencies**: D1, D2, D3
**Notes**: The worktree already includes ongoing resource/trade and AI changes; validation should preserve them.
