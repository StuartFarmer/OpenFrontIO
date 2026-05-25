# Initiative: HUD Component Catalog Elements

## Stack
- Language: TypeScript
- Package manager: npm
- Test runner: Vitest
- Build: Vite, TypeScript `tsc --noEmit`
- UI: Lit custom elements, Tailwind CSS v4, HUD-specific web components
- CI: Repository workflows not inspected in depth for this initiative; local validation should use npm scripts already present in `package.json`.

## Goal

Construct a single Bootstrap-style HUD component catalog made of small reusable elements that can later be composed into larger HUD panels, overlays, modals, and game-specific widgets.

## Problem Statement

The HUD already has a strong reusable component base in `src/client/hud/ui/HudComponents.ts` and a visual catalog entry point in `hud-kit.html`, but the catalog is not yet authoritative. It is mostly a workbench of examples, while several reusable needs identified in `docs/HUD_UI_CATALOG_PLAN.md` remain missing: modal shells, popovers, alerts/toasts, menus, tabs, empty states, confirmation actions, layout helpers, and a documented icon registry.

The next initiative should add those smaller elements into one shared catalog. It should avoid building final composites such as the complete control panel, leaderboard, player panel, or chat modal. Those composites should only become consumers of the catalog later.

## Success Definition

- A single catalog manifest documents the HUD element library and drives or mirrors the `hud-kit.html` examples.
- Each wave adds only small primitives, controls, rows, surfaces, overlays, or recipes to that catalog.
- The catalog contains enough elements to assemble future composite HUD panels without copying local Tailwind-heavy markup from existing layer components.
- Each cataloged element has its intended API recorded: properties, attributes, slots, events, states, CSS variables, examples, and migration status.
- Validation confirms the custom elements register cleanly and the catalog page can be reviewed locally.

## Non-Goals
- Do not build finished composite HUD components in this initiative.
- Do not migrate every existing live layer to the new catalog elements.
- Do not redesign the game HUD placement, z-index model, or live responsive layout.
- Do not force radial/WebGL command surfaces into generic panel primitives.

## Constraints
- Preserve the existing Lit custom element approach in `src/client/hud/ui/HudComponents.ts`.
- Keep all new examples flowing into one catalog page and one catalog manifest.
- Treat current live layer components as evidence and future consumers, not as the primary implementation target.
- Avoid unrelated refactors in game-layer controllers.
- Respect existing local changes in the worktree.

## Assumptions
- `docs/HUD_UI_CATALOG_PLAN.md` is the current source of truth for desired catalog scope.
- The previous HUD component-library and web-component-composition initiatives establish the baseline primitives already in `HudComponents.ts`.
- New catalog elements can initially live in `src/client/hud/ui/HudComponents.ts` or adjacent UI files, then be split only when size or ownership requires it.
- `hud-kit.html` remains the visual review surface.

## Risk Posture

Medium. Most work is additive UI library work, but the risk rises if waves mutate existing live HUD layers too early. The safest path is to create and catalog small elements first, then defer composite migrations to later initiatives.

## Next Step

Execute the wave plan in `PLAN.md`, starting with the single catalog manifest and catalog page spine.
