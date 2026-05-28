# Initiative: HUD UI Migration Completion

## Stack
- Language: TypeScript
- Package manager: npm
- Test runner: Vitest
- Build: Vite + TypeScript (`npx tsc --noEmit`, `npx vite build --mode development`)
- UI: Lit web components, Tailwind utility classes, custom HUD primitives under `src/client/hud/ui`
- CI: local validation mirrors package scripts; repository has existing focused client tests

## Goal
Finish migrating remaining client UI surfaces away from ad hoc raw controls and bespoke styling toward the existing `hud-*` primitive system, preserving behavior while making the HUD kit the shared visual/composition layer across game and app UI.

## Problem Statement
The first migration pass converted visible HUD overlays and several shared controls, but raw `<button>`, `<input>`, `<table>`, and related bespoke UI structures remain across leaderboard, clan, lobby/setup, help/docs, and commerce/cosmetic surfaces. This keeps visual behavior inconsistent and makes regressions like oversized slotted images more likely.

## Success Definition
- Remaining interactive app chrome uses `hud-button`, `hud-icon-button`, `hud-input`, `hud-select`, `hud-toggle`, `hud-table`, `hud-list-row`, `hud-modal-*`, or a new HUD primitive where one is genuinely missing.
- Content media such as flags, map thumbnails, markdown images, cosmetics, and sprites remain content images where appropriate.
- Functionality is unchanged: existing click handlers, form events, sorting, selection, modal state, and routing behavior are preserved.
- Each wave has a focused validation path using formatting, typecheck, targeted tests, and development build.

## Non-Goals
- Rebuilding the visual design from scratch.
- Removing content images or brand/media assets.
- Changing gameplay, mechanics, server APIs, auth, ads, store logic, or clan behavior.
- Converting markdown article content into HUD atoms unless it is part of app chrome.

## Constraints
- Keep changes iterative and testable; do not wait until all surfaces are migrated to validate.
- Prefer existing HUD primitives; only add a new primitive when repeated UI cannot be represented cleanly with current atoms.
- Do not break existing custom element public APIs.
- Avoid broad rewrites in files where only a raw control conversion is required.

## Assumptions
- `src/client/hud/ui/HudComponents.ts` is the source of truth for shared primitives.
- Existing `ui-kit`/HUD catalog pages should demonstrate converted components as real repo components, not mock replacements.
- Raw table/input/button usage inside HUD primitive implementations is allowed.
- Raw images are allowed for content, thumbnails, flags, avatars, maps, markdown, and cosmetic previews.

## Risk Posture
Moderate. The migration touches many UI entry points, but most changes are mechanical composition replacements. Highest risk areas are lobby/game configuration and clan management because they combine form state, async calls, and conditional actions.

## Next Step
Execute the planned waves in `PLAN.md`, validating after each wave.
