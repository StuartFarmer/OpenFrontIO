# Initiative: Mechanics Balancer Dev Mode

## Stack
- Language: TypeScript
- Package manager: npm with `package-lock.json`
- Test runner: Vitest through `npm test` / `vitest run`
- Build: Vite plus `tsc --noEmit` through `npm run build-dev` / `npm run build-prod`
- UI: Lit custom elements, Tailwind-style utility classes, custom HUD/rendering layers
- CI: GitHub Actions under `.github/workflows/`

## Goal

Analyze how to create a standalone developer-route mechanics balancer where biomass, resource harvest, resource capacity, and troop population growth parameters can be edited interactively and applied to a solo game reset. The tool should start with biomass and troop mechanics, support low-player isolation as well as bot/nation solo scenarios, and provide a copy/paste JSON mechanics blob that can drive future balance experiments.

## Problem Statement

The current biomass and troop mechanics are implemented in core `Config` methods as hard-coded constants and formulas. Single-player setup already exposes map, bots, nations, difficulty, cheats, and related game settings, but it does not expose a structured mechanics preset, and the existing `update_game_config` path is limited to pre-start lobby configuration. A mechanics balancer needs a clear schema for tunable values, a controlled developer UI, and a reliable reset boundary so formula changes do not create mid-turn or replay/desync ambiguity.

## Success Definition

The repo has a concrete implementation direction for a developer mechanics balancer at `/sandbox` that can edit biomass/troop parameters, serialize those values into a copy/paste JSON mechanics blob, validate and apply the blob to a new solo game, and let the user restart into either an isolated World-map run or a bot/nation scenario. The analysis identifies the code touchpoints, current constraints, high-impact risks, and critical product questions without assuming unresolved behavior.

## Non-Goals
- Do not implement the balancer in this initiative analysis.
- Do not define final numeric balance values.
- Do not generalize every mechanic in the game in the first slice.
- Do not allow arbitrary mechanics mutation in public multiplayer.
- Do not change ranked/public balance semantics.
- Do not require live mid-game formula mutation unless explicitly chosen later.
- Do not integrate sandbox runs with archives, achievements, or stats.

## Constraints
- Biomass, resource capacity, resource production, and troop growth are currently concentrated in `src/core/configuration/Config.ts`, but not exposed as a structured preset.
- `GameConfigSchema` in `src/core/Schemas.ts` validates game setup and host cheats, but it has no mechanics-preset field.
- Local single-player games are started from `SinglePlayerModal` by constructing `gameStartInfo.config`; resets require a new local game lifecycle.
- `update_game_config` exists, but server code rejects it after start and the local worker execution path does not handle it as an in-game execution.
- Game simulation runs in the core worker and uses serialized `GameStartInfo`, turns, and deterministic execution; any mechanics blob must remain schema-validated and deterministic.
- The first UI must live on the standalone `/sandbox` developer route, not inside the normal solo modal.
- The first preset UX is copy/paste JSON only; named local presets and file loading are out of initial scope.
- The isolated "blank board" mode uses the existing World map with bots/nations controlled by sandbox launch settings; no new blank map is required for the first version.
- Sandbox-launched runs must not participate in archive, achievement, or stats flows.
- Mechanics controls do not need live application during a run; pending values apply when the user restarts. If keeping controls editable while running adds complexity, restrict editing to the paused state.
- Mechanics presets are sandbox-only tuning inputs for now. There are no current plans to expose adjustable presets in private lobbies; the long-term direction is a master mechanics configuration for all games after sandbox tuning.
- The user explicitly wants critical design choices clarified instead of inferred.

## Assumptions
- The first balancer slice is limited to biomass/resource/troop parameters already represented by current formulas.
- Mechanics values should apply on game reset/start, not mutate the active simulation mid-turn, unless a later design decision says otherwise.
- Developer-only access should be implemented as `/sandbox`, likely following the existing route-specific demo bootstrap pattern in `src/client/Main.ts`.
- The mechanics blob should be structured JSON with copy/paste import/export only in the first version.
- Private-lobby preset sharing is out of scope.

## Risk Posture

High for architecture and medium for implementation. The formulas are localized enough to centralize cleanly, but the balancer crosses schema validation, game startup, local server lifecycle, UI routing, replay/determinism expectations, and AI/bot behavior. The largest risk is accidentally creating a second mechanics path that diverges from the real game.

## Next Step
Run planning for this initiative.
