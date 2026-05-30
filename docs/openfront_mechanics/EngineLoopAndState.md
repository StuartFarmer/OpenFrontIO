# Engine Loop And State

Canonical baseline: `main@782702c1d6c8614f2c44590584b0b34c1016020d`.

The simulation is a ticked state machine. Player commands, AI decisions, construction, attacks, nukes, trade, ships, and win checks all run through `Execution` objects.

## Execution Interface

`Execution` is declared at `Game.ts:521`:

- `isActive()` keeps or removes the execution.
- `activeDuringSpawnPhase()` decides whether it can run before spawn phase ends.
- `init(mg, ticks)` receives the game reference and current tick.
- `tick(ticks)` mutates game state for that tick.

This interface is the core mechanical extension point.

## Per-Tick Order

`GameImpl.executeNextTick()` starts at `GameImpl.ts:433`.

The order is:

1. Reset the update map and tile update pair buffer (`GameImpl.ts:434`).
2. Tick already-initialized active executions if spawn-phase rules allow it (`GameImpl.ts:436`).
3. Initialize uninitialized executions if spawn-phase rules allow it (`GameImpl.ts:446`).
4. Remove inactive executions (`GameImpl.ts:455`).
5. Move newly initialized executions into the active list (`GameImpl.ts:457`).
6. Emit player diffs through `player.toUpdate()` for every player (`GameImpl.ts:459`).
7. Emit a hash update every 10 ticks (`GameImpl.ts:463`).
8. Tick the water manager and record changed water tiles (`GameImpl.ts:470`).
9. Increment the tick counter and return accumulated updates (`GameImpl.ts:475`).

This order matters. For example, a newly added execution is initialized after active executions have ticked, and it joins the active list for later ticks.

## Game State Owners

`GameImpl` owns global state:

- players and player lookup
- map state and tile ownership
- active and uninitialized executions
- alliances and alliance requests
- unit grid and rail network
- updates and tile updates
- winner state

`PlayerImpl` owns per-player mutable state:

- gold and resources
- troops
- food allocation and nutrition health
- owned tiles and border tiles
- units
- incoming/outgoing attacks
- alliances, requests, embargoes, relations, targets, emojis, and traitor state
- spawn tile and disconnected state

## State Mutation Paths

Important mutation paths for the guide:

- Tile conquest: `GameImpl.conquer()` is called by `PlayerImpl.conquer()`.
- Player conquest: `GameImpl.conquerPlayer()` transfers captured gold/resources and finalizes defeat.
- Unit construction: `PlayerImpl.buildUnit()` validates build state, removes costs and troops, and creates a `UnitImpl`.
- Player updates: `PlayerImpl.toUpdate()` emits diffs after each tick.

## Implementation Guidance

To recreate equivalent behavior, preserve order of operations before tuning formulas. Running the same formulas in a different tick phase can change attack outcomes, nuke interception, water conversion, player updates, and win timing.
