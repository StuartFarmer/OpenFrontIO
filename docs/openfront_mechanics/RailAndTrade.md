# Rail And Trade

Canonical baseline: `main@782702c1d6c8614f2c44590584b0b34c1016020d`.

Rail and sea trade move resources between players and create bonus gold/resource events. The shared exchange primitive is documented in the economy chapter.

## Ports And Trade Ships

`PortExecution` creates a station for the port when needed (`PortExecution.ts:43`). It then probabilistically spawns trade ships if `shouldSpawnTradeShip()` succeeds (`PortExecution.ts:47`).

Trade ship spawn chance depends on:

- total active trade ships
- consecutive spawn rejections
- port level, because the spawn chance loop runs once per level (`PortExecution.ts:71`)

If another trading port is available, `PortExecution` adds `TradeShipExecution` from this port to a selected port (`PortExecution.ts:57`).

## Trade Ship Completion

`TradeShipExecution.complete()` starts at `TradeShipExecution.ts:174`.

- It deletes the trade ship.
- It computes gold from traveled tiles through `Config.tradeShipGold()` (`TradeShipExecution.ts:177`).
- If the ship was captured, resources transfer from original owner to captor through `calculateTradeManifest()` (`TradeShipExecution.ts:183`).
- Otherwise, it computes a two-way resource exchange with `calculateTradeExchange()` (`TradeShipExecution.ts:217`).

While moving, a trade ship updates safe-from-pirates status when on water shoreline tiles (`TradeShipExecution.ts:154`).

## Rail Network And Trains

Rail stations and nearby cities/ports become train stations. `RailStationExecution` creates train station executions for nearby eligible structures. `RailNetworkImpl` owns the rail graph, station connections, snapping to existing rails, ghost rail paths, and rail pathfinding.

Train behavior is split:

- `TrainStationExecution` decides whether to spawn trains.
- `TrainExecution` creates engine, tail engine, and carriage units and moves them between train stations.
- `TrainStation` applies stop handlers; city/port stations trade resources while connector stations connect routes.

## Evidence Tests

- `tests/core/executions/TradeShipExecution.test.ts`
- `tests/core/executions/RailStationExecution.test.ts`
- `tests/core/game/RailNetwork.test.ts`
- `tests/core/game/TrainStation.test.ts`
- `tests/core/pathfinding/PathFinding.Rail.test.ts`
