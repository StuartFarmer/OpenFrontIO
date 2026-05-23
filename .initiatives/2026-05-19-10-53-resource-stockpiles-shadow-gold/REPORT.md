# Analysis Report: Resource Payloads Replacing Gold Acquisition

## Executive Summary
- Highest impact: gold acquisition should become payload-shaped at the call sites: `addGold(gold, tile)` should become `addResources({ food: gold, energy: gold, materials: gold }, tile)` for the first compatibility pass.
- Second: acquisition paths are centralized enough to migrate deliberately: passive work income, trade ships, train stations, conquest rewards, starting resources, and donations.
- Third: spending paths are more dangerous because unit construction, upgrades, donations, and AI affordability checks still assume one scalar balance.
- Fourth: UI and renderer state can stay gold-first at first, but resource fields must be added deliberately if the client needs to display or preserve them.
- Fifth: tests already cover most economic paths, so the safest rollout is to add resource-payload assertions around existing gold tests instead of replacing them all.

## Findings

### 1. Gold Acquisition Should Become A Resource Payload API
- Evidence: `Gold` is `bigint` in `src/core/game/Game.ts`, and `Player` exposes `gold()`, `addGold()`, and `removeGold()` as the core resource API.
- Evidence: `PlayerImpl` stores `private _gold: bigint`, initializes it from `mg.config().startingGold(playerInfo)`, emits it in `toFullUpdate()`, and mutates it in `addGold()` / `removeGold()`.
- Impact: The first useful abstraction is not merely mirroring `_gold` internally; it is changing acquisition call sites to send a `ResourceDelta` object. That gives later terrain and building rules somewhere real to plug in without revisiting every gold source again.
- Recommendation: Add `ResourceKind`, `ResourceAmount`, `ResourceStockpile`, and a helper such as `resourcesFromGoldAmount(gold): ResourceDelta`. Add `Player.addResources(resources, tile?)`, then migrate acquisition sites from `addGold(gold, tile)` to `addResources(resourcesFromGoldAmount(gold), tile)`.
- Risk: This touches more call sites than a hidden mirror. Keep `addGold()` as a deprecated compatibility wrapper around `addResources(resourcesFromGoldAmount(gold), tile)` until all core callers are migrated.

### 2. Passive Income Is The Cleanest First Migration
- Evidence: `PlayerExecution.tick()` computes `goldFromWorkers = this.config.goldAdditionRate(this.player)`, calls `this.player.addGold(goldFromWorkers)`, and records `stats().goldWork(...)`.
- Impact: Worker income can award `{ food, energy, materials }` without changing the rate formula, troop growth, stats, or game pace.
- Recommendation: Replace the acquisition call with `this.player.addResources(resourcesFromGoldAmount(goldFromWorkers))`. Keep `goldWork` stats unchanged in the compatibility phase because they still describe economic value earned by work.
- Risk: Renaming this path to resources immediately would ripple into stats, UI, translations, and ranking code before the mechanic needs it.

### 3. Trade, Train, And Conquest Use `addGold()` But Also Emit Gold-Specific Events
- Evidence: `TradeShipExecution.complete()` calls `owner().addGold(gold, tile)` for captured and normal trade. `TrainStation.onTrainStop()` calls `stationOwner.addGold(...)` and `trainOwner.addGold(...)`. `GameImpl` conquest calls `conqueror.addGold(goldCaptured)`, `conquered.removeGold(gold)`, emits `ConquestEvent.gold`, and records `stats().goldWar(...)`.
- Impact: Trade, train, and conquest are exactly the places where the new API shape should appear. `gold` can remain the computed economic value, but the mutation should be resource-payload based.
- Recommendation: Convert reward mutations to `addResources(resourcesFromGoldAmount(gold), tile)`. Keep event names and `gold` payloads for now, and treat them as compatibility/economic-value events. Add resource payloads to events only if client display or replay inspection needs them during this phase.
- Risk: Adding resource fields to every event now increases migration surface. Not adding them means the UI cannot yet show resource-specific popups, which is acceptable for this simple phase.

### 4. Spending Is Centralized Enough, But Affordability Checks Are Scattered
- Evidence: `PlayerImpl.buildUnit()` removes `this.mg.unitInfo(type).cost(...)` via `removeGold(cost)`. `PlayerImpl.upgradeUnit()` does the same. `DonateGoldExecution` and `PlayerImpl.donateGold()` use `gold()` and `removeGold()`. Nation behavior checks `player.gold()` in `NationStructureBehavior`, `NationNukeBehavior`, `NationMIRVBehavior`, and `NationWarshipBehavior`.
- Impact: Spending should eventually become resource-payload based too, but converting acquisition first is safer. Affordability checks that compare against `gold()` will continue to work only if `gold()` remains a compatibility scalar derived from or kept in lockstep with resources.
- Recommendation: Keep `gold()` and `removeGold()` as compatibility APIs during the first acquisition migration. Add matching `removeResources(resources)` and `canAffordResources(resources)` APIs, but do not require all build costs to use them until the resource payload acquisition path is stable.
- Risk: If one resource ever diverges before affordability checks are converted, `gold()` could incorrectly report an action as affordable. The compatibility phase should enforce lockstep or fail loudly in tests.

### 5. Player Updates And Renderer State Need A Deliberate Payload Decision
- Evidence: `PlayerUpdate` includes `gold?: Gold`; `diffPlayerUpdate()` compares `gold`; `applyStateUpdate()` maps `pu.gold` into renderer `PlayerState.gold`; `PlayerView.gold()` converts renderer `state.gold` back to `bigint`.
- Impact: The client cannot know Food, Energy, or Materials unless update payloads and renderer state grow new fields. However, gameplay can remain unchanged without immediately displaying resources.
- Recommendation: If acquisition calls are resource-payload based, `PlayerUpdate` should likely add `resources?: ResourceStockpile` beside `gold` so the payload does not disappear at the worker/client boundary. Keep `gold` unchanged for compatibility. Diff/apply resources as one object first.
- Risk: Worker-to-client update changes touch replay/renderer types and tests. Core-only resources are safer but less observable.

### 6. Schemas And Intents Still Encode Gold-Specific Concepts
- Evidence: `Schemas.ts` defines `DonateGoldIntentSchema` with `type: "donate_gold"` and a numeric `gold`; host and game config schemas include `startingGold` and `goldMultiplier`.
- Impact: The first compatibility layer should not rename network intents or config fields. Existing clients, tests, and lobby UI expect gold-specific names.
- Recommendation: Keep schema names stable. Convert scalar intent/config amounts into resource payloads at the core boundary. For example, `startingGold` becomes the initial `{ food, energy, materials }` value, and a `donate_gold` intent can still carry a scalar while `PlayerImpl` transfers the equivalent resource payload.
- Risk: Early renames would cause broad frontend, server, and replay compatibility churn.

### 7. Tests Already Cover The Critical Economic Surface
- Evidence: Existing tests cover `Stats.test.ts`, `ConquerGold.test.ts`, `Donate.test.ts`, `AllianceDonation.test.ts`, `PlayerImpl.test.ts`, `ConstructionGold.test.ts`, `TrainStation.test.ts`, trade execution tests, and `GameUpdateUtils.test.ts`.
- Impact: This is a strong safety net for preserving old behavior, but it does not yet assert that scalar gold sources are converted into resource payloads.
- Recommendation: Extend focused tests to assert Food/Energy/Materials receive the old gold amount after starting resources, passive income, trade, train, conquest, donation, construction, and upgrades.
- Risk: Adding many broad integration tests can slow iteration; prefer extending existing targeted economic tests first.

## Quick Wins
- Add resource type aliases and constants near `Gold` in `Game.ts`.
- Add `resourcesFromGoldAmount(gold)` to produce `{ food: gold, energy: gold, materials: gold }`.
- Add resource stockpile helpers in `PlayerImpl` while preserving `gold()`, `addGold()`, and `removeGold()` as wrappers.
- Convert clear acquisition sites from `addGold(gold, tile)` to `addResources(resourcesFromGoldAmount(gold), tile)`.
- Initialize all three resources from `startingGold`.
- Add tests that prove converted resource payloads preserve current gold-equivalent behavior.

## Medium Changes
- Add resource fields to `PlayerUpdate`, `diffPlayerUpdate()`, renderer `PlayerState`, and `PlayerView` if resource visibility is required immediately.
- Add compatibility helpers such as `resources()`, `addResources()`, `removeResources()`, and `canAffordResources()` to avoid direct stockpile mutation.
- Update dev/debug UI or control panel only after the wire format decision is made.

## High-Risk Decisions
- Making resources the new source of truth while keeping old `gold` fields derived without clear lockstep rules.
- Renaming gold intents, stats, or config fields before the compatibility layer is stable.
- Allowing resources to diverge while AI and affordability logic still checks only `gold()`.
- Changing replay payloads without preserving old `gold` fields.

## Guardrails
- Preserve all existing gold APIs in the first implementation.
- Prefer new acquisition code to call `addResources(resourcesFromGoldAmount(gold), tile)` rather than new direct `addGold()` calls.
- Keep all existing gold tests passing unchanged before adding new resource assertions.
- Require lockstep invariants for the compatibility phase: Food, Energy, Materials, and compatibility gold must change together.
- Avoid terrain production, resource-specific costs, and AI strategy changes until this layer is stable.
- Keep event/schema names gold-compatible until a later migration explicitly changes UI and replay semantics.
