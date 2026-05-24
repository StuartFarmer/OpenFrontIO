# Wave 5: Cleanup And Validation

Status: done

## Objective

Remove compatibility leftovers and validate the HUD kit.

## Tickets

- `TASK-5.1-helper-cleanup.md`
- `TASK-5.2-token-cleanup.md`
- `TASK-5.3-validation.md`

## Exit Criteria

- Compatibility code is removed or isolated.
- Validation passes.
- `/hud-kit.html` is the usable source of truth.

## Execution Notes

- Removed unused render helpers.
- Marked remaining helper and token exports as compatibility boundaries.
- Preserved live compatibility where there are still callers.

## Verification

- `npx tsc --noEmit`
- `npx eslint src/client/hud/ui src/client/hud/demo/HudPanelWorkbench.ts src/client/hud/layers/AttacksDisplay.ts src/client/hud/layers/ControlPanel.ts src/client/hud/layers/UnitDisplay.ts src/client/hud/layers/PlayerInfoOverlay.ts`
- `git diff --check`
- `/hud-kit.html` responded with HTTP 200 on the running dev server.
