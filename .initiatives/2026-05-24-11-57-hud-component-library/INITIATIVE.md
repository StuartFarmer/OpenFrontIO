# Initiative: HUD Component Library

## Stack
- Language: TypeScript
- Package manager: npm
- Test runner: Vitest
- Build: Vite, TypeScript
- UI: Lit custom elements, Tailwind CSS v4 through `@tailwindcss/vite`
- CI: Repository workflows not inspected for this initiative; local checks are `npm run lint`, `npx tsc --noEmit`, and targeted Vitest where behavior is covered.

## Goal

Create a singular reusable HUD component library with primitives and composed molecules that can be used to build new HUD panels, HUD layers, and the `/hud-kit` catalog without repeating ad hoc Tailwind layouts in each feature component.

## Problem Statement

The HUD has started moving toward shared styling through `src/client/hud/ui/HudTheme.ts`, but several live components still build meaningful UI molecules directly with inline Tailwind class strings. This creates inconsistent spacing, borders, typography, icon sizing, slider behavior, and component composition across the control panel, player overlay, events display, unit display, sidebars, and catalog page.

## Success Definition

The source of truth for HUD styling and reusable HUD UI building blocks lives under `src/client/hud/ui`, `/hud-kit` demonstrates those building blocks from primitives through complete HUD layers, and new HUD panels can be assembled from reusable exports without copying raw Tailwind structure for common controls.

## Non-Goals
- Redesigning gameplay behavior.
- Replacing Lit or Tailwind.
- Reworking non-HUD app components outside the HUD surface.
- Rewriting every modal in the repository.
- Adding a broad design-system framework or package.

## Constraints
- Keep the implementation lean and scoped to actual HUD reuse needs.
- Preserve existing visual fidelity unless a change is explicitly required for standardization.
- Work with the existing light-DOM Tailwind pattern used by the HUD components.
- Avoid speculative abstraction; promote only UI patterns already present in live HUD layers or the HUD kit.
- Do not revert unrelated in-progress HUD changes in the working tree.

## Assumptions
- `HudPanelWorkbench` is the intended `/hud-kit` source of truth.
- Existing `HudTheme.ts` constants are the seed for the component library, not throwaway code.
- The first standardization pass should target the active HUD layers already identified as ad hoc rather than legacy demo pages.
- Modals such as `SendResourceModal` can be planned as a later scoped pass unless the current HUD library needs their primitives immediately.

## Risk Posture

Moderate. The work touches user-facing HUD rendering across active gameplay surfaces, but most changes can be limited to extracting existing markup into reusable render helpers/components and then consuming those helpers without changing data flow.

## Next Step

Run planning for this initiative.
