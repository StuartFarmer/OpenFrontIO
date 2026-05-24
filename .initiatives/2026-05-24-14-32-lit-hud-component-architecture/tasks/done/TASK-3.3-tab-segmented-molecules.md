# TASK-3.3: Tab And Segmented Molecules

Status: done

## Goal

Create reusable tab and segmented-control molecules.

## Work

- Preserve icon+label combinations from the current control panel.
- Emit selection events.
- Support selected and disabled states only if currently used.

## Done

- Existing tab groups no longer need bespoke markup.

## Result

Added `hud-segmented-control` as a scoped Lit molecule. It accepts typed `items`, tracks the selected id through a property, and emits `selection-change` for user selection.
