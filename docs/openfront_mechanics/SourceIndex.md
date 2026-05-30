# Canonical Source Index

This page is the source map for the canonical mechanics guide. All entries refer to `main@782702c1d6c8614f2c44590584b0b34c1016020d`, inspected from `/private/tmp/openfront-main-analysis`.

The current working branch can differ from this baseline. Use these paths as source locations for the guide, not as a claim that the active branch still behaves the same.

## Runtime Core

| Mechanics family | Canonical sources | What to extract |
| --- | --- | --- |
| Core vocabulary | `src/core/game/Game.ts` | `Difficulty`, `GameMapType`, `GameType`, `GameMode`, `PublicGameModifiers`, `UnitInfo`, `UnitType`, `TerrainType`, `PlayerType`, `Attack`, `Unit`, `TerraNullius`, `Player`, `Game`. |
| Game configuration and intents | `src/core/Schemas.ts` | `GameConfigSchema`, public modifiers, nations/bots limits, disabled units, timers, gold settings, host cheats, attack/spawn/build/donate/target intent payloads. |
| Numeric rules and formulas | `src/core/configuration/Config.ts` | Unit costs, construction times, spawn phase duration, attack formulas, troop and resource growth, nuke radii, SAM range, warship ranges, cooldowns, win thresholds. |
| Game loop and state | `src/core/game/GameImpl.ts`, `src/core/game/PlayerImpl.ts`, `src/core/game/AttackImpl.ts`, `src/core/game/UnitImpl.ts` | Per-tick execution order, player creation, tile conquest, player conquest, resource/troop mutation, build validation, attack lifecycle, unit lifecycle. |
| Resources and trade math | `src/core/game/Resources.ts`, `src/core/game/ResourceTrade.ts`, `src/core/game/ResourceFormatting.ts` | Resource kinds, gold-to-resource conversion, regen formula, capacity clamping, surplus/deficit/headroom trade exchange. |
| Maps and terrain | `src/core/game/GameMap.ts`, `src/core/game/TerrainMapLoader.ts`, `src/core/game/GameMapLoader.ts`, `src/core/game/WaterManager.ts`, `src/core/game/TerrainSearchMap.ts` | Tile refs, terrain bytes, state bits, land/water/ocean/shoreline, map loading, compact scaling, water components. |
| Pathfinding | `src/core/pathfinding/**` | Land, water, air, rail, station, and parabola pathfinding behavior used by attacks, ships, nukes, rails, and movement. |

## Executions

| Mechanics family | Canonical sources | What to extract |
| --- | --- | --- |
| Spawning | `src/core/execution/SpawnExecution.ts`, `src/core/execution/SpawnTimerExecution.ts`, `src/core/execution/utils/PlayerSpawner.ts` | Spawn selection, random-spawn reroll prevention, initial territory, team spawn areas, spawn phase ending. |
| Land combat and conquest | `src/core/execution/AttackExecution.ts`, `src/core/execution/RetreatExecution.ts`, `src/core/game/AttackImpl.ts` | Attack initialization, troop commitment, tile capture, retreat, relation penalties, player conquest. |
| Construction and structures | `src/core/execution/ConstructionExecution.ts`, `src/core/execution/CityExecution.ts`, `src/core/execution/DefensePostExecution.ts`, `src/core/execution/MissileSiloExecution.ts`, `src/core/execution/PortExecution.ts`, `src/core/execution/RailStationExecution.ts`, `src/core/execution/SAMLauncherExecution.ts`, `src/core/execution/UpgradeStructureExecution.ts` | Build lifecycle, construction completion, structure effects, upgrades, train station hooks, SAM launcher behavior. |
| Donations, diplomacy, and communication | `src/core/execution/DonateGoldExecution.ts`, `src/core/execution/DonateTroopExecution.ts`, `src/core/execution/EmbargoExecution.ts`, `src/core/execution/EmbargoAllExecution.ts`, `src/core/execution/TargetPlayerExecution.ts`, `src/core/execution/EmojiExecution.ts`, `src/core/execution/QuickChatExecution.ts`, `src/core/execution/alliance/**` | Alliance request/accept/reject/extension/break behavior, donation transfer, embargo rules, target pings, emoji and quick chat timings. |
| Nukes and SAMs | `src/core/execution/NukeExecution.ts`, `src/core/execution/MIRVExecution.ts`, `src/core/execution/SAMLauncherExecution.ts`, `src/core/execution/SAMMissileExecution.ts`, `src/core/execution/Util.ts` | Nuke trajectory, targetability, interception, blast effects, deaths, fallout, water nukes, alliance break checks, MIRV launch behavior. |
| Navy and mobile units | `src/core/execution/TransportShipExecution.ts`, `src/core/execution/WarshipExecution.ts`, `src/core/execution/MoveWarshipExecution.ts`, `src/core/execution/ShellExecution.ts`, `src/core/execution/BoatRetreatExecution.ts` | Transport movement, boat attacks, warship patrol, targeting, shell damage, retreat, docking, port healing. |
| Rail and trade | `src/core/execution/TradeShipExecution.ts`, `src/core/execution/TrainExecution.ts`, `src/core/execution/TrainStationExecution.ts`, `src/core/execution/RailStationExecution.ts`, `src/core/game/RailNetworkImpl.ts`, `src/core/game/Railroad.ts`, `src/core/game/TrainStation.ts` | Trade ship spawning and payout, resource exchange, rail graph construction, train spawning, station stop behavior. |
| Win and lifecycle | `src/core/execution/WinCheckExecution.ts`, `src/core/execution/MarkDisconnectedExecution.ts`, `src/core/execution/DeleteUnitExecution.ts`, `src/core/execution/PauseExecution.ts` | Win checks, disconnect handling, unit deletion, pause behavior. |

## Nation AI

| Mechanics family | Canonical sources | What to extract |
| --- | --- | --- |
| Nation creation | `src/core/game/NationCreation.ts`, `src/core/game/TerrainMapLoader.ts`, `resources/maps/**/manifest.json` | Manifest nation coordinates, additional nations, compact count behavior, procedural overflow. |
| Nation execution loop | `src/core/execution/NationExecution.ts` | Difficulty branching, periodic decisions, behavior orchestration. |
| Nation alliances | `src/core/execution/nation/NationAllianceBehavior.ts` | Request acceptance/rejection, extension handling, relation checks. |
| Nation structures | `src/core/execution/nation/NationStructureBehavior.ts` | City, defense post, factory, rail station, silo, and capacity/pressure decisions. |
| Nation nukes and MIRVs | `src/core/execution/nation/NationNukeBehavior.ts`, `src/core/execution/nation/NationMIRVBehavior.ts` | Target selection, crown/team targeting, SAM avoidance, SAM overwhelm, retaliation, victory denial, saving thresholds. |
| Nation warships and emojis | `src/core/execution/nation/NationWarshipBehavior.ts`, `src/core/execution/nation/NationEmojiBehavior.ts` | Warship spawning/counterplay and signal behavior. |

## Client Command Surfaces

| Mechanics family | Canonical sources | What to extract |
| --- | --- | --- |
| HUD commands | `src/client/hud/layers/BuildMenu.ts`, `src/client/hud/layers/MainRadialMenu.ts`, `src/client/hud/layers/PlayerActionHandler.ts`, `src/client/hud/layers/ControlPanel.ts`, `src/client/hud/layers/SendResourceModal.ts`, `src/client/hud/layers/UnitDisplay.ts`, `src/client/hud/layers/AttacksDisplay.ts` | How player actions map to intents and visible mechanics. |
| Command previews and selection | `src/client/controllers/BuildPreviewController.ts`, `src/client/controllers/WarshipSelectionController.ts`, `src/client/controllers/HoverHighlightController.ts` | Build legality feedback, warship movement selection, hover affordances. |
| Game configuration UI | `src/client/SinglePlayerModal.ts`, `src/client/HostLobbyModal.ts`, `src/client/components/GameConfigSettings.ts`, `src/client/utilities/GameConfigHelpers.ts` | Player-facing config controls, defaults, bounds, public modifiers. |

## Assets

| Asset family | Canonical sources | What to extract |
| --- | --- | --- |
| Maps | `resources/maps/**/manifest.json`, `resources/maps/**/map.bin`, `resources/maps/**/map4x.bin`, `resources/maps/**/map16x.bin` | Map dimensions, land-tile counts, nation coordinates, team spawn areas, compact variants. |
| Flags and cosmetics | `resources/flags/**`, `src/core/CosmeticSchemas.ts`, `src/client/Cosmetics.ts` | Nation flags and cosmetic display data where relevant to players, not simulation. |

There are 80 map manifests on the canonical ref. The final map appendix should list each map with normal, 4x, and 16x dimensions plus land-tile counts.

## Tests

Use tests as evidence for behavior, especially where code is procedural or edge-case heavy.

| Mechanics family | Canonical test sources |
| --- | --- |
| Spawning and territory | `tests/core/execution/SpawnExecution.test.ts`, `tests/TerritoryCapture.test.ts`, `tests/MapConsistency.test.ts` |
| Combat and alliances | `tests/Attack.test.ts`, `tests/AttackStats.test.ts`, `tests/AllianceRequestExecution.test.ts`, `tests/AllianceExtensionExecution.test.ts`, `tests/AllianceAcceptNukes.test.ts` |
| Donations and relations | `tests/AllianceDonation.test.ts`, `tests/Donate.test.ts`, `tests/Team.test.ts`, `tests/TeamAssignment.test.ts` |
| Economy and trade | `tests/core/game/Resources.test.ts`, `tests/core/game/ResourceTrade.test.ts`, `tests/core/executions/TradeShipExecution.test.ts`, `tests/PortExecution.test.ts` |
| Rail | `tests/core/executions/RailStationExecution.test.ts`, `tests/core/game/RailNetwork.test.ts`, `tests/core/game/TrainStation.test.ts`, `tests/core/pathfinding/PathFinding.Rail.test.ts` |
| Warships | `tests/Warship.test.ts`, `tests/WarshipMultiSelection.test.ts` |
| Nukes and SAMs | `tests/nukes/WaterNukes.test.ts`, `tests/core/executions/NukeExecution.test.ts`, `tests/core/executions/SAMLauncherExecution.test.ts`, `tests/NationNukeSamOverwhelm.test.ts` |
| Nation AI | `tests/NationCreation.test.ts`, `tests/NationAllianceBehavior.test.ts`, `tests/NationMIRV.test.ts`, `tests/NationStructureBehavior.test.ts`, `tests/NationCounterWarshipInfestation.test.ts` |

## Extraction Rules

- Prefer canonical source files over current-branch files.
- Preserve exact code names for types, methods, units, and config fields.
- Record units for every number: ticks, tiles, troops, gold, resource amount, health, range, probability, or percentage.
- Distinguish defaults from lobby-configurable overrides and host cheats.
- Distinguish human, bot, nation, and Terra Nullius behavior.
- Link procedural mechanics to the execution class that applies them.
