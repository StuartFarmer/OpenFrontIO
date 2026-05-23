# Analysis Report: Trade Resource Export Blend

## Executive Summary
- Trade payout conversion is centralized at two call sites: train station stops and trade ship completion.
- The missing primitive is a resource-blend converter that preserves total payout value instead of producing one full gold amount per resource.
- Tests already exist at the right layers and should be updated to prove train, ship, rounding, and zero-stockpile behavior.
- Captured trade ships need one explicit product decision because the current code awards the ship's current owner while still messaging against the original owner.

## Findings

### 1. Train payouts still convert gold into 3x resources
- Evidence: `src/core/game/TrainStation.ts` imports `resourcesFromGoldAmount` and calls it for both station-owner external trade and train-owner self trade.
- Impact: A 10,000 train payout becomes `{ food: 10000, energy: 10000, materials: 10000 }`, which is 30,000 total resources instead of a 10,000 blended payload.
- Recommendation: Add a shared converter that accepts a total amount and an exporter stockpile, then call it once before any train payout mutation.
- Risk: If the blend is recomputed after paying the train owner, the destination payout can be skewed by the payout itself.

### 2. Ship payouts have the same 3x resource behavior and duplicate conversion
- Evidence: `src/core/execution/TradeShipExecution.ts` computes `const resources = resourcesFromGoldAmount(gold)` and then separately calls `resourcesFromGoldAmount(gold)` again for the destination owner.
- Impact: Both source and destination ship payouts ignore the source player's current blend and overproduce total resources.
- Recommendation: Compute one blended resource payload from the exporter before any `addResources` call, then reuse it for both source and destination payouts.
- Risk: Captured ships currently use `this.tradeShip!.owner()` for payout amount scaling but reference `origOwner` in the message; captured cargo source semantics should be deliberate.

### 3. `resourcesFromGoldAmount` is the wrong helper for trade exports
- Evidence: `src/core/game/Resources.ts` defines `resourcesFromGoldAmount(amount)` as equal full amounts for all three resources. That remains useful for legacy compatibility and starting-resource behavior, but it does not model "total amount split by blend."
- Impact: Reusing the compatibility helper for trade makes the new economy hard to balance because trade is tripled by construction.
- Recommendation: Keep `resourcesFromGoldAmount` unchanged and add a new helper, for example `resourcesFromExportBlend(totalAmount, exporterResources)`.
- Risk: Replacing `resourcesFromGoldAmount` globally would break unrelated compatibility paths such as `addGold`, `removeGold`, starting resources, and construction tests.

### 4. Existing tests should catch the intended behavior with small updates
- Evidence: `tests/core/game/TrainStation.test.ts`, `tests/core/executions/TradeShipExecution.test.ts`, and `tests/core/game/Resources.test.ts` already cover the affected helpers and payout flows.
- Impact: The implementation can be validated without broad integration changes or UI test churn.
- Recommendation: Add helper math tests first, then update train and ship expectations from equal triplets to blended payloads whose total equals the old scalar.
- Risk: Current mocks do not all define `resources()`, so tests need explicit mock stockpiles for source/exporter players.

### 5. Trade stats can remain scalar for now
- Evidence: `src/core/game/Stats.ts` and `src/core/game/StatsImpl.ts` expose `boatArriveTrade`, `boatCapturedTrade`, `trainExternalTrade`, and `trainSelfTrade` as scalar trade values.
- Impact: Changing stats to full resource payloads would be a larger schema/reporting migration unrelated to making gameplay work.
- Recommendation: Leave stats arguments as the old trade-value scalar for this pass.
- Risk: Future UI or analytics may still label these scalar values as gold until separately migrated.

## Quick Wins
- Add `resourcesFromExportBlend(...)` to `src/core/game/Resources.ts`.
- Update `TrainStation.ts` to compute the train owner's blend once per stop.
- Update `TradeShipExecution.ts` to compute the source/original owner's blend once per completion.
- Add rounding and zero-stockpile helper tests.

## Medium Changes
- Update trade ship tests to cover both normal and captured trade payouts.
- Consider renaming local variables from `gold` to `tradeValue` inside touched functions while leaving public config/stat names unchanged.
- Decide whether event messages should still use `received_gold_from_trade` copy in a follow-up UI/localization pass.

## High-Risk Decisions
- Captured ship exporter blend: original owner cargo blend versus captor current blend.
- Whether compatibility gold should still increase when trade resources are awarded.
- Whether stat payloads should eventually track resource-specific trade totals instead of scalar trade value.

## Guardrails
- The sum of every blended resource payload must equal the old scalar payout.
- Do not use the old equal-triplet compatibility helper for train or ship trade payouts.
- Compute blend before awarding resources to any recipient.
- Keep config trade amount formulas unchanged.
- Run focused Vitest suites and `npx tsc --noEmit` after implementation.
