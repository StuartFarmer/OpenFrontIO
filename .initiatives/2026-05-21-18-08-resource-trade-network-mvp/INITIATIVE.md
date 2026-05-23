# Initiative: Resource Trade Network MVP

## Stack
- Language: TypeScript
- Package manager: npm
- Test runner: Vitest
- Build: TypeScript `tsc --noEmit`, Vite
- UI: Lit/custom HUD components, Pixi/WebGL renderer
- CI: GitHub Actions present in repo, local scripts in `package.json`

## Goal

Define the simplest automatic trade-network system that moves existing Biomass, Fuels, and Metals between players based on deficit/surplus pressure and player-desired blend, without trains or ships minting resources.

## Problem Statement

Resources now vary meaningfully by spawn location and terrain mix. Current train and ship trade still creates resource payloads from scalar trade values, even after those payloads are split by exporter blend. That makes logistics a resource faucet instead of a transfer network. The desired direction is a self-balancing economy where trade carriers move resources from connected surplus holders to connected deficit holders, while supply shortages remain real and visible.

## Success Definition

The analyzed MVP should identify a path where trade is automatic, resource-conserving, and understandable: players can keep or set a target blend; existing random train/ship deliveries attempt to reduce deficits when they arrive; exporters only send available surplus; receivers are capped by storage; shortages are not magically fulfilled; empty deliveries are allowed; and trains/ships remain useful as route visuals and delivery events.

## Non-Goals
- Do not design a full market, auction house, or price discovery system for the first pass.
- Do not add a manual per-shipment order book in the MVP.
- Do not require per-car train loading/unloading simulation in the first pass.
- Do not remove train or ship visuals.
- Do not solve every graph/heatmap visualization in the first pass.
- Do not implement code during analysis.

## Constraints
- Current `TrainExecution` already follows a station path and calls `TrainStation.onTrainStop(...)` at intermediate stops.
- Current `TradeStationStopHandler` mints resources from `Config.trainGold(...)`.
- Current `TradeShipExecution.complete()` mints resources from `Config.tradeShipGold(...)`.
- Current train/ship spawn rates, route selection, distance penalties, and alliance/friendliness boosts already provide enough "trade frequency" behavior for the MVP.
- `Player.addResources(...)` and `Player.removeResources(...)` can already mutate resource stockpiles without touching compatibility gold when `{ updateGold: false }` is used.
- Resource capacity is currently per-resource equal capacity from `Config.maxResources(...)`; factories increase that capacity.
- Player resource production is terrain-weighted in `Config.resourceIncreaseRate(...)`.
- Existing trade stats and messages are still named around gold/trade value.
- The worktree includes ongoing uncommitted resource/trade and AI changes; this initiative should document a future direction without reverting them.

## Assumptions
- A player's first target blend can default to equal thirds: 33% Biomass, 33% Fuels, 34% Metals.
- A later UI can allow the player to set target blend, but the MVP can initially use defaults or simple per-resource priority.
- Exporters should only export resources above a reserve threshold, not drain themselves to zero.
- Imported resources should be limited by receiver deficit/capacity, exporter surplus, and the existing scalar trade amount as a max shipment size.
- Do not add explicit route capacity in the MVP. Existing train/ship spawn frequency is the only throughput limit.
- Payloads should be calculated when a delivery lands, not when it spawns, so changing stockpiles, capacity, diplomacy, or earlier deliveries are naturally reflected.
- If no useful surplus/deficit match exists at delivery time, the delivery is empty and should not create resources.
- Trains can initially attempt one manifest transfer at destination rather than dynamically loading/unloading at every stop.
- Multi-stop pickup/dropoff is valuable later, but should not be the first implementation if the goal is a safe MVP.

## Risk Posture

Medium. The intended mechanic changes trade from a faucet into a transfer system, which affects economy pacing and AI viability. The safest path is to add a resource-conserving shipment-selection layer while preserving existing train/ship movement, pathing, and display infrastructure.

## Next Step
Run planning for this initiative.
