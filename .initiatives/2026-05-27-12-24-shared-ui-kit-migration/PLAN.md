# Shared UI Kit Migration Plan

## Objective

Update the game and web UI to use the new composable UI kit consistently while maintaining existing functionality, translations, event behavior, modal lifecycle, keyboard handling, routing, and game integrations.

This plan builds on:

- `INITIATIVE.md`
- `REPORT.md`
- `OVERVIEW.md`
- `UI_MIGRATION_INVENTORY.md`
- `docs/HUD_UI_CATALOG_PLAN.md`

## Strategy

The migration should start with a generic app UI primitive layer under `src/client/components/ui`, then use that layer to migrate higher-level app screens and modals. HUD-specific compositions can remain under `src/client/hud/ui`, but generic controls should not be locked inside the HUD namespace.

The key boundary is:

- `src/client/components/ui`: shared reusable primitives for all app UI.
- `src/client/hud/ui`: HUD-specific compositions and wrappers, preferably composed from shared primitives where practical.
- `src/client/components/baseComponents`: legacy compatibility layer during migration.

## Execution Order

1. Build the shared primitive foundation and compatibility wrappers.
2. Migrate the critical homepage, solo/private game, and lobby flows.
3. Migrate root app modals such as account, store, help, language, news, cosmetics, and flags.
4. Migrate settings, clan, leaderboard, ranking, and stats surfaces.
5. Migrate in-game HUD modals and overlays that still hand-build UI.
6. Clean up duplicate styling paths, add guardrails, and update documentation.

## Parallelism

Wave 1 must lead because later work depends on the shared primitive API. After Wave 1, Waves 3, 4, and 5 can partially proceed in parallel, but Wave 2 should be prioritized because it covers the user-facing start-game path and protects the currently fragile homepage/lobby flow.

## Validation

Each wave should run targeted checks for the touched surface. Final validation should include:

```bash
npx tsc --noEmit
npx vite build --mode development
npx vitest run tests/client/hud/HudCatalog.test.ts
npx vitest run tests/client/components/NewsBox.test.ts tests/client/NewsMarkdown.test.ts
npx vitest run tests/client/utilities/SinglePlayerGameStart.test.ts
npx vitest run tests/client/sandbox/SandboxBalancer.test.ts tests/client/sandbox/FoodSystemsSandbox.test.ts tests/client/sandbox/PopulationFoodSystemsSandbox.test.ts tests/client/sandbox/WarBattleSystemsSandbox.test.ts
git diff --check
```

Additional targeted component tests should be added as tickets introduce shared primitive wrappers or migrate modal lifecycle behavior.

## Non-Goals

- Do not redesign gameplay behavior.
- Do not add new store/account/social functionality.
- Do not remove working features unless a ticket explicitly deprecates a compatibility wrapper after all callers are migrated.
- Do not collapse HUD-specific concepts into generic components when the component is actually game-HUD specific.

