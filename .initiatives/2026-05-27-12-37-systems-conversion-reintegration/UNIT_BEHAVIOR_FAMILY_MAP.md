# Unit Behavior Family Map

This map scopes W5 before implementation. The migration should preserve the
current execution chains first, then retire legacy wrappers only after parity
fixtures cover each family.

## Phase Ownership

| Phase                    | System owner                                     | Current source                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Command validation       | `UnitCommandSystem`, `ConstructionCommandSystem` | `ConstructionExecution`, `DeleteUnitExecution`, `UpgradeStructureExecution`, `MoveWarshipExecution`, `BoatRetreatExecution`                                                                                    |
| Spawn/activation         | `UnitActivationSystem`                           | `ConstructionExecution.init`, `TransportShipExecution.init`, `NukeExecution.init`, `MirvExecution.init`, `ShellExecution.init`, `SAMMissileExecution.init`, `WarshipExecution.init`, `TradeShipExecution.init` |
| Simulation tick          | Family systems below                             | `tick(...)` methods on unit executions                                                                                                                                                                         |
| Post-tick cleanup/update | `UnitLifecycleSystem`                            | `unit.delete`, `markForDeletion`, inactive execution removal, player/unit update diffs                                                                                                                         |

## Behavior Families

| Family                             | Executions                                                                                                                                                                                                                                                              | Proposed systems                                                                                                                                                 | Notes                                                                                                                                                                       |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Construction and static structures | `ConstructionExecution`, `PortExecution`, `MissileSiloExecution`, `DefensePostExecution`, `SAMLauncherExecution`, `CityExecution`, `RailStationExecution`, `TrainStationExecution`, `UpgradeStructureExecution`, `DeleteUnitExecution`, `RecomputeRailClusterExecution` | `ConstructionCommandSystem`, `StructureActivationSystem`, `StructureTickSystem`, `StructureUpgradeSystem`, `StructureDeletionSystem`, `RailInfrastructureSystem` | Keep `Player.buildUnit`, build-cost checks, construction timers, and structure capture semantics canonical.                                                                 |
| Naval/mobile units                 | `WarshipExecution`, `MoveWarshipExecution`, `TransportShipExecution`, `BoatRetreatExecution`, `TradeShipExecution`                                                                                                                                                      | `WarshipBehaviorSystem`, `TransportShipSystem`, `TradeShipSystem`, `MobileUnitCommandSystem`                                                                     | Warships own targeting, patrol/dock/repair, shell spawning, capture, and motion plans. Transport ships can spawn `AttackExecution` on landing until W6 command unification. |
| Projectile and nuclear lifecycle   | `NukeExecution`, `MirvExecution`, `ShellExecution`, `SAMLauncherExecution`, `SAMMissileExecution`, `MissileSiloExecution`                                                                                                                                               | `ProjectileLaunchSystem`, `NukeFlightSystem`, `MirvSplitSystem`, `ShellImpactSystem`, `SamDefenseSystem`, `MissileSiloSystem`                                    | Preserve bomb launch/land/intercept stats, trajectory/motion plans, delayed launches, SAM target selection, and blast damage ordering.                                      |
| Rail and trains                    | `TrainStationExecution`, `TrainExecution`, `RailStationExecution`, `RecomputeRailClusterExecution`                                                                                                                                                                      | `RailInfrastructureSystem`, `TrainDispatchSystem`, `TrainMovementSystem`                                                                                         | Shared rail-cluster state is a hotspot because city, rail station, port, factory, and train behavior all read it.                                                           |
| AI/nation unit commands            | `NationStructureBehavior`, `NationWarshipBehavior`, `NationNukeBehavior`, `NationMIRVBehavior`, `AiAttackBehavior`                                                                                                                                                      | W6 command surfaces over the W5 systems                                                                                                                          | W5 should keep current AI calls working through compatibility wrappers; W6 migrates intent submission.                                                                      |

## Execution-Spawn Chains

| Chain                                                                                                          | Current behavior                                                                         | System equivalent                                                                                                       |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ConstructionExecution(AtomBomb/HydrogenBomb)` -> `NukeExecution`                                              | Validates build, creates nuke, launches from silo/spawn, applies blast, stats, cleanup   | `ConstructionCommandSystem` creates launch request; `ProjectileLaunchSystem` activates `NukeFlightSystem`.              |
| `ConstructionExecution(MIRV)` -> `MirvExecution` -> multiple `NukeExecution(MIRVWarhead)`                      | Launches MIRV, lands/splits into warheads, each warhead follows nuke lifecycle           | `MirvSplitSystem` emits warhead launch requests into `NukeFlightSystem`.                                                |
| `ConstructionExecution(Warship)` -> `WarshipExecution`                                                         | Builds warship, patrols, targets enemy naval units, fires shells, captures/repairs/docks | `StructureActivationSystem` or command system builds; `WarshipBehaviorSystem` owns tick.                                |
| `ConstructionExecution(Port)` -> `PortExecution` -> `TradeShipExecution`, optionally `TrainStationExecution`   | Port periodically launches trade ships and may become rail-linked                        | `StructureTickSystem` emits trade/rail activation to `TradeShipSystem` and `RailInfrastructureSystem`.                  |
| `ConstructionExecution(DefensePost)` -> `DefensePostExecution` -> `ShellExecution`                             | Defense post tracks target tiles and fires shells                                        | `StructureTickSystem` emits shell launch requests to `ShellImpactSystem`.                                               |
| `ConstructionExecution(SAMLauncher)` -> `SAMLauncherExecution` -> `SAMMissileExecution`                        | Launcher scans incoming nukes/MIRVs and launches intercept missiles                      | `SamDefenseSystem` owns scan, launch, missile flight, intercept, and stats.                                             |
| `ConstructionExecution(City/RailStation)` -> `CityExecution`/`RailStationExecution` -> `TrainStationExecution` | Creates rail/train station behavior where valid                                          | `RailInfrastructureSystem` owns station activation and cluster recompute.                                               |
| `TrainStationExecution` -> `TrainExecution`                                                                    | Dispatches trains on available routes                                                    | `TrainDispatchSystem` and `TrainMovementSystem`.                                                                        |
| `TransportShipExecution` -> `AttackExecution`                                                                  | Launches transport, moves over water, lands as a boat-sourced attack, handles retreat    | `TransportShipSystem` owns boat lifecycle; landing can continue to call `AttackCommandSystem`/`BattleResolutionSystem`. |
| `WarshipExecution` -> `ShellExecution`                                                                         | Fires shells from warship targets                                                        | `WarshipBehaviorSystem` emits shell launch requests to `ShellImpactSystem`.                                             |

## Shared Write Hotspots

- `PlayerImpl.buildUnit`, `captureUnit`, `deleteUnit`, `upgradeUnit`, and unit
  ownership arrays.
- Mutable unit state: tile/lastTile, target tile/unit, trajectory index,
  missile queues, transport/warship state, construction status, health, troops,
  marked-for-deletion flags.
- `GameImpl.addExecution` chains, because many unit behaviors currently spawn
  child executions during `init` or `tick`.
- Stats and events: bomb launch/land/intercept, shell damage, conquest gold,
  display messages, tile/unit updates, motion plans.
- Map and spatial queries: `nearbyUnits`, rail clusters, ports, water/land
  checks, best transport spawn, border ownership.
- Existing AI/nation behaviors directly instantiate executions and should stay
  compatible until W6 command migration.

## Migration Order

1. Add adapter/services around unit creation and lifecycle without changing
   callers.
2. Extract static structure activation/ticks first; this gives ports, defense
   posts, SAM launchers, cities, rail stations, silos, and factories explicit
   system owners.
3. Extract mobile/naval systems while keeping transport landing compatible with
   the W4 attack systems.
4. Extract projectile/nuke/SAM systems with focused motion-plan and stats
   parity.
5. Expand parity fixtures for construction, structures, transport, warships,
   trade ships, trains, nukes, MIRVs, SAMs, and shells before retiring wrappers.
