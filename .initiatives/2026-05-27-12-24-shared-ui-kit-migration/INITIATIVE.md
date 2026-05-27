# Initiative: Shared UI Kit Migration

## Stack
- Language: TypeScript
- Package manager: npm with `package-lock.json`
- Test runner: Vitest with jsdom configured in `vite.config.ts`
- Build: Vite 8, TypeScript 6, Tailwind CSS 4
- UI: Lit web components, Tailwind utility classes, Pixi/WebGL game renderer, custom HUD web components
- CI: GitHub Actions under `.github/workflows`

## Goal

Move the reusable UI primitive layer to `src/client/components/ui` and use it consistently across app UI, modals, lobby screens, settings, clan/leaderboard views, and HUD overlays that currently hand-build controls. HUD-specific compositions can remain in `src/client/hud/ui`, but generic primitives should be app-wide components, not HUD-only components.

## Problem Statement

The codebase has three overlapping UI systems:

- `src/client/hud/ui`: the most complete component kit, including surfaces, buttons, icon buttons, pills, meters, tables, stats, form rows, inputs, selects, ranges, modal pieces, alerts, menus, rows, stacks, and grids.
- `src/client/components/ui`: a thin helper layer containing only `ActionButton.ts`, `Divider.ts`, and `ModalHeader.ts`.
- `src/client/components/baseComponents`: older primitives such as `<o-button>` and `<o-modal>`, plus ranking/settings/stat subcomponents.

As a result, many files in `src/client/components`, root-level app modals, and several HUD modals still manually compose visual UI using raw `<button>`, `<input>`, `<select>`, Tailwind classes, inline slider CSS, and ad hoc modal/card shells. The current `send-resource-modal` is a clear example: it implements a modal shell, close button, preset buttons, range slider, tooltip, cap marker, summary row, and actions directly instead of composing shared primitives.

## Success Definition

The analysis succeeds when the initiative documents:

- where the current UI kit lives and why that location is wrong for app-wide UI reuse,
- which files already use `components/ui`, `baseComponents`, or `hud/ui`,
- which files still hand-build UI,
- what each non-kit UI file is doing,
- which reusable component primitive should replace each hand-built UI pattern while preserving behavior.

## Non-Goals
- Do not migrate any UI in this analysis step.
- Do not remove existing HUD kit components yet.
- Do not create tickets, waves, or implementation acceptance criteria.
- Do not change visual behavior during analysis.

## Constraints
- Preserve exact user-facing behavior when later migrating: modal lifecycle, events, keyboard handling, disabled states, focus behavior, translations, router integration, and game event dispatch must remain intact.
- Existing dirty worktree changes must not be reverted.
- HUD-only gameplay layout constraints still matter: fixed-position overlays, pointer-event behavior, and compact HUD density cannot be broken by app-wide component extraction.
- The shared kit should support both app UI and HUD UI without forcing marketing-style or card-heavy layouts into gameplay surfaces.

## Assumptions
- `src/client/components/ui` is the intended home for reusable app-wide UI primitives.
- `src/client/hud/ui` should become either a consumer of shared primitives or a home for HUD-specific composites only.
- Existing `<o-button>` and `<o-modal>` behavior should be treated as compatibility behavior until a more complete shared component set replaces or wraps them.
- The inventory in `UI_MIGRATION_INVENTORY.md` is based on static evidence: imports, `<hud-*>`, `<o-*>`, raw `<button>/<input>/<select>` usage, and repeated Tailwind surface/control classes.

## Risk Posture

Medium. The UI migration touches high-traffic flows: solo start, private lobbies, join lobbies, settings, language selection, clan management, leaderboard, and in-game action panels. The biggest risk is not styling; it is accidentally changing modal lifecycle, focus, game events, or state update semantics while replacing markup.

## Next Step
Run planning for this initiative.
