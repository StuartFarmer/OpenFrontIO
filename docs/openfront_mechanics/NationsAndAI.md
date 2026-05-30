# Nations And AI

Canonical baseline: `main@782702c1d6c8614f2c44590584b0b34c1016020d`.

Nations are `PlayerType.Nation` players with difficulty-scaled stats and a full behavior loop. They are not equivalent to generic bots.

## Creation

Nation creation uses map manifest nation entries from `TerrainMapLoader` plus `NationCreation`. If a game requests more nations than the manifest defines, `additionalNations` and procedural fallback names are used.

Compact maps scale nation coordinates in `TerrainMapLoader.ts:70`, so nation spawn coordinates differ by map size.

## Nation Tick Loop

`NationExecution` composes behavior modules and calls them in sequence:

1. casual emoji (`NationExecution.ts:194`)
2. relation updates from embargoes (`NationExecution.ts:195`)
3. alliance request handling (`NationExecution.ts:196`)
4. alliance extension handling (`NationExecution.ts:197`)
5. MIRV consideration (`NationExecution.ts:198`)
6. structure handling (`NationExecution.ts:199`)
7. warship spawning (`NationExecution.ts:200`)
8. hostile-nation embargo handling (`NationExecution.ts:201`)
9. attack behavior (`NationExecution.ts:202`)
10. warship infestation counterplay (`NationExecution.ts:203`)
11. nuke behavior (`NationExecution.ts:204`)

The behavior modules are constructed in `initializeBehaviors()` (`NationExecution.ts:207`): emoji, MIRV, alliance, warship, attack, nuke, and structure behavior.

## Difficulty Effects

Difficulty affects:

- starting manpower in `Config.startManpower()`
- max troop/resource capacity multipliers
- troop growth multipliers
- attack behavior thresholds and reserve ratios
- nation structure behavior
- nuke targeting sophistication and SAM-aware behavior

Hard and Impossible use more aggressive and more strategic behavior than Easy and Medium.

## Nuke And MIRV Behavior

`NationNukeBehavior` chooses targets based on difficulty, team/FFA context, strongest players, structure density, ally targets, SAM coverage, and MIRV saving logic. On Impossible, if no good nuke target is available, it can attempt SAM overwhelm with atom bombs. The documented rule is N+1 bombs for a SAM of level N, adjusted by all covering SAMs (`NationNukeBehavior.ts:775`).

`NationMIRVBehavior` covers retaliation, victory denial, steamroll prevention, and team victory denial.

## Structure Behavior

`NationStructureBehavior` handles pressure-based construction for capacity and production, rail station reachability, city ratios, defense posts near fronts, and normal structure building.

## Evidence Tests

- `tests/NationCreation.test.ts`
- `tests/NationAllianceBehavior.test.ts`
- `tests/NationMIRV.test.ts`
- `tests/NationStructureBehavior.test.ts`
- `tests/NationNukeSamOverwhelm.test.ts`
- `tests/NationCounterWarshipInfestation.test.ts`
