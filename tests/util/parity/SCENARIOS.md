# Systems Parity Scenario Inventory

This inventory tracks behavior that must remain 1:1 while the canonical game
runtime moves from legacy `Execution` objects to native systems. Scenarios here
should be expressed with `ParityRunner` whenever old and new paths can both be
constructed; before a systems path exists, they establish legacy baselines.

## Snapshot Surface

Every scenario should compare, when relevant:

- Game tick, spawn phase, pause state, winner, and parity hash.
- Player troops, resources, gold, tiles, border tiles, attacks, units,
  alliances, targets, embargoes, and betrayals.
- Active attacks: attacker, target, troops, retreat state, source tile, border
  size, and clustered positions.
- Units: owner, tile, last tile, active/deletion flags, troops, health, level,
  construction state, targeting, cooldown queues, and movement state.
- Stats and emitted updates, including packed tile updates and motion plans.

## Coverage Matrix

| Family                     | Scenario                                                                       | Existing Coverage                                                                                           | Parity Intent                                                              |
| -------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Economy                    | Passive troop/resource tick for a spawned player                               | `tests/core/executions/PlayerExecution.test.ts`, `tests/core/systems/PlayerEconomyRegression.test.ts`       | Preserve `PlayerExecution` economy deltas and resource bigint behavior.    |
| Player upkeep              | Structure transfer/downgrade after tile owner changes                          | `tests/core/executions/PlayerExecution.test.ts`                                                             | Preserve non-economy upkeep when split into systems.                       |
| Player timers              | Alliance expiry and temporary embargo expiry                                   | `tests/AllianceExtensionExecution.test.ts`, embargo tests under `tests`                                     | Preserve per-tick diplomacy cleanup.                                       |
| Attack startup             | Player attack creates active attack, removes committed troops, records stats   | `tests/Attack.test.ts`, `tests/AttackStats.test.ts`                                                         | Preserve command validation and startup side effects.                      |
| Counterattack              | Opposing attacks cancel or reduce each other                                   | `tests/Attack.test.ts`                                                                                      | Preserve active attack merge/cancel semantics.                             |
| Attack tick                | Active attack captures land and applies attacker/defender losses               | `tests/Attack.test.ts`, `tests/core/game/GameImpl.test.ts`                                                  | Preserve combat formula output, frontier progression, and tile updates.    |
| Retreat                    | Cancelled attacks return survivors with current penalties                      | `tests/Attack.test.ts`                                                                                      | Preserve retreat flags, troop return, and stats.                           |
| Conquest                   | Dead defender cleanup, gold/resource transfer, conquest event                  | `tests/ConquerGold.test.ts`, `tests/Attack.test.ts`                                                         | Preserve ownership, rewards, messages, stats, and terminal attack cleanup. |
| Disconnected/team behavior | Attacking disconnected teammate does not apply normal betrayal/loss behavior   | `tests/Disconnected.test.ts`, `tests/core/game/GameImpl.test.ts`                                            | Preserve special-case diplomacy and combat behavior.                       |
| Terra nullius              | Attack unowned land                                                            | `tests/Attack.test.ts`, `tests/TerritoryCapture.test.ts`                                                    | Preserve unowned target capture speed and loss behavior.                   |
| Construction               | Build completion, cost, under-construction state, structure execution spawning | `tests/economy/ConstructionGold.test.ts`, `tests/core/execution/SpawnExecution.test.ts`                     | Preserve infrastructure lifecycle before execution spawning is removed.    |
| Structures                 | City, port, rail station, train station, silo, defense post behavior           | `tests/PortExecution.test.ts`, `tests/core/executions/PlayerExecution.test.ts`                              | Preserve recurring structure behavior and ownership transfer.              |
| Warships                   | Patrol, combat, manual movement, retreat/docking, update emission              | `tests/Warship.test.ts`, `tests/WarshipMultiSelection.test.ts`                                              | Preserve motion plans, unit updates, and combat state.                     |
| Transport ships            | Boat launch, landing, retreat, landing attack creation                         | `tests/Attack.test.ts`, `tests/Disconnected.test.ts`                                                        | Preserve naval troop movement and attack handoff.                          |
| Trade ships                | Trade generation, capture, route behavior                                      | `tests` references to `TradeShipExecution`                                                                  | Preserve resource/gold transfer and unit cleanup.                          |
| Trains                     | Train station behavior, loaded state, station arrival rewards                  | `src/core/game/TrainStation.ts` tests where present                                                         | Preserve train lifecycle and resource transfer.                            |
| Nukes/MIRVs                | Launch, trajectory, land effects, fallout, water conversion                    | `tests/nukes`, `tests/core/executions/NukeExecution.test.ts`, `tests/core/executions/MIRVExecution.test.ts` | Preserve projectile lifecycle and map mutation.                            |
| SAMs                       | Launcher cooldown, targeting, missile interception                             | `tests/core/executions/SAMLauncherExecution.test.ts`, `tests/NationNukeSamOverwhelm.test.ts`                | Preserve interception and cooldown semantics.                              |
| Shells                     | Shell targeting and random behavior                                            | `tests/ShellRandom.test.ts`                                                                                 | Preserve deterministic random behavior.                                    |
| AI/bots                    | Bot attack timing and target selection                                         | `src/core/execution/utils/AiAttackBehavior.ts`, attack tests                                                | Preserve commands emitted by AI at equivalent ticks.                       |
| Nations                    | Nation structures, alliances, nukes, MIRVs, warships, emoji behavior           | `tests/NationMIRV.test.ts`, `tests/NationCounterWarshipInfestation.test.ts`                                 | Preserve nation command timing and side effects.                           |
| Intent/turns               | `Executor` maps turn intents to gameplay actions                               | `src/core/execution/ExecutionManager.ts`, command tests                                                     | Preserve user command behavior through system command surface.             |
| Worker updates             | `GameRunner` emits updates, packed tiles, motion plans, name data              | `tests/core/game/GameImpl.test.ts`, `tests/GameUpdateUtils.test.ts`                                         | Preserve client-observable wire payloads and merge semantics.              |

## Initial W1 Fixture Set

W1 should implement a small subset that proves the harness is useful without
trying to cover the whole migration:

- `parity_legacy_economy_fixture`: spawned player with owned tile, troops,
  resource/troop growth, and player update payloads.
- `parity_legacy_attack_fixture`: adjacent players, active attack startup,
  ticked battle, defender troop loss, tile updates, and attack stats.
- `parity_legacy_counterattack_fixture`: opposing attacks cancel or reduce
  each other.
- `parity_legacy_conquest_fixture`: strong attacker conquers weak defender and
  emits conquest/resource/stat changes.
- `parity_legacy_unit_fixture`: constructed city or defense post appears in
  unit snapshots and survives stable parity comparison.
- `parity_legacy_update_payload_fixture`: captures `GameUpdates`,
  `packedTileUpdates`, and optional motion plans after a scripted tick.

## Notes

- Random-dependent scenarios should pin setup and step order before being used
  as strict parity checks.
- New systems work should add scenarios here before replacing a behavior family
  if that family is not already represented.
