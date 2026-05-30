# Nukes And SAMs

Canonical baseline: `main@782702c1d6c8614f2c44590584b0b34c1016020d`.

Nuke mechanics combine build costs, trajectory, SAM targetability, blast area, tile mutation, troop deaths, structure deletion, and diplomacy side effects.

## Nuke Unit Metadata

From `Config.unitInfo()`:

- Atom bomb costs 750,000 (`Config.ts:335`).
- Hydrogen bomb costs 5,000,000 (`Config.ts:340`).
- MIRV costs 25,000,000 plus 15,000,000 per prior MIRV launched (`Config.ts:345`).
- MIRV warheads cost 0 (`Config.ts:358`).
- Missile silos cost 1,000,000 and take 100 ticks to construct (`Config.ts:368`).
- SAM launchers scale up to 3,000,000 and use `SAM_CONSTRUCTION_TICKS` (`Config.ts:384`).

Nuke radii, speed, targetable range, SAM range, and nuke death formulas are defined in `Config` and expanded in the core guide.

## Blast Tiles

`NukeExecution.tilesToDestroy()` uses `Config.nukeMagnitudes()` (`NukeExecution.ts:62`).

If water nukes are enabled, it creates a smoothed irregular boundary between inner and outer radius using 16 angular samples (`NukeExecution.ts:67`). Otherwise it uses BFS around the target and includes all inner-radius tiles plus a random outer ring (`NukeExecution.ts:114`).

## Alliance Effects

`maybeBreakAlliances()` starts at `NukeExecution.ts:127`. MIRV warheads do not break alliances (`NukeExecution.ts:131`). Other nuke types compute affected allied players using weighted blast counts and a threshold (`NukeExecution.ts:136`), reject relevant pending requests (`NukeExecution.ts:145`), break alliances (`NukeExecution.ts:168`), and update attacked-player relation by -100 (`NukeExecution.ts:172`).

## Launch And Trajectory

On first tick, `NukeExecution` checks `player.canBuild()`, builds the nuke unit, assigns target tile, and stores trajectory (`NukeExecution.ts:178`). SAM launchers scan trajectory tiles that are marked targetable and inside SAM range (`SAMLauncherExecution.ts:86`). They account for both nuke arrival and missile travel time before selecting an intercept tile (`SAMLauncherExecution.ts:96`).

## Blast Application

When a nuke resolves:

- Owned impacted tiles are relinquished and counted per player (`NukeExecution.ts:311`).
- Land tiles are queued for water conversion (`NukeExecution.ts:318`) when water conversion applies.
- Troops, outgoing attack troops, and transport-ship troops take repeated `nukeDeathFactor()` losses per impacted tile (`NukeExecution.ts:324`).
- Non-nuke, non-SAM-missile units inside the outer radius are deleted (`NukeExecution.ts:368`).
- The nuke is marked reached, deleted, and stats are recorded (`NukeExecution.ts:384`).

## Nation SAM Overwhelm

On Impossible difficulty, nation AI can try to destroy enemy SAMs by overwhelming interception capacity. `NationNukeBehavior` documents the rule: a SAM of level N can intercept N nukes, so the nation needs N+1 bombs across all covering SAMs (`NationNukeBehavior.ts:775`). It sorts SAMs by level, sums covering SAM levels, accounts for silo slots and flight times, and adds extra bombs for long flights (`NationNukeBehavior.ts:804`).

## Evidence Tests

- `tests/nukes/WaterNukes.test.ts`
- `tests/core/executions/NukeExecution.test.ts`
- `tests/core/executions/SAMLauncherExecution.test.ts`
- `tests/AllianceAcceptNukes.test.ts`
- `tests/NationNukeSamOverwhelm.test.ts`
