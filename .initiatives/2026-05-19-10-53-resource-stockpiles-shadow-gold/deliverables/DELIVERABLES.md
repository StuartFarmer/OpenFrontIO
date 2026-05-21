# Deliverables

## D1: Resource Domain Model
**Outcome**: The core game model has typed Food, Energy, and Materials stockpiles, helpers for converting old scalar gold amounts into equal resource payloads, and player APIs for adding/removing/querying resources.
**Demo**:
`npm test -- tests/PlayerImpl.test.ts tests/economy/ConstructionGold.test.ts`
**Acceptance Checks**:
- [ ] `ResourceKind`, `ResourceAmount`, `ResourceStockpile`, and `ResourceDelta` are defined in a stable core location.
- [ ] `resourcesFromGoldAmount(amount)` returns equal Food, Energy, and Materials values.
- [ ] `Player` and `PlayerImpl` expose resource APIs while preserving existing `gold()` compatibility behavior.
- [ ] Starting economic value initializes all three resources.
**Dependencies**: Existing `Gold` type and `Player` contract.
**Notes**: This is the shared write hotspot. Complete before broad call-site migration.

## D2: Resource-Payload Acquisition Paths
**Outcome**: Current gold acquisition paths call `addResources(resourcesFromGoldAmount(amount), tile?)` instead of directly adding scalar gold.
**Demo**:
`npm test -- tests/ConquerGold.test.ts tests/core/game/TrainStation.test.ts tests/core/executions/TradeShipExecution.test.ts`
**Acceptance Checks**:
- [ ] Passive worker income awards a resource payload.
- [ ] Trade ship rewards award a resource payload.
- [ ] Train station rewards award a resource payload.
- [ ] Conquest rewards award/remove equivalent resources while preserving existing gold-shaped events/stats.
- [ ] Donation paths preserve existing behavior and transfer equivalent resource payloads where applicable.
**Dependencies**: D1.
**Notes**: Event names and stats can remain gold-compatible in this phase.

## D3: Client State And UI Visibility
**Outcome**: Resource stockpiles cross the worker/client boundary and appear in the in-game UI with a minimal, non-disruptive display.
**Demo**:
`npm test -- tests/GameUpdateUtils.test.ts tests/client/view/PlayerView.test.ts`
**Acceptance Checks**:
- [ ] `PlayerUpdate` can carry resources beside existing `gold`.
- [ ] Diff/apply update utilities preserve resource state.
- [ ] Renderer `PlayerState` and `PlayerView` expose resources.
- [ ] `ControlPanel` shows Food, Energy, and Materials values during play.
**Dependencies**: D1.
**Notes**: Keep UI compact. Do not redesign economy UI or replace all gold labels yet.

## D4: Compatibility Test Coverage
**Outcome**: Existing gold behavior remains unchanged while new tests assert resource payload equivalence.
**Demo**:
`npm test`
**Acceptance Checks**:
- [ ] Existing gold tests still pass without weakening assertions.
- [ ] Tests assert all three resources receive the old gold amount on acquisition.
- [ ] Tests assert spending/transfer compatibility does not create resource drift.
- [ ] Tests cover update serialization/diffing for resource state.
**Dependencies**: D1, D2, D3.
**Notes**: Prefer extending existing focused economic tests instead of adding broad slow tests.

## D5: Manual Playtest Loop
**Outcome**: A developer can start a single-player game, watch resources change in the UI, and confirm the first slice works without terrain-specific production.
**Demo**:
`npm run start:client`
**Acceptance Checks**:
- [ ] Single-player starts without resource-related errors.
- [ ] Starting gold/cheat settings initialize visible resources.
- [ ] Passive income changes visible resource values.
- [ ] Trade/conquest/build interactions do not break current gameplay.
**Dependencies**: D1, D2, D3, D4.
**Notes**: Use single-player with instant build and starting gold for fast verification.
