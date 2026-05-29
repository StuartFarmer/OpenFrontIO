# Initiative: OpenFront Module Relocation/Wrapping

## Stack
- Language: TypeScript, with a Go map generator utility outside this scope.
- Package manager: npm.
- Test runner: Vitest.
- Build: Vite plus `tsc --noEmit` through `npm run build-dev` / `npm run build-prod`.
- UI: Lit custom elements, custom WebGL renderer, Tailwind CSS.
- CI: GitHub Actions under `.github/workflows/`.

## Goal
Make OpenFront the canonical game module behind an explicit module boundary while preserving current gameplay, UI, worker, multiplayer, and replay behavior.

This initiative is the OpenFront-specific extraction step from the broader engine/module direction. It should create a place for OpenFront-owned server startup, client mounting, schemas, command routing, and view/HUD composition without forcing new games to inherit OpenFront mechanics.

## Problem Statement
OpenFront is currently the implicit game engine. The central runner, worker API, client startup path, transport events, schemas, HUD composition, and game model all name OpenFront mechanics directly. That makes a new game module inherit concepts such as nations, bots, spawn phase, attacks, boats, alliances, railroads, win checks, units, player buildables, and OpenFront HUD elements even when it does not want them.

The immediate need is not to rewrite those systems. The need is to wrap and relocate them so OpenFront becomes one implementation selected through a registry/module contract. The default user-visible behavior should remain OpenFront.

## Success Definition
- OpenFront has an explicit module entry point, likely under `src/games/openfront`, that owns current OpenFront server and client composition.
- The existing OpenFront server startup path is preserved behind an OpenFront server module instead of remaining the only engine startup path.
- The existing OpenFront client mount path is preserved behind an OpenFront client module instead of being hardcoded as the universal client shell.
- Current OpenFront schemas, command vocabulary, worker queries, game view, HUD layers, input behavior, and renderer integration remain behaviorally compatible.
- The selected module is looked up once at the boundary; no scattered `if (moduleId === "openfront")` or feature-flag matrix is introduced.
- Moves into `src/games/openfront` are allowed when imports and tests remain clean.

## Non-Goals
- Do not implement Foundation in this initiative.
- Do not migrate to the generic update envelope in full; bridge or preserve existing OpenFront updates as needed.
- Do not modularize the custom WebGL renderer beyond what OpenFront wrapping requires.
- Do not redesign multiplayer protocol semantics beyond preserving a path for later module envelopes.
- Do not replace OpenFront's `Game`, `Player`, `Unit`, `GameConfig`, or intent schemas.
- Do not remove existing sandbox pages.

## Constraints
- Preserve current OpenFront behavior as the default.
- Work with the existing dirty worktree; do not revert unrelated edits.
- Avoid broad import churn unless it is part of a deliberate relocation step.
- Keep compatibility with the existing worker drain loop and transferable packed tile updates.
- Keep multiplayer and replay compatibility intact for OpenFront.
- Avoid central module switches; use registry lookup plus polymorphic module objects.

## Assumptions
- A separate initiative will own generic protocol/update envelope migration.
- A separate initiative will own Foundation MVP.
- A separate initiative will own shared renderer modularization if Foundation needs a reusable renderer boundary.
- OpenFront may keep using Zod schemas in their current form.
- Existing tests can be used as behavior guards while new module-boundary tests are added.

## Risk Posture
Medium. The extraction can be mostly wrapper-first, but the touched integration points are central: `GameRunner`, the worker, `ClientGameRunner`, `Transport`, and HUD mounting. The safest path is to add OpenFront module wrappers first, route current behavior through them, then relocate files in small groups only after behavior is covered.

## Next Step
Execute the plan in `PLAN.md`.

## Clarified Decisions
- Moving OpenFront files into `src/games/openfront` is acceptable early if imports and tests remain clean.
- Do not add re-export shims for moved files. Update imports and references directly.
- Include HUD/client code in the OpenFront module boundary early.
- Multiplayer-specific module work is punted to the dedicated multiplayer compatibility initiative.
