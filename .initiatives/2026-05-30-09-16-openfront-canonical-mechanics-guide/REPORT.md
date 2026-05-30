# Analysis Report: OpenFront Canonical Mechanics Guide

## Executive Summary

- Highest impact: `Config` is the numeric mechanics hub, but an equal implementation cannot be recreated from `Config` alone because execution classes own major state transitions and edge-case rules.
- Second: canonical domain vocabulary is well defined in `Game.ts` and `Schemas.ts`; these should become the guide's shared glossary and schema appendix before any chapter-specific prose.
- Third: maps, terrain, nation spawn data, and team spawn geometry are data-driven from `resources/maps/**/manifest.json` plus binary terrain, so map documentation needs both schema and asset inventory.
- Fourth: player-state dynamics live in `GameImpl`, `PlayerImpl`, `AttackImpl`, `UnitImpl`, resources, rail networks, and pathfinding; the guide must document object lifecycles, not only player commands.
- Fifth: nation AI is a full mechanics family with behavior modules for alliances, structures, nukes, MIRVs, warships, and emojis; it deserves a dedicated "AI Nations" section rather than being folded into generic players.
- Sixth: tests are a strong source of rule intent for warships, spawning, alliances, nations, nukes, rail, trade, and capture edge cases, and should be cited throughout the guide.

## Findings

### 1. `Config` is the main balance and formula surface, but not the whole game

- Evidence:
  - `main@782702c1:src/core/configuration/Config.ts:142` defines `cityTroopIncrease()`, and line 146 defines `factoryResourceCapacityIncrease()`.
  - Unit costs, construction durations, health, damage, and upgrade flags are concentrated in `unitInfo()` at `Config.ts:290`.
  - Combat formulas are in `attackLogic()` at `Config.ts:639` and `attackTilesPerTick()` at `Config.ts:762`.
  - Economy formulas are in `maxTroops()` at `Config.ts:828`, `maxResources()` at `Config.ts:862`, `troopIncreaseRate()` at `Config.ts:903`, and `resourceIncreaseRate()` at `Config.ts:943`.
  - Nuclear and naval constants appear in `nukeMagnitudes()` at `Config.ts:1068`, `nukeDeathFactor()` at `Config.ts:1110`, `samRange()` at `Config.ts:1096`, and warship methods beginning at `Config.ts:1136`.
- Impact:
  - This file is the first place to inventory math, costs, caps, ranges, timings, and difficulty modifiers.
  - It is not sufficient for a recreation guide because it omits how commands become executions, how tiles transfer, how alliances break, how units move, and how AI chooses actions.
- Recommendation:
  - Treat `Config` as the "numeric rules and formulas" source map.
  - For each `Config` method, document the consumer execution or state object that applies it.
  - Extract or manually transcribe tables for units, structures, costs, durations, resource weights, terrain modifiers, nuke radii, SAM range, warship thresholds, and win thresholds.
- Risk:
  - If the guide over-indexes on `Config`, it will miss behavior that is procedural rather than numeric.

### 2. The canonical glossary and schema surface are already explicit

- Evidence:
  - `Game.ts` defines `Difficulty` at line 59, `GameMapType` at line 97, `mapCategories` at line 182, `GameType` at line 275, and `GameMode` at line 283.
  - `Game.ts` defines `PublicGameModifiers` at line 300, `UnitInfo` at line 315, `UnitType` at line 332, `TerrainType` at line 507, `PlayerType` at line 515, and interfaces for `Attack`, `Unit`, `TerraNullius`, `Player`, and `Game` at lines 528, 605, 685, 698, and 859.
  - `Schemas.ts` defines `GameConfigSchema` at line 217, with public modifiers, nations, bots, disabled units, timers, multipliers, and host cheats at lines 226-268.
  - Player command schemas include attack, spawn, boat attack, target player, donate gold, build unit, and cancel attack at `Schemas.ts:330`, `336`, `341`, `362`, `384`, `396`, and `409`.
- Impact:
  - These files can anchor the guide's type vocabulary, configuration tables, command reference, and implementation schema.
  - They also define the legal ranges of lobby/modifier knobs, which are essential for recreating valid games.
- Recommendation:
  - Start the guide with a "Core Data Model" chapter covering game modes, map sizes, terrain, players, units, relations, commands, and game config.
  - Add schema tables that mirror `GameConfigSchema` and intent schemas, with source links and units such as ticks, minutes, gold/resource amount, tile refs, and booleans.
- Risk:
  - UI labels and schema names may not match exactly; the guide should preserve code names and separately document player-facing labels when needed.

### 3. Maps and tile mechanics are partly code-owned and partly asset-owned

- Evidence:
  - There are 80 map manifests under `main@782702c1:resources/maps/**/manifest.json`.
  - `resources/maps/world/manifest.json` includes normal, 4x, and 16x metadata plus named nation coordinates and flags.
  - `resources/maps/tourney1/manifest.json` shows tournament-style fixed nation coordinates.
  - `TerrainMapLoader.ts:14` defines map metadata, `TerrainMapLoader.ts:21` defines `MapManifest`, and `TerrainMapLoader.ts:47` loads normal or compact terrain from `map.bin`, `map4x.bin`, or `map16x.bin`.
  - `TerrainMapLoader.ts:65` scales nation coordinates for compact maps, and line 79 scales team spawn areas.
  - `GameMap.ts:4` defines the map API; `GameMap.ts:107` documents terrain byte bits for land, shoreline, ocean, and magnitude; `GameMap.ts:113` documents mutable state bits for owner, fallout, and defense bonus.
- Impact:
  - Terrain and maps cannot be documented only from enums. The guide needs to describe binary terrain representation, map sizes, compact scaling, nation coordinates, team spawn areas, and mutable tile state.
  - The user's examples of "tile types" and "expanding into the wilderness" require connecting `TerrainType`, terrain bytes, ownership state, and `TerraNullius`.
- Recommendation:
  - Create map guide chapters for terrain model, tile refs and coordinates, map asset layout, map categories, compact map scaling, nation spawn metadata, and mutable tile state.
  - Include a generated or curated appendix listing all 80 maps with dimensions and land-tile counts.
- Risk:
  - Binary terrain details are easy to omit because they are not player-visible, but they matter for a faithful implementation.

### 4. The per-tick simulation lifecycle is the backbone of the mechanics

- Evidence:
  - `GameImpl.ts:79` defines `GameImpl`, and line 99 initializes the per-tick update map.
  - `GameImpl.ts:145` starts player/nation addition; `GameImpl.ts:194` handles player creation.
  - `GameImpl.ts:433` defines `executeNextTick()`, which resets updates, ticks active executions, applies per-player changes, and returns game updates.
  - `GameImpl.ts:582` adds executions; `GameImpl.ts:694` performs tile conquest; `GameImpl.ts:867` sets winners; and `GameImpl.ts:1212` handles player conquest and captured gold/resources.
  - `PlayerImpl.ts:78` defines mutable player state, including resources, troops, relations, attacks, units, owned tiles, and spawn tile.
  - `PlayerImpl.ts:449` sets troops, `PlayerImpl.ts:452` delegates conquest, `PlayerImpl.ts:1005` adds gold, `PlayerImpl.ts:1012` adds resources, `PlayerImpl.ts:1114` returns troops, and `PlayerImpl.ts:1141` builds units.
- Impact:
  - A faithful guide must explain the engine loop and object lifecycle before chapters on individual mechanics; otherwise formulas appear disconnected from state mutation.
  - This also gives the guide a consistent template: command/input, validation, execution, state mutation, update event, tests.
- Recommendation:
  - Include an "Engine Loop and State" section covering tick rate assumptions, executions, player updates, tile ownership, unit lifecycle, update emission, and win-state setting.
  - Cross-reference every mechanic chapter back to its execution class and state mutation path.
- Risk:
  - Without lifecycle documentation, recreated mechanics may match constants but diverge in timing and order-of-operations.

### 5. Spawning, territory expansion, and combat form the core land game

- Evidence:
  - `SpawnTimerExecution.ts:11` ends spawn phase after `config().numSpawnPhaseTurns()`.
  - `SpawnExecution.ts:50` prevents random-spawn rerolls, `SpawnExecution.ts:56` computes a spawn, line 63 grants spawn tiles, line 74 records the spawn center, and line 105 starts team spawn area handling.
  - `Config.ts:621` defines spawn phase duration by singleplayer, random spawn, or default.
  - `Config.ts:799` defines attack amount as troop fraction, with bots using a smaller fraction than humans.
  - `AttackExecution.ts:20` defines land attack execution, `AttackExecution.ts:121` records attack stats, lines 151-168 apply relation penalties, lines 253 and 291 consume config attack rates/formulas, line 304 conquers tiles, and line 368 handles full player conquest.
  - `AttackImpl.ts:61` and `AttackImpl.ts:65` handle retreat ordering and execution.
  - `tests/core/execution/SpawnExecution.test.ts` covers random spawn placement, failed crowded spawns, and respawn behavior; `tests/Attack.test.ts` covers alliance interactions and transport-attack edge cases; `tests/TerritoryCapture.test.ts` covers basic spawn ownership.
- Impact:
  - "A nation and expanding into the wilderness" crosses spawning, ownership, TerraNullius, attack amount, terrain-specific loss/speed formulas, bot/human differences, relation changes, and player conquest.
- Recommendation:
  - Document spawning and expansion as an integrated sequence: spawn selection, initial territory, spawn immunity, legal attack targets, wilderness capture, player-vs-player combat, retreat, conquest rewards, and relation side effects.
  - Include formulas for terrain combat: plains, highland, mountain, defense posts, fallout, disconnected teammate exception, bot defender modifiers, large-player debuffs, and traitor debuffs.
- Risk:
  - Combat is a high-risk documentation area because many modifiers stack multiplicatively.

### 6. Troops, resources, gold, and trade are a mixed economy model

- Evidence:
  - `Config.ts:807` sets starting manpower by player type and nation difficulty.
  - `Config.ts:828` defines maximum troop capacity from territory and cities, then applies bot and nation difficulty modifiers.
  - `Config.ts:862` defines resource capacity from territory and silos.
  - `Config.ts:903` defines logistic troop growth with bot and nation multipliers.
  - `Config.ts:943` defines resource growth using equal passive regen and terrain production split.
  - `Config.ts:959` gives terrain resource weights: plains bias energy, highland biases food, mountain biases materials.
  - `Resources.ts:1` defines resource kinds `food`, `energy`, and `materials`; `Resources.ts:23` maps gold amount into equal resource stocks; `Resources.ts:81` implements regen as `10 + current^0.73 / 4`, scaled by remaining capacity.
  - `ResourceTrade.ts:19` defines equal blend and `ResourceTrade.ts:25` computes trade manifests from surplus, deficit, and headroom.
  - `TrainStation.ts:18` and `TradeShipExecution.ts:217` use `calculateTradeExchange()` for rail and ship exchange.
- Impact:
  - The economy chapter must distinguish gold, resources, troop capacity, troop growth, resource capacity, resource regen, terrain blend, trade exchange, and conquest capture.
  - Existing `docs/Economy.md` explains intent, but code on `main` still needs precise formula tables and source-backed examples.
- Recommendation:
  - Document economy in layers: stocks, capacities, production, conversion, costs, terrain weighting, growth/regen equations, trade exchange, conquest transfer, and UI display.
  - Include worked examples for a small player, a city/silo owner, a bot, and each nation difficulty.
- Risk:
  - Resource and troop terms can be confused because gold and resources can mirror each other in some helper functions but diverge in costs and trade.

### 7. Structures, units, naval systems, rails, and logistics are separate mechanics families

- Evidence:
  - `Game.ts:332` enumerates units: transport, warship, shell, SAM missile, port, atom bomb, hydrogen bomb, trade ship, missile silo, defense post, SAM launcher, city, MIRV, MIRV warhead, train, rail station, silo, and factory.
  - `Config.ts:290` maps those units to costs, construction durations, health, damage, and upgrade capability.
  - `PlayerImpl.ts:1197` validates unit build types, `PlayerImpl.ts:1309` handles `canBuild()`, and `PlayerImpl.ts:1141` mutates player state when building.
  - `PortExecution.ts:47` spawns trade ships and line 87 links ports to rail stations.
  - `TradeShipExecution.ts:179` grants trade gold and `TradeShipExecution.ts:217` performs resource exchange.
  - `RailStationExecution.ts:37` creates train station nodes for nearby structures; `TrainStationExecution.ts:53` handles train spawn decisions; `TrainExecution.ts:144` creates train units and line 268 applies station stop behavior.
  - `RailNetworkImpl.ts:103` connects stations; line 249 uses `config().railroadMaxSize()`; line 358 constructs railroad paths.
  - `WarshipExecution.ts:17` defines warship behavior; lines 98-120 choose target classes; lines 124-144 apply passive healing; lines 319-424 implement retreat and docking movement; lines 610-622 fire shells.
  - `ShellExecution.ts:66` reads shell base damage and lines 70-72 randomize damage.
- Impact:
  - Unit documentation should be organized by family: structures, land attack/transport, naval, rail/trade, nukes/SAMs, and support units.
  - A single "Units" page would be too shallow for equal implementation work.
- Recommendation:
  - Build per-family chapters with a shared table shape: unit type, build conditions, cost/resource split, duration, state fields, execution class, behavior loop, destruction/capture effects, and tests.
- Risk:
  - Warship and rail systems have enough procedural logic that tables alone will not explain them.

### 8. Nukes, MIRVs, SAMs, fallout, and water nukes are one of the densest rule clusters

- Evidence:
  - `Config.ts:1068` defines nuke radii, `Config.ts:1086` defines alliance break threshold, `Config.ts:1090` sets nuke speed, `Config.ts:1094` sets targetable range, `Config.ts:1096` computes SAM range by launcher level, and `Config.ts:1110` computes deaths.
  - `NukeExecution.ts:22` defines nuke execution; line 62 reads nuke magnitude; line 67 checks `waterNukes`; lines 124-170 break alliances; line 189 creates trajectory; lines 306-354 apply blast deaths and fallout/water effects.
  - `MIRVExecution.ts:18` defines MIRV launch behavior and lines 60-62 break alliances with the target player.
  - `SAMLauncherExecution.ts:86` scans nuke trajectories; line 109 reads `samRange(level)`.
  - `SAMMissileExecution.ts:14` defines the missile execution.
  - `tests/nukes/WaterNukes.test.ts` validates water nuke conversion versus fallout; `tests/AllianceAcceptNukes.test.ts` validates alliance acceptance canceling in-flight nukes; `tests/NationNukeSamOverwhelm.test.ts` validates AI SAM-overwhelm behavior.
- Impact:
  - This cluster requires both math and lifecycle documentation: targeting, trajectory targetability, interception, blast effects, fallout/water mutation, deaths, alliance breaking, and AI planning.
- Recommendation:
  - Give nukes/SAMs their own implementation chapter with sequence diagrams or ordered steps, plus tables for radius, speed, range, cooldown, construction, death formulas, and SAM level behavior.
- Risk:
  - Incorrect ordering of SAM interception, trajectory targetability, and blast application would produce visibly different games.

### 9. Diplomacy, relations, donations, embargoes, target pings, and traitor state are not cosmetic

- Evidence:
  - `Config.ts:568` defines donation cooldown, `Config.ts:599` defines alliance duration, and `Config.ts:1176` defines alliance-extension prompt offset.
  - `PlayerImpl.ts:509` reads alliances, `PlayerImpl.ts:530` finds alliance with another player, `PlayerImpl.ts:609` gates alliance request cooldown, `PlayerImpl.ts:620` checks traitor state, `PlayerImpl.ts:632` marks traitor, `PlayerImpl.ts:651` maps numeric relation to `Relation`, `PlayerImpl.ts:684` updates relation, and `PlayerImpl.ts:900` gates embargo-all cooldown.
  - `AttackExecution.ts:151-168` applies relation penalties when attacking nations by difficulty.
  - `NukeExecution.ts:124-170` breaks alliances affected by nuke strikes.
  - `tests/AllianceRequestExecution.test.ts`, `tests/AllianceExtensionExecution.test.ts`, `tests/AllianceDonation.test.ts`, `tests/Donate.test.ts`, and `tests/Attack.test.ts` cover diplomacy and war side effects.
- Impact:
  - Diplomacy affects combat, AI behavior, donations, targeting, alliance cancellation, nuke cancellation, traitor debuffs, and message surfaces.
- Recommendation:
  - Document diplomacy as a mechanics chapter, not a UI appendix. Include relation thresholds, cooldowns, alliance lifecycle, extension flow, betrayal/traitor debuffs, donation transfer rules, embargo effects, and attack/nuke side effects.
- Risk:
  - Diplomacy rules are distributed and frequently enforced by execution side effects, so they are easy to under-document.

### 10. Nation AI is a first-class mechanics subsystem

- Evidence:
  - `NationExecution.ts:27` defines the nation AI execution and composes behavior modules for emoji, MIRV, alliances, warships, nukes, and structures at lines 18-23 and 210-250.
  - `NationExecution.ts:75` branches by game difficulty; line 194 sends casual emoji, line 196 handles alliance requests, line 198 considers MIRVs, line 200 considers warships, line 203 counters warship infestation, and line 204 considers nukes.
  - `NationCreation.ts:76` handles compact map nation counts and line 96 handles requested nation count versus manifest nations.
  - `NationNukeBehavior.ts` includes difficulty-specific target selection, SAM-aware avoidance, crown targeting, team targeting, MIRV saving, repeated nuke cost inflation, and SAM-overwhelm planning.
  - `NationStructureBehavior.test.ts` covers rail stations, capacity pressure structures, factory build pressure, city ratios, defense posts, front sampling, and reachable stations.
  - `NationMIRV.test.ts` validates MIRV retaliation, victory denial, steamroll prevention, and team-victory denial.
- Impact:
  - AI nations are not just bots with different stats. They have specific strategic behaviors and difficulty-gated rules.
- Recommendation:
  - Create a dedicated "Nations and AI" section covering nation creation, difficulty modifiers, attack aggression, relations, alliances, structure construction, warships, nukes, MIRVs, emojis, and tests.
- Risk:
  - Nation AI is broad and behavior-heavy; it needs careful source indexing before prose writing.

### 11. Player-facing controls and UI are source material for command discoverability

- Evidence:
  - `Schemas.ts:330-409` defines command schemas, while UI and HUD files under `src/client/hud/layers/` include `BuildMenu.ts`, `MainRadialMenu.ts`, `PlayerActionHandler.ts`, `ControlPanel.ts`, `UnitDisplay.ts`, `AttacksDisplay.ts`, and `SendResourceModal.ts`.
  - `src/client/controllers/WarshipSelectionController.ts` and `src/client/controllers/BuildPreviewController.ts` provide interaction-specific behavior for warship movement and build previews.
  - `src/client/SinglePlayerModal.ts`, `src/client/HostLobbyModal.ts`, and `src/client/components/GameConfigSettings.ts` expose configuration knobs to players.
- Impact:
  - A mechanics guide that supports recreation should include the command surface: what players can request, not just what the engine can do.
- Recommendation:
  - Document commands by source schema and UI entry point: spawn, attack, boat attack, build, move warship, target player, donate, alliance, break alliance, embargo, emoji/quick chat, food/resource controls if present, and host config.
- Risk:
  - UI code may contain presentation-only details; the guide should separate command availability from visual layout.

### 12. Tests should be treated as behavior evidence, not just validation

- Evidence:
  - Core mechanic tests include `tests/Attack.test.ts`, `tests/TerritoryCapture.test.ts`, `tests/Warship.test.ts`, `tests/WarshipMultiSelection.test.ts`, `tests/NationMIRV.test.ts`, `tests/NationNukeSamOverwhelm.test.ts`, `tests/NationStructureBehavior.test.ts`, `tests/PortExecution.test.ts`, `tests/core/executions/TradeShipExecution.test.ts`, `tests/core/executions/RailStationExecution.test.ts`, `tests/core/game/Resources.test.ts`, `tests/core/game/ResourceTrade.test.ts`, `tests/TeamAssignment.test.ts`, and `tests/MapConsistency.test.ts`.
  - Tests include edge cases that are not obvious from method names, such as alliance creation during attacks, water nukes, warship retreat while firing back, crowded spawn failures, and SAM-overwhelm planning.
- Impact:
  - Tests preserve intent and can disambiguate mechanics where code is optimized, indirect, or spread across classes.
- Recommendation:
  - Every guide chapter should end with "behavior evidence" listing the tests that lock down the rules and notable edge cases.
- Risk:
  - Tests sometimes use overrides and fixtures; guide authors must distinguish canonical defaults from test-specific stubs.

## Quick Wins

- Create a canonical source index from `main@782702c1` grouping files by mechanics family.
- Build initial mdBook table of contents around existing source families: core model, map/terrain, engine loop, spawning, economy, combat, structures, navy, rail/trade, nukes/SAMs, diplomacy, nations, win conditions, configuration, UI commands, and tests.
- Extract `Game.ts` enums/interfaces and `Schemas.ts` config/intent schemas into documentation tables.
- Extract `Config.ts` methods into a first numeric mechanics table with method name, formula/value, unit, consumer, and source line.
- Generate or curate a map appendix listing all map manifests, dimensions, land tiles, compact scaling behavior, and nation metadata.

## Medium Changes

- Write formula-focused chapters for troop growth, resource regeneration, capacity, attack resolution, nuke deaths, SAM range, trade ship payout, trade exchange, train value, and win thresholds.
- Trace each execution class into an ordered lifecycle: init, active during spawn phase, tick behavior, state mutation, updates emitted, cleanup.
- Build AI nation behavior documentation from `NationExecution` and behavior modules, with difficulty-specific subsections.
- Add chapter-level test evidence tables linking behavior claims to tests.
- Add source-link conventions that explicitly identify `main@782702c1` so branch drift does not confuse future readers.

## High-Risk Decisions

- Whether the final guide should document only `main@782702c1` forever, or later compare canonical `main` against the modified current branch.
- Whether to generate mechanics tables directly from TypeScript AST/imports or maintain curated Markdown with source links. Direct generation reduces drift but may be hard for formulas embedded in code.
- Whether to include exhaustive AI behavior in the same book or split it into an appendix. Keeping it in the main book improves completeness but increases size substantially.
- Whether to document renderer-derived visual behavior. Most rendering is non-mechanical, but overlays for range, selection, fallout, borders, and unit state can clarify mechanics.

## Guardrails

- Keep `main@782702c1d6c8614f2c44590584b0b34c1016020d` as the declared evidence baseline.
- Do not use current branch mechanics as canonical unless explicitly comparing drift.
- Every numeric claim should point to `Config`, an execution file, a model object, a map manifest, or a test.
- Separate player-facing explanation from implementation formulas, but keep both in the same chapter when the concept is the same.
- Distinguish defaults from lobby-configurable modifiers and host cheats.
- Distinguish human, bot, and nation behavior throughout the guide.
- Treat tests as supporting evidence and edge-case references, not as the source of default constants unless the tested code path proves it.
- Avoid silently summarizing procedural behavior as constants; document order of operations for attack, spawn, nuke, warship, rail, trade, and AI loops.
