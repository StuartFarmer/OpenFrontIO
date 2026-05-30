# Win Conditions

Canonical baseline: `main@782702c1d6c8614f2c44590584b0b34c1016020d`.

Win checking is periodic and runs outside spawn phase.

## Win Execution

`WinCheckExecution` starts at `WinCheckExecution.ts:17`.

- It checks every 10 ticks (`WinCheckExecution.ts:32`).
- It dispatches to FFA or team win logic based on `gameMode` (`WinCheckExecution.ts:38`).
- It is inactive during spawn phase (`WinCheckExecution.ts:123`).
- It has a hard time limit of 170 minutes, or 10 minutes before a 3-hour hard kill (`WinCheckExecution.ts:22`).

## Tile Percentage Threshold

`Config.percentageTilesOwnedToWin()` returns:

- 80 percent for FFA.
- 95 percent for team games.

The FFA and team checks compare against land tiles without fallout:

```text
numTilesWithoutFallout = numLandTiles - numTilesWithFallout
percentage = ownedTiles / numTilesWithoutFallout * 100
```

FFA source: `WinCheckExecution.ts:68`. Team source: `WinCheckExecution.ts:103`.

## FFA Winner

For FFA, players are sorted by tiles owned (`WinCheckExecution.ts:47`). The leader wins if any of these are true:

- Leader percentage exceeds `percentageTilesOwnedToWin()` (`WinCheckExecution.ts:70`).
- `maxTimerValue` is set and elapsed time reaches it (`WinCheckExecution.ts:73`).
- The hard time limit is reached (`WinCheckExecution.ts:75`).

Ranked 1v1 has an additional shortcut: if exactly one non-disconnected human remains, that human wins (`WinCheckExecution.ts:54`).

## Team Winner

Team mode sums tiles by team (`WinCheckExecution.ts:85`). The top team wins under the same threshold, configured timer, or hard limit (`WinCheckExecution.ts:106`). The bot team cannot win through this team branch (`WinCheckExecution.ts:112`).

## Winner State

When a condition is met, the execution calls `mg.setWinner(winner, mg.stats().stats())` (`WinCheckExecution.ts:77`, `WinCheckExecution.ts:113`) and marks itself inactive.

`GameImpl.setWinner()` owns winner state and emits the winner update.
