# Initiative: HUD Structural Composition Migration

## Stack
- Language: TypeScript
- Package manager: npm
- Test runner: Vitest
- Build: Vite 8, TypeScript `tsc --noEmit`
- UI: Lit web components, Tailwind utility classes, shared HUD primitives in `src/client/hud/ui/HudComponents.ts`
- CI: GitHub Actions in `.github/workflows/`

## Goal
Move remaining app, homepage, and game UI structure onto the shared HUD webcomponent system so screens are composed from `hud-*` primitives rather than raw Tailwind card, row, modal, panel, and overlay markup.

## Problem Statement
The previous migration cleaned raw controls and tables, but many surfaces still hand-roll visual structure with raw `div` shells, bespoke modal wrappers, custom card rows, and duplicated fixed/grid game layout. This keeps styling fragmented and makes the HUD kit less authoritative as the application-wide UI system.

## Success Definition
- Legacy modal compatibility is either removed or internally backed by HUD modal primitives.
- Homepage/page chrome and game HUD shell use shared HUD layout primitives or newly added HUD primitives where existing atoms are insufficient.
- Remaining raw structural markup is either true layout/media content or explicitly documented.
- The UI kit page demonstrates any new primitives created for this migration.
- Typecheck, focused component tests, and development build pass.

## Non-Goals
- Replacing full-color content media such as logos, screenshots, maps, flags, avatars, cosmetics, Markdown images, and currency art with masked HUD icons.
- Rewriting game logic, matchmaking logic, lobby behavior, auth behavior, store data flow, or analytics/ad integrations.
- Redesigning visual language beyond mapping existing surfaces onto the shared HUD primitives.
- Removing Tailwind entirely from low-level layout where no meaningful HUD abstraction exists.

## Constraints
- Preserve current behavior and event wiring exactly.
- Avoid broad visual redesign while migrating composition.
- Keep changes iterative and testable; do not batch every screen into one unreviewable pass.
- Do not revert unrelated user or generated changes in the dirty worktree.
- HUD primitive internals may contain raw native controls because they define the webcomponent system.

## Assumptions
- `hud-*` remains the canonical UI system; `ui-*` should not be reintroduced.
- Full-color media remains raw or purpose-built media components.
- The `o-modal` / `o-button` compatibility layer should be phased out where practical, but may remain temporarily if internally backed by HUD primitives and no direct call sites remain.
- New HUD primitives are acceptable when repeated structure cannot compose cleanly from existing atoms.

## Risk Posture
Moderate. The migration touches broad UI surfaces, but risk can be controlled by isolating shared primitives first, then moving screen groups wave by wave with focused tests and visual review via `/ui-kit`, homepage, sandbox, and solo game smoke paths.

## Next Step
Execute the plan for this initiative.
