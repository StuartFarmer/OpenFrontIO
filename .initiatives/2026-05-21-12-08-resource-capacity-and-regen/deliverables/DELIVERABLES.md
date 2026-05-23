# Deliverables

## D1: Resource Capacity Math
**Outcome**: Resource stockpile math has pure helpers for capacity-shaped values, clamping deltas to capacity, and computing troop-shaped regen deltas safely across `bigint` stockpiles.
**Demo**:
`npx vitest run tests/core/game/Resources.test.ts`
**Acceptance Checks**:
- [ ] Capacity and delta helpers operate per resource.
- [ ] Clamping prevents passive deltas from exceeding capacity.
- [ ] Regen curve helper accelerates until roughly 42% of capacity and slows near cap.
- [ ] Helpers are deterministic and avoid hidden mutation.
**Dependencies**: Existing `ResourceStockpile` model.
**Notes**: Keep this independent from player/config state so formula behavior is cheap to test.

## D2: Resource Capacity Configuration
**Outcome**: `Config` exposes resource capacity and resource passive regen formulas using controlled area plus completed Factory levels, mirroring troop formula shape while remaining resource-specific.
**Demo**:
`npx vitest run tests/core/configuration/ConfigLoader.test.ts tests/core/executions/PlayerExecution.test.ts`
**Acceptance Checks**:
- [ ] `maxResources(player)` returns Food, Energy, and Materials capacity.
- [ ] Controlled area contributes baseline capacity.
- [ ] Completed Factory levels increase capacity.
- [ ] Under-construction Factories do not increase capacity.
- [ ] `resourceIncreaseRate(player)` follows the troop regen curve shape.
**Dependencies**: D1.
**Notes**: Keep all three resources on the same initial formula unless a later balance pass differentiates them.

## D3: Capped Passive Resource Regen
**Outcome**: Passive resource income uses the new capped regen model and no longer depends on `goldAdditionRate(...)` for resource accumulation.
**Demo**:
`npx vitest run tests/core/executions/PlayerExecution.test.ts tests/PlayerImpl.test.ts tests/economy/ConstructionGold.test.ts`
**Acceptance Checks**:
- [ ] Passive resource income increases stockpiles without increasing gold.
- [ ] Passive resource income cannot push any resource past capacity.
- [ ] Near-cap stockpiles receive only the remaining capacity.
- [ ] Existing gold-compatible construction behavior remains stable.
**Dependencies**: D1, D2.
**Notes**: Leave trade, train, conquest, and donation uncapped until explicitly planned.

## D4: Capacity Visibility For Playtesting
**Outcome**: Resource capacity is available to client view code and appears in the control panel in a compact current/max form or equivalent saturation display.
**Demo**:
`npx vitest run tests/GameUpdateUtils.test.ts tests/client/view/PlayerView.test.ts tests/client/hud/ControlPanel.test.ts`
**Acceptance Checks**:
- [ ] Player updates can carry resource capacity beside resource stockpiles.
- [ ] Diff/apply update utilities preserve resource capacity.
- [ ] `PlayerView` exposes resource capacity for UI consumers.
- [ ] Control panel displays resource current/max values without hiding gold compatibility UI.
**Dependencies**: D2.
**Notes**: If implementation decides not to show capacity in UI, this deliverable should be explicitly revised before execution.

## D5: Regression Verification And Manual Playtest
**Outcome**: Focused automated tests and a single-player manual playtest confirm capped resource regen behaves as intended without accidental terrain production or resource-specific costs.
**Demo**:
`npx tsc --noEmit`
**Acceptance Checks**:
- [ ] Targeted resource/config/execution/update/UI tests pass.
- [ ] TypeScript passes.
- [ ] Full `npm test` result is recorded with known unrelated failures called out if still present.
- [ ] Manual playtest confirms resources visibly approach capacity.
- [ ] Final audit confirms no terrain production or resource-specific costs slipped in.
**Dependencies**: D1, D2, D3, D4.
**Notes**: Keep known repo-wide localStorage test-environment failures separate from feature validation.
