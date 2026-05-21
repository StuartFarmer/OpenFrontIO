# Analysis Report: Resource Trade Network MVP

## Executive Summary
- The best MVP is not a full market: it is automatic resource-conserving shipment manifests over existing train and ship routes.
- The current train system should diverge economically from `trainGold(...)`, but its movement/path/stop infrastructure should be reused.
- The current ship system should also stop minting resources, but should remain a port-to-port carrier with capture/blockade gameplay.
- Existing train/ship spawning, random routing, distance penalties, and alliance boosts are enough for MVP throughput; do not add explicit route capacity.
- Shipment manifests should be computed at delivery time, and zero/empty deliveries are valid when the connected economy has no matching surplus and deficit.
- Multi-stop train pickup/dropoff is aligned with the design, but it should be a second phase after one-manifest transfers prove stable.
- The first visualization should be per-player import/export/shortage state, not a full animated flow heatmap.

## Findings

### 1. Current trade is still a resource faucet, not a transfer network
- Evidence: `src/core/game/TrainStation.ts` computes `gold = mg.config().trainGold(...)`, converts it through `resourcesFromExportBlend(...)`, and calls `addResources(...)` for station owner and train owner. `src/core/execution/TradeShipExecution.ts` does the same with `Config.tradeShipGold(...)`.
- Impact: Trade increases total world resources rather than moving scarce resources from surplus to deficit. That works as a reward faucet, but it conflicts with the proposed economy where terrain production and factories/storage should determine supply.
- Recommendation: Diverge from the current payout model by replacing scalar trade value conversion with delivery-time shipment manifests that call `removeResources(...)` on the exporter and `addResources(...)` on the importer. Treat `trainGold(...)` and `tradeShipGold(...)` as max payload sizes for now, not generated value.
- Risk: Removing the faucet will slow economy growth. Existing train/ship frequency and shipment size may need retuning because trade will no longer be a source of new resources.

### 2. Existing train movement is useful, but the train stop reward handler is the wrong abstraction for the MVP economy
- Evidence: `src/core/execution/TrainExecution.ts` already finds a station path via `railNetwork.findStationsPath(...)`, moves along rail segments, and calls `stationReached()` for each intermediate station. `TrainStation.ts` currently attaches stop handlers by unit type and pays trade rewards in `TradeStationStopHandler`.
- Impact: The movement and multi-stop callback model is already close to the desired logistics feel. The problem is that cargo is not represented; each stop independently mints a reward.
- Recommendation: Keep `TrainExecution` as the visual/logistical carrier, but calculate a resource manifest when a train delivery is resolved. In the MVP, the manifest should be attempted once for the delivery destination, while intermediate stops remain route checkpoints. Multi-stop partial pickup/dropoff should be deferred.
- Risk: If the MVP tries to implement per-stop loading/unloading immediately, state complexity jumps sharply: each train needs cargo inventory, capacity, station needs, export permissions, and partial route accounting.

### 3. Existing ship movement and capture behavior should be preserved, but payout semantics should transfer cargo
- Evidence: `TradeShipExecution` already tracks original owner, current ship owner, capture state, destination port retargeting, water pathfinding, and delivery messages. On capture, the ship can reroute to a captor port.
- Impact: This is good gameplay scaffolding for resource cargo. A captured ship should plausibly deliver stolen manifest cargo rather than minting a new payout based on captor blend.
- Recommendation: For the MVP, compute the cargo manifest when the trade ship arrives. On normal delivery, transfer from the source owner to the destination owner. On captured delivery, transfer from the original source owner to the captor if the original source still has exportable surplus. If no transfer is possible, deliver nothing.
- Risk: Delivery-time calculation makes ships visually travel without guaranteed cargo, but that is an acceptable signal that global health or connected surplus is poor.

### 4. The code already has the stockpile primitives needed for conservative transfer
- Evidence: `PlayerImpl.addResources(...)` and `PlayerImpl.removeResources(...)` both support `{ updateGold: false }`. `removeResources(...)` clamps to available stockpile per resource. `Config.maxResources(...)` exposes capacity, and `clampResourceDeltaToCapacity(...)` already exists.
- Impact: A resource-conserving shipment can be built without inventing low-level inventory operations.
- Recommendation: Build a helper that computes transferable amount as `min(exporter surplus, importer deficit, importer capacity headroom, maxPayload)`, then applies `removeResources(..., { updateGold: false })` followed by `addResources(..., { updateGold: false, bonusResources })`. If the result is zero, skip popup/log delivery effects.
- Risk: The helper must be careful not to remove more than can be accepted by the receiver, or resources will disappear unintentionally.

### 5. The missing model is player desired blend and reserve/deficit scoring
- Evidence: `ControlPanel.ts` shows resource stockpiles/rates but has no resource target preference. `Config.resourceIncreaseRate(...)` produces terrain-weighted resources, but no system compares current stockpile to a desired blend for trade demand.
- Impact: Automatic balancing cannot be understandable until the game can compute "what this player wants" and "what this player can export."
- Recommendation: Start with a default desired blend of equal thirds. Compute each player's per-resource normalized deficit and surplus from `current / capacity` compared to target blend. Add UI only after the baseline behavior is verified.
- Risk: Equal thirds may be too naive once buildings, troops, and attacks create different consumption patterns. It is still the right MVP baseline because it is predictable and easy to test.

### 6. Factories already make storage meaningful, so trade should respect capacity instead of bypassing it
- Evidence: `Config.maxResources(...)` increases capacity from controlled area and factory levels. `PlayerExecution.tick(...)` clamps production through `Config.resourceIncreaseRate(...)`.
- Impact: If trade keeps minting or overfilling resources, factories lose strategic meaning. If trade is capacity-limited, factories become logistics/storage infrastructure as intended.
- Recommendation: Receiver capacity headroom should be a hard cap for shipments. Exporter reserve should be a hard or soft cap to avoid self-starvation.
- Risk: Early players with low capacity may see small shipments; this is desirable if factories are meant to matter, but UI must explain why shipments are limited.

### 7. Empty deliveries are a feature of the MVP, not a bug
- Evidence: Current trains and ships are spawned by existing random/probabilistic systems in `TrainStationExecution.spawnTrain(...)` and `PortExecution.tick(...)`; neither knows whether useful surplus exists at delivery time.
- Impact: In poor global economic conditions, or without connected surplus producers, some deliveries should carry zero or small payloads. This is the simplest way for "supply does not meet demand" to show up without a market model.
- Recommendation: Allow empty deliveries silently in the MVP. Successful non-zero transfers should show the existing resource popup/log. Empty transfers should not mint resources and should not spam the player.
- Risk: Players may initially wonder why trains/ships sometimes produce no popup. This should be handled later with aggregate flow/shortage visualization rather than noisy per-delivery failure logs.

### 8. Route choice can be improved later without building a full market
- Evidence: `TrainStationExecution.spawnTrain(...)` currently chooses `cluster.randomTradeDestination(owner, random)`. `PortExecution.tradingPorts()` weights ports by level, proximity, and friendliness, but not resource demand/supply.
- Impact: The automatic system may spawn empty or low-value deliveries if routes are random and the selected receiver/exporter pair has no useful match.
- Recommendation: Do not change route selection in the first MVP. After delivery-time transfer works, optionally avoid obvious empty shipments by checking potential shipment before spawn and picking another existing eligible destination.
- Risk: If the scoring is too deterministic, all traffic may concentrate on one route. Add small randomness or cooldowns after the deterministic baseline is proven.

### 9. Visualization should start with player-level state, not per-tile flow simulation
- Evidence: The renderer already supports conquest/resource popups and the control panel shows current rates, but there is no existing resource-flow overlay or graph data model. Game updates already carry player resource and capacity snapshots.
- Impact: A full flow heatmap is attractive but costly. It needs new aggregate metrics, renderer coloring, possibly replay serialization changes, and UI controls.
- Recommendation: First expose simple computed state: each player is exporter/importer/shortage for each resource. Use that to drive a toggleable overlay later. For analysis/MVP, define the data contract before building the visual.
- Risk: Without any visualization, automatic trade can feel invisible. The interim feedback should be log messages and resource-specific delivery popups, which already exist.

## Quick Wins
- Introduce a `TradeManifest` shape: `{ food, energy, materials }` plus source/destination metadata.
- Add a pure helper for target-blend deficit/surplus scoring.
- Add a pure helper for delivery-time manifest calculation from exporter surplus, receiver deficit, capacity headroom, and max payload.
- Change train/ship reward language conceptually from "trade value minted" to "manifest delivered."
- Keep existing resource delivery popups/log formatting for manifests.

## Medium Changes
- Replace `cluster.randomTradeDestination(...)` selection with best trade opportunity selection inside the connected rail cluster after the MVP proves out.
- Replace `PortExecution.tradingPorts()` random weighted choice with resource-aware port opportunity ranking after the MVP proves out.
- Optionally add a pre-spawn potential-shipment check later to avoid obvious empty deliveries.
- Add minimal player target blend storage, initially default-only, later user-configurable.

## High-Risk Decisions
- Delivery-time calculation versus reservation. Delivery-time calculation is simplest and responds to current economy state; reservation creates clearer cargo semantics but adds state and stale-cargo problems.
- One-manifest train trips versus multi-stop pickup/dropoff. One-manifest trips are much safer for MVP; multi-stop routing should follow after route scoring and transfer semantics are stable.
- Whether self-trade should move resources between a player's own stations or do nothing. Since player stockpile is currently global, self-trade cannot meaningfully rebalance local storage until resources become regional.
- Whether trade stats continue using scalar gold/trade value or migrate to resource-specific trade volumes.
- How much UI control to expose early: equal target blend only, one-priority mode, or full three-slider target blend.

## Guardrails
- Trade must not increase total world resources in the MVP.
- Trade must never overfill receiver capacity.
- Trade must not drain exporters below reserve thresholds.
- Route eligibility should still respect existing diplomacy and transport constraints: `canTrade(...)`, rail cluster reachability, port/water reachability, capture/embargo behavior.
- Do not add explicit route capacity in the MVP. Existing train/ship spawn frequency and existing trade scalar values are enough.
- Delivery-time zero manifests must be allowed and must not generate resources.
- MVP should reuse train/ship visuals and delivery popups before adding new market UI.
- Keep resource scoring pure and unit-testable before integrating with executions.
- Do not implement multi-stop cargo mutation until single-manifest transfer is stable and playtested.
