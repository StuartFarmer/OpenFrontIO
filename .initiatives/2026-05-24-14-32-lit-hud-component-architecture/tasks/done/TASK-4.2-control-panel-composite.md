# TASK-4.2: Control Panel Composite

Status: done

## Goal

Rebuild the control panel from HUD component molecules without losing fidelity.

## Work

- Replace local pill, slider, tab, segmented, input, and build item markup with components.
- Preserve existing icons and compact spacing.
- Keep behavior unchanged.

## Done

- The control panel reads as a composition of kit components.

## Result

Migrated low-risk control panel shared UI to direct component tags:

- Attack ratio display now uses `hud-pill`.
- Import/export blend controls now use direct `hud-blend-slider` tags and semantic `blend-change` events.

Existing metric meters and rate pills remain on compatibility helpers pending the cleanup wave because they still depend on legacy class escape hatches.
