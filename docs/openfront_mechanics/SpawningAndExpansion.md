# Spawning And Expansion

Canonical baseline: `main@782702c1d6c8614f2c44590584b0b34c1016020d`.

Spawning creates the first owned tiles for a player. Expansion into unowned land is modeled as attacking `TerraNullius`, not as a separate non-combat growth mechanic.

## Spawn Phase Duration

`Config.numSpawnPhaseTurns()` starts at `Config.ts:621`.

| Game setup | Spawn phase turns |
| --- | ---: |
| Singleplayer | 100 ticks |
| Random spawn enabled | 150 ticks |
| Default multiplayer | 300 ticks |

`SpawnTimerExecution` ends spawn phase when game ticks exceed this value.

## Spawn Execution Flow

`SpawnExecution` starts at `SpawnExecution.ts:20`.

1. The execution is seeded from player id plus game id (`SpawnExecution.ts:31`) so random spawn selection is deterministic for the same inputs.
2. On tick, it marks itself inactive (`SpawnExecution.ts:40`).
3. It retrieves an existing player or adds the player if not present (`SpawnExecution.ts:43`).
4. If random spawn is enabled and the player already spawned, it returns to prevent rerolling (`SpawnExecution.ts:50`).
5. It relinquishes current tiles before respawn/replacement (`SpawnExecution.ts:55`).
6. It computes a spawn from the requested tile or random/team area (`SpawnExecution.ts:56`).
7. It conquers each spawn tile for the player (`SpawnExecution.ts:63`).
8. On first spawn, it adds a `PlayerExecution`; bots also get `TribeExecution` (`SpawnExecution.ts:67`).
9. It records the spawn center on the player (`SpawnExecution.ts:74`).
10. In singleplayer, a human spawn immediately ends spawn phase (`SpawnExecution.ts:76`).

## Explicit Spawn Tile

When a spawn tile is provided, `getSpawn()` asks `getSpawnTiles(mg, center, false)` for the spawn tiles (`SpawnExecution.ts:94`). If no tiles are returned, spawning fails for that request.

## Random Or Team-Area Spawn

When no center is provided:

- A team spawn area is selected if available (`SpawnExecution.ts:105`).
- The code tries up to 1,000 random centers (`SpawnExecution.ts:24`, `SpawnExecution.ts:108`).
- Candidate centers must be land, unowned, and not border tiles (`SpawnExecution.ts:113`).
- Candidate centers must be at least `config().minDistanceBetweenPlayers()` away from other spawned players (`SpawnExecution.ts:121`).
- Spawn tiles must all be valid for `getSpawnTiles(mg, center, true)` (`SpawnExecution.ts:141`).

## Expansion Into Wilderness

After spawn, unowned land belongs to `TerraNullius`. Attacking it uses the wilderness branch of `Config.attackLogic()`:

- Defender troop loss is always 0 for `TerraNullius` (`Config.ts:752`).
- Attacker loss is `mag / 10` for bots and `mag / 5` for non-bots (`Config.ts:749`).
- Tiles-per-tick used is `within((2000 * max(10, speed)) / attackTroops, 5, 100)` (`Config.ts:753`).

The base `mag` and `speed` come from terrain type: plains `80` and `16.5`, highland `100` and `20`, mountain `120` and `25` (`Config.ts:653`).

## Evidence Tests

- `tests/core/execution/SpawnExecution.test.ts` covers random placement, minimum-distance behavior, crowded-map failure, and respawn behavior.
- `tests/TerritoryCapture.test.ts` verifies a spawned player owns the spawn tile.
