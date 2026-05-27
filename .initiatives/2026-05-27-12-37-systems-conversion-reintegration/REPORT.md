# Analysis Report: Systems Conversion And 1:1 Reintegration

## Executive Summary

- Highest impact: the canonical runtime is still the `Execution` scheduler, not
  `src/core/systems`; a full conversion must first define a system scheduler
  that can preserve the exact tick order and mutation semantics of
  `GameImpl.executeNextTick()`.
- Second highest impact: attacks are the hardest migration surface because
  `AttackExecution` mixes command validation, active attack state, border
  frontier selection, combat formulas, troop mutation, tile conquest, retreat,
  alliance cancellation, and conquest cleanup.
- Third highest impact: the economy migration is already partly successful and
  should be treated as the proof pattern: system model behind compatibility
  wrappers, then runtime integration, then diagnostics.
- Fourth highest impact: 1:1 reintegration needs a dedicated parity harness.
  Existing tests are broad, but many assert through legacy `Execution` classes
  rather than proving old and new engines produce the same state.

## Findings

### 1. The Original Runtime System Is `Execution`, Not Stock-Flow

- Evidence:
  - `src/core/game/Game.ts` defines `Execution` as the active runtime contract:
    `isActive()`, `activeDuringSpawnPhase()`, `init(...)`, and `tick(...)`.
  - `src/core/game/GameImpl.ts` owns the canonical tick loop in
    `executeNextTick()`: it ticks active executions, initializes queued
    executions, removes inactive executions, emits player updates, ticks water,
    then increments `_ticks`.
  - `src/core/GameRunner.ts` translates turns into executions through
    `Executor.createExecs(...)` and injects them into `game.addExecution(...)`.
  - `rg` shows 42 classes implementing `Execution` under `src/core/execution`.
- Impact:
  - A systems conversion cannot just extend `src/core/systems`; it must replace
    or adapt the scheduler contract that currently defines game behavior.
- Recommendation:
  - Treat `Execution` as the legacy system model. Introduce a system scheduler
    with explicit phases that initially preserves `Execution` ordering and can
    host adapted legacy behavior before native systems take over.
- Risk:
  - If tick ordering changes, regressions will appear as desyncs, changed game
    hashes, altered AI timing, changed update payloads, and broken tests.

### 2. The Current Systems Layer Is Real, But Too Narrow For Full Simulation

- Evidence:
  - `src/core/systems/StockFlowSystem.ts` defines stocks, parameters,
    auxiliaries, outputs, flows, and model composition.
  - `src/core/systems/StockFlowRuntime.ts` evaluates one stock-flow step and
    returns stock/output/flow diagnostics.
  - `src/core/systems/models` covers population, food, resource production,
    war summary, agriculture, player economy, and sandbox battle simulation.
  - `src/core/configuration/Config.ts` already delegates `maxTroops`,
    `maxResources`, `playerEconomyTick`, `troopIncreaseRate`, and
    `resourceIncreaseRate` through `PlayerEconomyAdapter`.
- Impact:
  - The systems layer has the right deterministic modeling shape for economy,
    but it does not model commands, active entities, territory, pathing,
    projectiles, unit lifecycle, AI, or update emission.
- Recommendation:
  - Keep stock-flow as a sub-runtime for continuous stock mechanics, while the
    larger game system scheduler handles discrete commands, entity iteration,
    map mutation, unit behavior, and update production.
- Risk:
  - Forcing all behavior into stock-flow would make attacks, units, pathing, and
    AI awkward and could obscure direct behavioral parity.

### 3. Attack And Battle Behavior Are The Highest-Risk Reintegration Surface

- Evidence:
  - `src/core/execution/AttackExecution.ts` validates target existence,
    friendly/alliance restrictions, embargo side effects, attack amount,
    troop removal, `AttackImpl` creation, opposing attack cancellation, outgoing
    attack merging, relation updates, frontier maintenance, retreat, tile
    conquest, defender troop loss, dead-defender cleanup, and stats.
  - `src/core/configuration/Config.ts` owns `attackLogic(...)` and
    `attackTilesPerTick(...)`, including terrain, defense posts, fallout,
    disconnected teammate behavior, bot modifiers, large-player modifiers, and
    traitor modifiers.
  - `src/core/systems/models/WarBattleSystem.ts` is currently a pure sandbox
    model with attacker/defender stocks, supply, devastation, resource capture,
    and conquest; it does not operate on real map frontiers or `AttackImpl`.
  - Tests directly exercise `AttackExecution` across `tests/Attack.test.ts`,
    `tests/Disconnected.test.ts`, `tests/AttackStats.test.ts`, and
    `tests/core/game/GameImpl.test.ts`.
- Impact:
  - Replacing attack behavior without exact scenario parity is the most likely
    way to change gameplay feel and desync canonical simulations.
- Recommendation:
  - Reintegrate battle in layers: first preserve `AttackExecution` semantics
    behind a system adapter, then extract frontier selection, battle formulas,
    troop mutation, territory capture, retreat, and conquest into native
    systems only after parity fixtures exist.
- Risk:
  - The sandbox battle model is useful for tuning, but it is not currently a
    drop-in replacement for live attacks. Treating it as canonical too early
    would change map-level combat behavior.

### 4. Player Economy Shows The Correct Migration Pattern

- Evidence:
  - `src/core/execution/PlayerExecution.ts` now calls
    `config.playerEconomyTick(...)`, applies `troopDelta`, applies
    `resourceDelta`, and records work stats.
  - `src/core/systems/PlayerEconomyAdapter.ts` reads current `Player` and
    `Game` state, converts it into system inputs, and returns compatibility
    outputs.
  - `tests/core/systems/PlayerEconomyAdapter.test.ts`,
    `tests/core/systems/PlayerEconomyModel.test.ts`,
    `tests/core/systems/PopulationSystem.test.ts`, and
    `tests/core/systems/ResourceProductionSystem.test.ts` validate the model
    and adapter layers.
  - `tests/core/systems/PlayerEconomyRegression.test.ts` checks deterministic
    economy outputs across equivalent game setup.
- Impact:
  - This is the safest template for the rest of the conversion: keep the old
    gameplay API, move formulas behind systems, validate parity, then shrink
    legacy execution code.
- Recommendation:
  - Use economy as the reference architecture for each migration area:
    adapter, pure model, system integration, compatibility wrapper, regression
    tests, then legacy removal.
- Risk:
  - Economy still mutates through `PlayerExecution`, so even this migrated area
    is not fully owned by a system scheduler yet.

### 5. Game State Mutation Is Spread Across Domain Objects

- Evidence:
  - `src/core/game/PlayerImpl.ts` owns troops, resources, gold, attacks,
    alliances, relations, units, territory, and player update snapshots.
  - `src/core/game/GameImpl.ts` owns queued executions, updates, tile update
    packing, water ticking, ownership queries, conquest event logic, rail
    network access, stats, and hash emission.
  - `src/core/game/UnitImpl.ts` owns unit state and update serialization.
  - `src/core/game/AttackImpl.ts` owns active attack state, retreat flags,
    border size, and clustered border positions.
- Impact:
  - Native systems need a clear state access pattern. Without one, systems will
    become another layer that directly mutates the same objects in ad hoc ways.
- Recommendation:
  - Define a system context that exposes controlled state services for players,
    attacks, units, tiles, updates, stats, random, and config. Keep the
    underlying objects initially, but make write paths explicit and traceable.
- Risk:
  - A premature state rewrite would be larger than the systems conversion
    itself. The compatibility layer should wrap existing state first.

### 6. Unit, Projectile, Transport, And Infrastructure Executions Are Broad

- Evidence:
  - `src/core/execution` contains active behavior for construction, cities,
    ports, trains, train stations, rail stations, warships, transport ships,
    trade ships, nukes, MIRVs, shells, SAM launchers, SAM missiles, missile
    silos, defense posts, deletes, upgrades, and movement.
  - Many executions enqueue other executions, such as construction creating
    structure-specific executions, ports creating train station behavior, and
    transport ships creating attacks on landing.
  - Tests instantiate these classes directly across `tests/Warship.test.ts`,
    `tests/MissileSilo.test.ts`, `tests/nukes`, `tests/core/executions`, and
    economy/construction tests.
- Impact:
  - These behaviors need phase ownership, but their current nested execution
    spawning makes direct replacement risky.
- Recommendation:
  - Group migration by behavior family: command-only actions, passive player
    upkeep, attack/territory, construction/infrastructure, mobile units,
    projectiles/nukes/SAMs, then AI/nations. Each family needs legacy parity
    before native systems replace execution spawning.
- Risk:
  - If execution spawning is removed before equivalent system state exists,
    latent behavior such as reload timers, construction completion, train
    station ticks, and projectile cleanup can disappear.

### 7. AI And Nation Behavior Depend On Execution As A Command Bus

- Evidence:
  - `src/core/execution/NationExecution.ts`, `TribeExecution.ts`, and
    `src/core/execution/utils/AiAttackBehavior.ts` call `game.addExecution(...)`
    to trigger attacks, builds, nukes, warship behavior, emoji behavior,
    alliance behavior, and other actions.
  - Nation sub-behaviors under `src/core/execution/nation` depend on current
    `Game`, `Player`, `Config`, and execution classes.
  - `AiAttackBehavior` imports `AttackExecution` directly and creates new
    attack executions for decisions.
- Impact:
  - AI will not automatically migrate when the tick loop changes. It needs an
    equivalent command submission surface that can target either legacy
    execution adapters or native systems.
- Recommendation:
  - Preserve `game.addExecution(...)` as a compatibility command bus while
    adding system-native command submission. Migrate AI callers after core
    systems can execute the same commands.
- Risk:
  - AI timing changes can create large emergent behavior differences even if
    individual mechanics remain correct.

### 8. Existing Tests Are Broad But Not Yet A Full 1:1 Parity Harness

- Evidence:
  - `package.json` defines `npm run test`, `npm run test:coverage`,
    `npm run build-prod`, `npm run lint`, and `npm run perf`.
  - CI runs `npm run build-prod`, `npm run test:coverage`, ESLint, Prettier,
    and generated map validation.
  - Current tests cover attack, player execution, game impl, systems, sandbox,
    nukes, warships, pathfinding, resource economy, update diffing, and server
    behavior.
  - Many tests assert legacy classes directly, such as `new AttackExecution`,
    `new PlayerExecution`, `new WarshipExecution`, and `game.addExecution`.
- Impact:
  - The test corpus is valuable, but a systems migration also needs old-engine
    versus new-engine comparisons over identical scenarios.
- Recommendation:
  - Add a parity harness that can run the same scripted turn/scenario sequence
    through legacy and systems paths, then compare hashes, player snapshots,
    packed tile updates, unit updates, attack updates, resources, troops,
    ownership, stats, and terminal outcomes.
- Risk:
  - Testing only pure systems will miss integration regressions in update
    serialization, worker-facing messages, and emergent AI behavior.

### 9. Client Update Compatibility Is A First-Class Requirement

- Evidence:
  - `src/core/game/GameUpdates.ts` defines the worker-to-client update payloads,
    including `PlayerUpdate`, `AttackUpdate`, `UnitUpdate`, conquest events,
    display events, rail events, pause events, and packed tile updates.
  - `src/core/game/GameUpdateUtils.ts` diffs and applies partial player updates.
  - `src/client/view/PlayerView.ts` already exposes
    `stockFlowDiagnostics()`, but live `PlayerImpl.toFullUpdate()` does not
    currently populate diagnostics.
  - `GameRunner.executeNextTick(...)` packages `GameUpdates`,
    `packedTileUpdates`, optional motion plans, name view data, tick duration,
    and pending turn counts.
- Impact:
  - Systems cannot be considered reintegrated until the client receives the
    same observable updates at the same cadence and with the same merge
    semantics.
- Recommendation:
  - Include update-level comparison in parity tests, not only internal state
    comparison. Add system diagnostics only through existing diff/merge
    behavior or a compatibility-preserving extension.
- Risk:
  - Internal parity without update parity can still break rendering, HUD state,
    attack labels, unit movement, or multiplayer replay.

## Quick Wins

- Document `Execution` as the legacy runtime system and `src/core/systems` as
  the current stock-flow subsystem, so the migration vocabulary is explicit.
- Add a small engine parity test utility that can snapshot players, units,
  attacks, resources, tile ownership, updates, stats, and game hash after each
  tick.
- Add focused parity scenarios around existing high-risk mechanics before
  native systems replace them.
- Start emitting stock-flow diagnostics from the economy adapter only after the
  payload shape and diff behavior are verified.

## Medium Changes

- Introduce a systems scheduler that can run alongside legacy executions under
  `GameImpl.executeNextTick()` without changing behavior.
- Wrap legacy executions as system-compatible adapters, preserving exact
  ordering while allowing the scheduler to become the canonical host.
- Convert `PlayerExecution` economy behavior into a native economy system that
  uses existing `PlayerEconomyAdapter` output.
- Extract attack startup, active battle ticking, territory capture, retreat,
  and conquest side effects into isolated system boundaries while preserving
  `AttackExecution` behavior through parity tests.
- Move unit lifecycle behaviors into phase-oriented systems once command and
  active-entity state are represented outside legacy execution spawning.

## High-Risk Decisions

- Whether to keep `Game`, `PlayerImpl`, `UnitImpl`, and `AttackImpl` as the
  backing state indefinitely or introduce a more explicit world-state store.
- Whether `WarBattleSystem` should become canonical combat math or remain a
  sandbox/tuning model until map-frontier parity exists.
- How long `game.addExecution(...)` remains public compatibility surface for
  tests, AI, and internal command submission.
- Whether game hash parity is sufficient for deterministic checks or whether
  per-tick update payload parity should be mandatory for all migrated systems.
- Where to place random number ownership so system ordering changes do not alter
  deterministic combat or AI behavior.

## Guardrails

- Preserve old behavior first; only then remove legacy execution paths.
- Keep every migrated mechanic callable through existing public APIs until
  downstream callers are migrated.
- Compare old and new engines on scripted scenarios, not just pure function
  outputs.
- Keep updates and packed tile output in the parity surface.
- Keep stock-flow numeric modeling separate from discrete entity systems.
- Avoid broad state rewrites until the scheduler and parity harness are stable.
- Treat attack, AI/nations, and projectile/unit movement as high-risk migration
  areas requiring scenario-level validation.
