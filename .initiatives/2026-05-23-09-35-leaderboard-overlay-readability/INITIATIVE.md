# Initiative: Leaderboard Overlay Readability

## Stack
- Language: TypeScript, HTML, CSS, Go in `map-generator`
- Package manager: npm
- Test runner: Vitest
- Build: Vite with `tsc --noEmit`
- UI: Lit custom elements using light DOM and Tailwind CSS utility classes
- CI: GitHub Actions in `.github/workflows/ci.yml`

## Goal

Analyze how to adjust the in-game leaderboard overlay so it is less rounded, more compact, and easier to scan with monospace typography and consistent numeric spacing.

## Problem Statement

The current leaderboard overlay reads as a rounded, spacious HUD card. Its rows and columns are serviceable for casual play, but the combination of proportional text, centered numeric columns, relatively loose vertical padding, and rounded containers makes it harder to compare ranks, percentages, gold, and troop values at a glance. This task should become the foundation for a broader UI overlay modification, so the recommended direction needs to be reusable across related overlay tables.

## Success Definition

The analysis identifies the specific overlay files, the styling choices that currently reduce scanability, and the safest code-level adjustment path for a compact analytical leaderboard treatment.

## Non-Goals
- Implementing the UI changes in this analysis pass.
- Redesigning the leaderboard modal pages.
- Changing leaderboard sorting, data collection, or update cadence.
- Reworking the entire HUD layout system.

## Constraints
- Preserve the existing Lit light-DOM plus Tailwind approach unless a later implementation proves it insufficient.
- Keep changes scoped to the in-game HUD overlay first.
- Account for both solo player leaderboard and team leaderboard overlays, because they can appear together.
- Avoid shrinking tap targets so far that mobile use becomes unreliable.

## Assumptions
- "Leaderboard UI element" primarily means the in-game overlay rendered by `<leader-board>`, not the account/ranked leaderboard modal.
- "Monospacing" means both a monospace font family and tabular numeric alignment for score-like values.
- This is a visual/readability foundation; behavior should remain unchanged in the first implementation.

## Risk Posture

Low to medium. The change is mostly styling, but it touches always-visible gameplay HUD surfaces. The main risks are mobile overflow, translation truncation, and mismatch between the player and team leaderboard tables.

## Next Step

Run planning for this initiative.
