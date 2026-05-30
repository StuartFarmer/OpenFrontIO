# Structures And Units

Canonical baseline: `main@782702c1d6c8614f2c44590584b0b34c1016020d`.

Unit definitions live in `Game.ts`, but canonical costs and construction timings come from `Config.unitInfo()`.

## Unit Cost And Build Metadata

`Config.unitInfo()` starts at `Config.ts:290`.

| Unit | Cost or rule | Duration | Other metadata |
| --- | --- | ---: | --- |
| Transport | 0 | none | mobile troop carrier. |
| Warship | `min(1,000,000, (owned + 1) * 250,000)` | none | max health 1000. |
| Shell | 0 | none | damage 250. |
| SAM missile | 0 | none | interceptor unit. |
| Port | `min(1,000,000, 2^owned * 125,000)`, sharing count with rail stations | 50 ticks | upgradable. |
| Atom bomb | 750,000 | none | nuke. |
| Hydrogen bomb | 5,000,000 | none | nuke. |
| MIRV | 25,000,000 + launched MIRVs * 15,000,000 | none | human infinite-gold override can make it free. |
| MIRV warhead | 0 | none | spawned by MIRV. |
| Trade ship | 0 | none | spawned by ports. |
| Missile silo | 1,000,000 | 100 ticks | upgradable. |
| Defense post | `min(250,000, (owned + 1) * 50,000)` | 50 ticks | defensive combat and shell behavior. |
| SAM launcher | `min(3,000,000, (owned + 1) * 1,500,000)` | `SAM_CONSTRUCTION_TICKS` | upgradable. |
| City | `min(1,000,000, 2^owned * 125,000)` | 20 ticks | upgradable, increases troop capacity. |
| Factory | `min(1,000,000, 2^owned * 125,000)` | 20 ticks | upgradable. |
| Rail station | `min(1,000,000, 2^owned * 125,000)`, sharing count with ports | 20 ticks | upgradable. |
| Silo | `min(1,000,000, 2^owned * 125,000)` | 20 ticks | upgradable, increases resource capacity. |
| Train | 0 | none | rail unit. |

Sources: `Config.ts:298` through `Config.ts:445`.

## Construction And Effects

Structure-specific execution classes own effects after build completion:

- `CityExecution` handles city effects.
- `DefensePostExecution` handles defense-post shell behavior.
- `MissileSiloExecution` handles silo nuke launch slots.
- `PortExecution` handles trade ship spawning and rail station integration.
- `RailStationExecution` creates rail network nodes.
- `SAMLauncherExecution` intercepts targetable nukes.
- `UpgradeStructureExecution` applies level upgrades.

Build legality and resource removal are owned by `PlayerImpl.buildUnit()` and `PlayerImpl.canBuild()`.

## Resource Cost Split

`Config.unitResourceCost()` maps gold cost into resource cost. Ports, rail stations, and silos bias materials; cities bias food; factories bias energy. The exact split code lives in `Config.ts:532` and `splitResourceCost()`.

## Evidence Tests

- `tests/FindAndUpgradeNearestBuilding.test.ts`
- `tests/AutoUpgrade.test.ts`
- `tests/core/executions/RailStationExecution.test.ts`
- `tests/core/configuration/ResourceCapacity.test.ts`
