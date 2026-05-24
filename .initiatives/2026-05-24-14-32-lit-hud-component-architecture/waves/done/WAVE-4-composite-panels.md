# Wave 4: Composite Panels

Status: done

## Objective

Compose complete HUD panels from atoms and molecules.

## Tickets

- `TASK-4.1-attacks-display-composite.md`
- `TASK-4.2-control-panel-composite.md`
- `TASK-4.3-secondary-hud-composites.md`
- `TASK-4.4-hud-kit-composite-catalog.md`

## Exit Criteria

- Complete panel examples render below atoms and molecules in the HUD kit.
- Shared UI inside panels uses custom elements rather than copied class strings.

## Execution Notes

- Added `hud-attack-row`.
- Migrated live `AttacksDisplay.ts` attack rows to `hud-attack-row`.
- Migrated control panel ratio and blend controls to direct component usage.
- Migrated live `UnitDisplay.ts` build items to `hud-build-item`.
- Updated the HUD kit attack-row example to use the composite tag.

## Verification

- `npx tsc --noEmit`
- `npx eslint src/client/hud/ui src/client/hud/demo/HudPanelWorkbench.ts src/client/hud/layers/AttacksDisplay.ts src/client/hud/layers/ControlPanel.ts src/client/hud/layers/UnitDisplay.ts`
- `git diff --check`
- `/hud-kit.html` responded with HTTP 200 on the running dev server.
