# TASK-5.1: Helper Cleanup

Status: done

## Goal

Remove or isolate render helper functions after migration.

## Work

- Remove unused render helpers.
- Keep temporary helpers only if live migration is incomplete, and mark them clearly.

## Done

- The public kit API is custom elements, not render functions.

## Result

Removed unused helper functions:

- `renderHudDualRange`
- `renderHudBlendSlider`

Kept remaining helpers as compatibility-only because they still have live callers:

- `renderHudMaskIcon`
- `renderHudIconPill`
- `renderHudMeter`

Added compatibility comments to `HudControls.ts`.
