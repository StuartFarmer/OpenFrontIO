# Core Data Model

Canonical baseline: `main@782702c1d6c8614f2c44590584b0b34c1016020d`.

OpenFront's canonical model is centered in `src/core/game/Game.ts`. The most important implementation detail is that the code treats the game as a grid of tile refs plus mutable players, units, attacks, and executions. Player-facing names such as "Warship" or "Mountain" are also code-level enum values.

## Game-Level Types

| Concept | Canonical source | Values or shape |
| --- | --- | --- |
| Difficulty | `Game.ts:59` | `Easy`, `Medium`, `Hard`, `Impossible`. Used by nation manpower, capacity, growth, and AI behavior. |
| Team | `Game.ts:68` | String team id. Predefined colored/team buckets include `Red`, `Blue`, `Teal`, `Purple`, `Yellow`, `Orange`, `Green`, `Bot`, `Humans`, `Nations` at `Game.ts:84`. |
| Team spawn area | `Game.ts:70` | Rectangle with `x`, `y`, `width`, and `height`. |
| Game type | `Game.ts:275` | `Singleplayer`, `Public`, `Private`. |
| Game mode | `Game.ts:283` | `Free For All` or `Team`. |
| Map size | `Game.ts:295` | `Compact` or `Normal`. |
| Public modifiers | `Game.ts:300` | Optional compact, random spawn, crowded, hard nations, starting gold, gold multiplier, disabled alliances/ports/nukes/SAMs, peace time, and water nukes. |

`GameMapType` begins at `Game.ts:97` and enumerates the built-in map names. `mapCategories` is defined at `Game.ts:182` and groups maps into continental, regional, and fantasy buckets.

## Units

`UnitInfo` at `Game.ts:315` is the public shape for unit metadata: a cost function, optional max health, optional damage, optional construction duration, and optional upgrade flag. Actual values are provided by `Config.unitInfo()`.

| Unit type | Source | Notes |
| --- | --- | --- |
| `Transport` | `Game.ts:333` | Mobile troop transport and boat attack carrier. |
| `Warship` | `Game.ts:334` | Mobile naval combat unit with health and patrol state. |
| `Shell` | `Game.ts:335` | Projectile-like unit created by warships and defense posts. |
| `SAMMissile` | `Game.ts:336` | Interceptor launched by SAM launchers. |
| `Port` | `Game.ts:337` | Coastal structure for trade ships, warship support, and train-station integration. |
| `Atom Bomb`, `Hydrogen Bomb`, `MIRV`, `MIRV Warhead` | `Game.ts:338`, `Game.ts:339`, `Game.ts:345`, `Game.ts:346` | Nuke family. `Nukes` group is declared at `Game.ts:359`. |
| `Trade Ship` | `Game.ts:340` | Autonomous sea trade unit. |
| `Missile Silo`, `SAM Launcher`, `Silo` | `Game.ts:341`, `Game.ts:343`, `Game.ts:349` | Nuke/SAM/resource-capacity structures. |
| `Defense Post` | `Game.ts:342` | Defensive structure that affects combat and fires shells. |
| `City`, `Factory`, `Rail Station` | `Game.ts:344`, `Game.ts:350`, `Game.ts:348` | Core economy, resource, and rail structures. |
| `Train` | `Game.ts:347` | Rail trade unit with `Engine`, `TailEngine`, and `Carriage` train types at `Game.ts:353`. |

Build groups matter:

- `BuildableAttacks` contains atom bomb, hydrogen bomb, MIRV, and warship at `Game.ts:366`.
- `Structures` contains city, defense post, SAM launcher, missile silo, port, rail station, silo, and factory at `Game.ts:373`.
- `BuildMenus` combines structures and buildable attacks at `Game.ts:384`.
- `PlayerBuildable` adds transport ship to the build menu set at `Game.ts:389`.

## Unit Params

`UnitParamsMap` starts at `Game.ts:404`. These params define per-unit state at construction:

- Transport ships can carry `troops` and a `targetTile`.
- Warships require a `patrolTile`.
- Nukes carry a target tile and trajectory, while MIRV/MIRV warheads carry a target tile.
- Trade ships hold a target unit and optional safe-from-pirates timestamp.
- Trains hold a train type, optional target unit, and loaded flag.
- Most structures have no extra params.

## Relations, Terrain, And Player Kinds

`Relation` at `Game.ts:469` maps numeric relation buckets to `Hostile`, `Distrustful`, `Neutral`, and `Friendly`.

`TerrainType` at `Game.ts:507` has `Plains`, `Highland`, `Mountain`, `Lake`, and `Ocean`. Only plains, highland, and mountain are supported by land combat formulas in `Config.attackLogic()`.

`PlayerType` at `Game.ts:515` distinguishes:

- `BOT`: simpler AI/non-human player, lower troop and resource caps.
- `HUMAN`: player-controlled entity.
- `NATION`: map/nation AI with difficulty-scaled stats and behavior modules.

## Execution Contract

The simulation advances through `Execution` objects. The interface at `Game.ts:521` requires:

- `isActive()`: whether the execution remains in the active list.
- `activeDuringSpawnPhase()`: whether it can run before spawn phase ends.
- `init(mg, ticks)`: one-time initialization with the game.
- `tick(ticks)`: per-tick behavior.

This contract is the bridge between player commands, AI decisions, units, projectiles, construction, and win checks.
