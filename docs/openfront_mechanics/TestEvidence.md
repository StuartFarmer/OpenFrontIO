# Test Evidence

Canonical baseline: `main@782702c1d6c8614f2c44590584b0b34c1016020d`.

Tests are evidence for edge cases and intended behavior. They should not replace source-code references for default numeric constants, but they should be cited when behavior depends on ordering, side effects, or interactions.

## Evidence Index

| Mechanics family | Tests |
| --- | --- |
| Spawning and territory | `tests/core/execution/SpawnExecution.test.ts`, `tests/TerritoryCapture.test.ts`, `tests/MapConsistency.test.ts` |
| Combat and attack side effects | `tests/Attack.test.ts`, `tests/AttackStats.test.ts`, `tests/AiAttackBehavior.test.ts` |
| Alliances and diplomacy | `tests/AllianceRequestExecution.test.ts`, `tests/AllianceExtensionExecution.test.ts`, `tests/AllianceAcceptNukes.test.ts`, `tests/AllianceDonation.test.ts`, `tests/Donate.test.ts` |
| Teams | `tests/Team.test.ts`, `tests/TeamAssignment.test.ts` |
| Resources and trade | `tests/core/game/Resources.test.ts`, `tests/core/game/ResourceTrade.test.ts`, `tests/core/executions/TradeShipExecution.test.ts`, `tests/core/configuration/ResourceCapacity.test.ts` |
| Rail | `tests/core/executions/RailStationExecution.test.ts`, `tests/core/game/RailNetwork.test.ts`, `tests/core/game/TrainStation.test.ts`, `tests/core/pathfinding/PathFinding.Rail.test.ts` |
| Warships | `tests/Warship.test.ts`, `tests/WarshipMultiSelection.test.ts`, `tests/client/controllers/WarshipSelectionController.test.ts` |
| Nukes and SAMs | `tests/nukes/WaterNukes.test.ts`, `tests/core/executions/NukeExecution.test.ts`, `tests/core/executions/SAMLauncherExecution.test.ts`, `tests/NationNukeSamOverwhelm.test.ts` |
| Nation AI | `tests/NationCreation.test.ts`, `tests/NationAllianceBehavior.test.ts`, `tests/NationMIRV.test.ts`, `tests/NationStructureBehavior.test.ts`, `tests/NationCounterWarshipInfestation.test.ts` |

## Caveat

Some tests override config methods, map fixtures, unit health, ranges, or cooldowns. When using tests as evidence, distinguish the behavior being validated from test-only parameter values.
