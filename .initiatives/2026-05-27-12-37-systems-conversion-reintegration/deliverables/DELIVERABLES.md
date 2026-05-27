# Deliverables

## D1: Parity Harness And Baseline Scenarios

**Outcome**: A reusable test harness can run deterministic scenarios, snapshot
canonical state, compare legacy and systems paths, and make behavior drift
visible before migration begins.
**Demo**:
`npx vitest run tests/core/systems tests/core/game tests/Attack.test.ts`
**Acceptance Checks**:

- [x] Snapshots cover players, resources, troops, attacks, units, tile
      ownership, packed tile updates, game hash, and relevant emitted updates.
- [x] Baseline scenarios exist for economy, attacks, conquest, units, boats,
      nukes/SAMs, AI/nations, and worker-facing update payloads.
- [x] Parity failures produce actionable diffs rather than only boolean
      mismatch output.

**Dependencies**: None.
**Notes**: This deliverable should not change game behavior.

## D2: Systems Scheduler And Compatibility Runtime

**Outcome**: A deterministic systems scheduler can run inside the canonical
tick loop while legacy `Execution` behavior remains available through an
adapter and existing public APIs keep working.
**Demo**:
`npx vitest run tests/core/game/GameImpl.test.ts tests/core/systems`
**Acceptance Checks**:

- [x] Systems have explicit phases and stable ordering.
- [x] `GameImpl.executeNextTick()` can host the scheduler without changing
      legacy tick order or update cadence.
- [x] `game.addExecution(...)` remains compatible while legacy executions are
      adapted into the scheduler.

**Dependencies**: D1.
**Notes**: The initial scheduler path should be behavior-preserving and mostly
structural.

## D3: Native Economy And Player Upkeep Systems

**Outcome**: Player economy and upkeep move from `PlayerExecution` into native
systems using existing stock-flow economy models, while preserving troop,
resource, relation, alliance, embargo, structure capture, and cluster cleanup
behavior.
**Demo**:
`npx vitest run tests/core/systems tests/core/executions/PlayerExecution.test.ts tests/core/configuration/ResourceCapacity.test.ts`
**Acceptance Checks**:

- [x] Economy deltas match current behavior through parity snapshots.
- [x] `Config.maxTroops`, `troopIncreaseRate`, `maxResources`, and
      `resourceIncreaseRate` remain compatibility wrappers.
- [x] Player update diffing remains stable, including optional stock-flow
      diagnostics.

**Dependencies**: D1, D2.
**Notes**: This is the reference migration pattern for later behavior families.

## D4: Attack, Battle, Territory, And Conquest Systems

**Outcome**: Attack startup, active battle ticking, defender losses, retreat,
frontier selection, tile conquest, dead-defender cleanup, stats, and conquest
events are owned by native systems with 1:1 parity against `AttackExecution`.
**Demo**:
`npx vitest run tests/Attack.test.ts tests/Disconnected.test.ts tests/AttackStats.test.ts tests/core/game/GameImpl.test.ts tests/core/systems/WarBattleSystem.test.ts`
**Acceptance Checks**:

- [x] Existing attack tests pass through the systems path.
- [x] Legacy and systems paths match for active attack state, troop movement,
      defender troop loss, tile ownership, conquest events, stats, and hashes.
- [x] Sandbox battle model remains aligned with canonical combat boundaries or
      is clearly scoped as non-canonical tuning support.

**Dependencies**: D1, D2, D3.
**Notes**: This is the highest-risk deliverable.

## D5: Unit, Projectile, Transport, And Infrastructure Systems

**Outcome**: Construction, structures, trains, ports, warships, transport
ships, trade ships, nukes, MIRVs, shells, SAMs, missile silos, and deletion or
upgrade behavior run through systems without changing current behavior.
**Demo**:
`npx vitest run tests/Warship.test.ts tests/MissileSilo.test.ts tests/nukes tests/core/executions tests/economy`
**Acceptance Checks**:

- [ ] Legacy execution-spawn chains have equivalent native system state and
      phase ownership.
- [ ] Unit updates, motion plans, projectile lifecycle, and cleanup behavior
      match baseline scenarios.
- [ ] Existing unit-focused tests pass without gameplay rebalance.

**Dependencies**: D1, D2, D4.
**Notes**: Migrate by behavior family, not by file count.

## D6: Intent, AI, Client Update, And Legacy Retirement

**Outcome**: User turns, AI/nation commands, worker/client updates, and final
validation run against the systems runtime, with legacy executions either
removed or retained only as explicit compatibility shims.
**Demo**:
`npx tsc --noEmit && npm run test && npm run build-prod`
**Acceptance Checks**:

- [ ] `Executor` and AI/nation behavior submit commands to system-native
      surfaces or compatibility shims with parity coverage.
- [ ] Worker-to-client updates, packed tile updates, player diffs, and game
      hashes remain stable in scripted scenarios.
- [ ] Legacy `Execution` usage is removed or documented as intentionally
      retained compatibility.

**Dependencies**: D1, D2, D3, D4, D5.
**Notes**: This deliverable is the final reintegration gate.
