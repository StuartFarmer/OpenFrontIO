# Deliverables

## D1: Mechanics Preset Contract
**Outcome**: Biomass/resource/troop tuning values have a typed, validated mechanics preset contract with defaults matching current game behavior.
**Demo**:
`npx vitest run tests/core/configuration/ResourceCapacity.test.ts`
**Acceptance Checks**:
- [ ] A default mechanics object exists for the first biomass/resource/troop slice.
- [ ] `GameConfigSchema` accepts a validated optional mechanics section.
- [ ] Missing mechanics fields inherit defaults.
- [ ] Invalid pasted JSON values fail schema validation with actionable errors.
- [ ] Defaults preserve existing behavior when no mechanics blob is supplied.
**Dependencies**: Existing `GameConfigSchema`, `Config`, and resource/troop formula tests.
**Notes**: Keep this scoped to the current biomass/resource/troop mechanics. Do not create a generic whole-game scripting surface.

## D2: Config-Backed Mechanics Formulas
**Outcome**: Production `Config` reads mechanics values from the preset contract for resource capacity, terrain resource production, biomass-supported troop capacity, troop growth, and passive resource growth.
**Demo**:
`npx vitest run tests/core/configuration/ResourceCapacity.test.ts tests/core/executions/PlayerExecution.test.ts`
**Acceptance Checks**:
- [ ] Existing default formula outputs are unchanged.
- [ ] Custom troop growth parameters affect `troopIncreaseRate(...)`.
- [ ] Custom biomass/resource parameters affect biomass-supported troop capacity and resource gain.
- [ ] Terrain resource weights are configurable through the preset.
- [ ] Bot/nation multipliers remain deterministic and default-compatible.
**Dependencies**: D1.
**Notes**: The sandbox must tune the real formula path, not a duplicate client-only simulation.

## D3: Sandbox Route And Real-Game Lifecycle
**Outcome**: `/sandbox` launches a developer-only real single-player run with sandbox mechanics, World-map isolation options, restart/pause/resume controls, and no archive/achievement/stat side effects.
**Demo**:
`npm run start:client -- --host 127.0.0.1`
**Acceptance Checks**:
- [ ] `/sandbox` renders a standalone sandbox surface without normal nav exposure.
- [ ] Sandbox start creates a real local single-player game using `GameStartInfo`.
- [ ] Restart tears down the current local run and starts a fresh run with pending mechanics values.
- [ ] World-map isolated mode can run with bots/nations set by sandbox launch controls.
- [ ] Sandbox runs do not archive or participate in achievements/stats.
**Dependencies**: D1, D2.
**Notes**: Do not use the unsupported in-game `update_game_config` path for mechanics application.

## D4: Mechanics Balancer UI
**Outcome**: The sandbox surface provides mechanic controls, copy/paste JSON import/export, pending-versus-active state, launch settings, and concise diagnostics for tuning, built from the HUD UI catalog primitives wherever possible.
**Demo**:
`npx vitest run tests/client/LocalServer.test.ts tests/client/JoinLobbyModal.test.ts`
**Acceptance Checks**:
- [ ] Controls cover the first biomass/resource/troop parameter set.
- [ ] Controls and panels use cataloged HUD primitives such as `hud-surface`, `hud-button`, `hud-input`, `hud-select`, `hud-range`, `hud-segmented-control`, `hud-pill`, `hud-meter`, `hud-stat-grid`, `hud-form-row`, and `hud-field-label` where applicable.
- [ ] Any missing reusable primitive needed by the sandbox is added to the HUD kit/catalog instead of implemented as one-off sandbox styling, unless explicitly sandbox-only.
- [ ] Copy/paste JSON export reflects pending mechanics values.
- [ ] Pasted JSON is schema-validated before it can be applied.
- [ ] Pending values apply on restart; live mutation is not introduced.
- [ ] If editing while running adds complexity, controls require pause before pending edits.
- [ ] Diagnostics show active preset and current player values relevant to tuning.
**Dependencies**: D1, D2, D3.
**Notes**: No named local presets, file import, private-lobby sharing, public/ranked mechanics overrides, or parallel sandbox-only UI kit.

## D5: Verification And Handoff
**Outcome**: Targeted tests, type checking, build validation, and manual sandbox verification establish that the balancer is safe to use for tuning and ready for future master-config hardening.
**Demo**:
`npm run build-dev`
**Acceptance Checks**:
- [ ] Core mechanics tests pass with default and custom presets.
- [ ] Sandbox lifecycle tests prove restart and side-effect bypass behavior.
- [ ] Client/component tests cover JSON validation and pending/active state.
- [ ] TypeScript and Vite development build pass.
- [ ] Manual `/sandbox` run verifies World-map isolation, bot/nation scenario, pause/restart, and JSON import/export.
- [ ] Handoff notes identify how tuned values become the future master mechanics configuration.
**Dependencies**: D1, D2, D3, D4.
**Notes**: Full `npm test` can be recorded if practical, but targeted tests plus build are the primary feature signal.
