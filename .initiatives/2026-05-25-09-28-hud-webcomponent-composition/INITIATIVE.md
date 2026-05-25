# Initiative: HUD Webcomponent Composition

## Stack

- Language: TypeScript
- Package manager: npm
- Test runner: Vitest
- Build: Vite with `tsc --noEmit`
- UI: Lit 3 custom elements, Tailwind 4 utilities, lucide icons
- CI: npm scripts for lint, format, build, and test

## Goal

Finish the HUD architecture migration by moving reusable HUD UI structure out of raw Tailwind layout markup and into canonical Lit web components.

## Problem Statement

The legacy `HUD_*` class-token modules have been removed, but many HUD layers still encode reusable UI structure directly in templates with raw Tailwind class strings. This keeps panel authors copying table rows, forms, toolbar buttons, event rows, stat grids, and surface layouts instead of composing the HUD from named elements with stable properties, slots, and events.

## Success Definition

The HUD kit exposes the reusable building blocks needed to construct new HUD panels without copying internal visual structure. Live panels use those components for reusable UI structure, while local Tailwind classes are limited to panel placement, responsive positioning, and one-off game-specific layout.

## Non-Goals

- Replacing Lit.
- Replacing Tailwind globally.
- Redesigning the HUD visual language.
- Changing gameplay behavior.
- Reworking non-HUD modal/product surfaces unless they directly block HUD composition.
- Removing every positioning class such as `fixed`, `top-*`, grid placement, or responsive visibility at layer boundaries.

## Constraints

- Preserve current HUD behavior and visual density.
- Keep the component library lean; add components only for repeated HUD structure.
- Prefer composition over inheritance.
- Keep Shadow DOM scoped styles for reusable HUD kit elements.
- Avoid introducing broad theme/config systems.
- Validate with `npx tsc --noEmit`, targeted `npx eslint`, `npx prettier --write`, and `git diff --check`.

## Assumptions

- `/hud-kit.html` and `HudPanelWorkbench.ts` remain the source-of-truth catalog for the current HUD kit.
- Layer placement classes are allowed to stay local when they are not reusable HUD UI primitives.
- Existing live panels should be migrated incrementally to reduce visual regression risk.

## Risk Posture

Medium. TypeScript risk is low, but visual regression risk is meaningful because compact HUD spacing, table density, and responsive placement are sensitive.

## Next Step

Complete. All planned waves are done and validation passed.
