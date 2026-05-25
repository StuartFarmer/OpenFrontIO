# Analysis Report: Mechanics Balancer Dev Mode

## Executive Summary
- Highest impact: create a first-class mechanics preset schema and make `Config` read biomass/troop/resource parameters from it, because the current values are hard-coded constants and methods.
- Second: build the balancer as a developer-only solo-game launcher/reset surface, not as two separate demo simulations, because the current single-player path already supports world maps, bots, nations, spawning, pause, and real gameplay.
- Third: apply mechanics on reset/start through `GameStartInfo.config`, not through the current `update_game_config` intent, because update is pre-start only on server and unsupported by local tick execution.
- Fourth: reuse the existing Lit/client routing and single-player game startup path, but keep the balancer UI separate from production solo settings so experimental fields do not leak into normal play.
- Fifth: initial product decisions are fixed for planning: the balancer route is `/sandbox`, mechanics presets are copy/paste JSON only, isolated mode uses the World map, and sandbox runs do not interact with archives, achievements, or stats.

## Findings

### 1. Biomass, resource harvest, and troop growth are already real mechanics but are not configurable
- Evidence:
  - `src/core/configuration/Config.ts` defines hard-coded constants `TROOP_LOGISTIC_GROWTH_RATE`, `BASELINE_BIOMASS_PRODUCTION_SHARE`, and `MIN_BASE_RESOURCE_CAPACITY`.
  - `Config.maxResources(...)` computes resource capacity from territory and Silo levels.
  - `Config.terrainResourceProductionSplit(...)` hard-codes terrain weights: Plains favors energy, Highland favors biomass, Mountain favors materials.
  - `Config.biomassSupportedTroopCapacity(...)` derives troop support from biomass production share and max resource capacity.
  - `Config.effectiveTroopCapacity(...)` clamps troop capacity by biomass support.
  - `Config.troopIncreaseRate(...)` uses logistic growth and can become negative above biomass-supported capacity.
  - `Config.resourceIncreaseRate(...)` uses resource regen and terrain production split.
- Impact:
  - The requested first slice maps directly to existing production mechanics; a sandbox should parameterize this code path, not recreate formulas in a detached page.
  - The current constants are easy to find but not safe to tune interactively because they are compile-time module values.
- Recommendation:
  - Introduce a `MechanicsConfig` or narrower `PopulationResourceMechanicsConfig` object with defaults equal to the current formulas.
  - Have `Config` read the object from `GameConfig`, falling back to defaults when omitted.
  - Keep formula helpers pure enough for the balancer UI and tests to evaluate curves without starting a full game when useful.
- Risk:
  - If the sandbox duplicates the formula in client UI, tuning output can diverge from the actual game.

### 2. The right reset boundary is game start, not live in-game update
- Evidence:
  - `src/core/Schemas.ts` has `UpdateGameConfigIntentSchema` with `config: GameConfigSchema.partial()`.
  - `src/server/GameServer.ts` rejects `update_game_config` after `hasStarted()`.
  - `src/client/LocalServer.ts` forwards generic intents to turns, but only has special handling for `toggle_pause`; it does not apply config updates itself.
  - `src/core/execution/ExecutionManager.ts` has no `update_game_config` or `start_game` execution case, so sending those into local simulation would hit the default error path.
  - `src/core/GameRunner.ts` constructs `new Config(gameStart.config, null, false)` once when the game runner is created.
- Impact:
  - Applying mechanics changes to an active game is not currently supported and would require simulation-state mutation semantics.
  - The user request already allows "mechanics are applied on game resets," which aligns with the current architecture.
- Recommendation:
  - Treat mechanics edits as pending configuration.
  - On restart/start, create a fresh `GameStartInfo` with the selected mechanics preset embedded.
  - Do not route mechanics changes through `update_game_config` unless the design later explicitly supports pre-start private lobby sharing.
- Risk:
  - A UI that appears to edit live values while the current run continues using old values would be misleading. The balancer must clearly separate pending preset edits from active run state.

### 3. A standalone developer-route balancer is more consistent with the current app than two separate demo pages
- Evidence:
  - `src/client/SinglePlayerModal.ts` already builds a local `JoinLobbyEvent` with map, compact map, difficulty, bots, nations, game mode, random spawn, disabled units, and cheats.
  - `src/core/GameRunner.ts` spawns players, tribes/bots, and nations from `gameStart.config`.
  - `src/client/LocalServer.ts` already supports local single-player pause/resume through `toggle_pause` intents.
  - `src/client/Main.ts` already has route-specific demo bootstraps for HUD workbenches (`/hud-demo`, `/hud-live-demo`, `/hud-kit`, `/hud-panels`), showing there is precedent for developer-only standalone views.
  - `src/client/components/PlayPage.ts` is the normal first screen for production play.
- Impact:
  - The isolated blank-board and bot solo cases can likely be modes inside one balancer: same mechanics controls, different start preset.
  - A standalone developer route can avoid cluttering normal solo UI while still launching the real single-player engine.
- Recommendation:
  - Use one standalone developer balancer route with:
    - Mechanics controls.
    - Mechanics JSON import/export.
    - Solo launch settings for map, map size, bots, nations, difficulty, random spawn, and maybe instant build/infinite options.
    - Start/restart/pause/resume controls around the real local game.
  - Implement the isolated case on the existing World map, with bots/nations controlled by sandbox launch settings, rather than adding a new blank map.
- Risk:
  - World-map isolation depends on launch settings such as low bots and disabled/reduced nations; it will not be a synthetic geometry test board.

### 4. The schema boundary should be explicit and validated
- Evidence:
  - `src/core/Schemas.ts` uses Zod for `GameConfigSchema`, `GameStartInfoSchema`, intents, and server messages.
  - `src/core/Schemas.ts` already includes `hostCheats` as an optional structured sub-object for local/private modifiers.
  - `src/server/GameServer.ts.updateGameConfig(...)` manually copies allowed config fields and assigns `hostCheats`.
  - `src/client/HostLobbyModal.ts` and `src/client/SinglePlayerModal.ts` construct config objects directly from UI state.
- Impact:
  - A free-form JSON blob without schema validation would undermine deterministic simulation and make bad presets hard to debug.
  - Putting mechanics in `GameConfig` makes it available to worker creation, replay records, and tests.
- Recommendation:
  - Add a mechanics sub-schema under `GameConfigSchema`, for example `mechanics.populationResources`.
  - Keep defaults centralized in code, and allow presets to omit fields that should inherit defaults.
  - Use schema parsing for copy/paste JSON import/export and for game-start config validation.
  - Include a version field if presets are expected to outlive the current branch.
- Risk:
  - Adding mechanics to `GameConfig` means game records and possibly public lobby metadata can carry the field. The implementation must decide whether to strip or hide it outside dev/single-player contexts.

### 5. Current UI already displays the metrics the balancer needs to observe
- Evidence:
  - `src/core/game/PlayerImpl.ts` emits `resources`, `resourceCapacity`, `effectiveTroopCapacity`, `biomassSupportedTroopCapacity`, `troopIncreaseRate`, and `troops` in `toFullUpdate()`.
  - `src/core/game/GameUpdateUtils.ts` diffs and applies those fields.
  - `src/client/view/PlayerView.ts` exposes `resourceCapacity()`, `biomassSupportedTroopCapacity()`, and `troopIncreaseRate()`.
  - `src/client/hud/layers/ControlPanel.ts` reads player resources, capacity, troops, and troop rate.
  - `tests/client/hud/ControlPanel.test.ts` and `tests/client/view/PlayerView.test.ts` already cover these fields.
  - `docs/HUD_UI_CATALOG_PLAN.md` establishes the newer HUD kit in `src/client/hud/ui/` as the documented path for controls, surfaces, rows, indicators, and recipes.
  - `src/client/hud/ui/HudComponents.ts` already provides reusable primitives useful for the sandbox surface: `hud-surface`, `hud-surface-header`, `hud-surface-body`, `hud-button`, `hud-icon-button`, `hud-action-group`, `hud-toolbar`, `hud-input`, `hud-select`, `hud-range`, `hud-blend-slider`, `hud-segmented-control`, `hud-pill`, `hud-meter`, `hud-table`, `hud-stat-grid`, `hud-form-row`, and `hud-field-label`.
- Impact:
  - The first balancer can likely use existing HUD feedback to observe effects rather than building a custom telemetry overlay immediately.
  - A future balancer overlay can consume existing player-view fields for charts and diagnostics.
  - The sandbox UI should become an early consumer of the HUD UI kit, not a parallel Tailwind-heavy dev surface.
- Recommendation:
  - Start with existing HUD plus optional dev-only summary cards for active preset values and current player metrics.
  - Build the sandbox controls, command bars, JSON import/export panel, launch settings, and diagnostics from cataloged HUD primitives wherever possible.
  - If the balancer needs a missing primitive, add it to the HUD kit/catalog instead of creating one-off sandbox styling, unless the need is clearly sandbox-only.
  - Avoid changing the HUD contract unless the balancer needs new derived values not already available.
- Risk:
  - Existing HUD metrics are current-state values, not formula curves. If tuning requires comparing candidate curves before restart, add pure formula preview helpers rather than scraping UI state.
  - The HUD catalog is still evolving, so the sandbox may need small catalog-aligned additions rather than waiting for the full modal/popover/menu roadmap.

### 6. Tests already cover the mechanics and should become the safety net for parameterization
- Evidence:
  - `tests/core/configuration/ResourceCapacity.test.ts` covers terrain-weighted resource production, biomass-supported troop capacity, logistic troop growth, and negative growth above biomass support.
  - `tests/core/executions/PlayerExecution.test.ts` covers passive resource regen, capacity clamping, and biomass-constrained troop reduction.
  - `tests/GameUpdateUtils.test.ts`, `tests/client/view/PlayerView.test.ts`, and `tests/client/hud/ControlPanel.test.ts` cover update and UI propagation for the relevant metrics.
- Impact:
  - Parameterization can be tested without broad end-to-end UI automation at first.
  - Existing tests encode current behavior; they should verify defaults remain unchanged when no mechanics blob is supplied.
- Recommendation:
  - Add tests that a custom mechanics preset changes only the intended formula outputs.
  - Add schema tests for valid/invalid mechanics blobs.
  - Add local game-start tests proving the mechanics object survives into `Config`.
- Risk:
  - If default values shift accidentally during centralization, balance regressions will look like intended refactors unless defaults are explicitly tested.

## Quick Wins
- Define a typed default mechanics object beside `Config` or in a new `src/core/configuration/MechanicsConfig.ts`.
- Add a Zod schema for the first tunables: troop logistic growth rate, biomass baseline share, minimum base resource capacity, resource regen base/exponent/divisor, resource regen multiplier, terrain resource weights, bot/nation troop/resource multipliers, and Silo/resource-capacity contribution.
- Add default-preservation tests before wiring UI.
- Add a `/sandbox` developer route stub following the existing `/hud-demo` route pattern, without exposing it through normal nav.

## Medium Changes
- Thread optional mechanics config through `GameConfigSchema`, single-player game creation, worker `GameStartInfo`, and `Config`.
- Build a Lit balancer component with sliders/number inputs, copy/paste JSON import/export, validation errors, and start/restart/pause/resume controls.
- Build the balancer UI from the HUD UI catalog primitives in `src/client/hud/ui/`; avoid bespoke Tailwind-heavy controls and panels.
- Add local preset launch settings for map, compact map, bots, nations, random spawn, difficulty, and a low-player World-map isolation mode.
- Add a reset flow that tears down the current local game and starts a new one with the pending mechanics preset.
- Add developer-only diagnostics showing active preset, current resources/capacity, biomass-supported troop cap, effective troop cap, troops, and troop delta.
- Add sandbox-run lifecycle handling that bypasses archive, achievement, and stats submission.
- Keep mechanic edits as pending values applied on restart. Editing while the game is running is acceptable only if it is effectively free; otherwise require pause before changing pending values.
- Treat sandbox presets as tuning inputs for the eventual master game configuration, not as a user-facing adjustable preset system.

## Guardrails
- Do not duplicate production formulas in a standalone sandbox simulation.
- Do not permit mechanics presets in public/ranked games unless a separate product decision says so.
- Do not apply formula changes mid-turn in the first slice.
- Do not add named local presets or file-loading UX in the first slice; use copy/paste JSON only.
- Do not create a new blank map for the first isolated mode; use the existing World map.
- Do not archive sandbox runs or connect them to achievements/stats.
- Do not add private-lobby mechanics preset sharing in this initiative.
- Do not add live mechanics mutation. Pending values apply on restart.
- Do not build a parallel sandbox-only UI kit. Use cataloged HUD primitives first, and only add missing primitives in the HUD kit when needed.
- Keep default mechanics byte-for-byte behaviorally equivalent where possible.
- Validate imported JSON with Zod and surface errors before start.
- Keep mechanics presets deterministic and serializable in `GameStartInfo`.
- Keep experimental UI out of normal production flows until access is explicitly decided.

## Primary Touchpoints
- `src/core/configuration/Config.ts`: replace hard-coded biomass/resource/troop constants and terrain weights with defaulted mechanics config reads.
- `src/core/configuration/MechanicsConfig.ts` or equivalent new module: own default mechanics values, types, normalization, and pure formula helpers.
- `src/core/Schemas.ts`: add validated mechanics schema under `GameConfigSchema`, plus any versioning or single-player/dev restrictions.
- `src/core/GameRunner.ts`: confirm `new Config(gameStart.config, ...)` receives the mechanics object at game creation.
- `src/client/SinglePlayerModal.ts`: reuse or factor game-start construction so the balancer can launch real solo games without duplicating config assembly.
- `src/client/LocalServer.ts`, `src/client/Transport.ts`, `src/client/ClientGameRunner.ts`: support balancer restart/pause/start lifecycle around local games, bypass archive/achievement/stat side effects, and avoid using unsupported in-game `update_game_config`.
- `src/client/Main.ts`: add a `/sandbox` standalone developer route bootstrap for the balancer.
- `src/client/sandbox/` or equivalent new client folder: likely home for the standalone balancer component and pending-versus-active mechanics state.
- `src/client/hud/ui/HudComponents.ts`, `src/client/hud/ui/HudCatalog.ts`, `src/client/hud/ui/index.ts`: reuse existing primitives for sandbox controls/surfaces; extend only if the balancer exposes a reusable missing pattern.
- `src/client/hud/layers/ControlPanel.ts`, `src/client/view/PlayerView.ts`: likely observation surfaces; change only if new metrics are required.
- `tests/core/configuration/ResourceCapacity.test.ts`: default preservation and custom mechanics formula coverage.
- `tests/core/executions/PlayerExecution.test.ts`: custom mechanics integration through tick execution.
- `tests/client/LocalServer.test.ts`, `tests/client/JoinLobbyModal.test.ts`, and new balancer component tests: validate game-start config and restart lifecycle once UI exists.
