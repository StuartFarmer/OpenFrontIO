# Wave 3: Molecule Components

Status: done

## Objective

Build HUD controls and repeated row fragments from atoms.

## Tickets

- `TASK-3.1-pill-molecules.md`
- `TASK-3.2-slider-meter-molecules.md`
- `TASK-3.3-tab-segmented-molecules.md`
- `TASK-3.4-row-tooltip-molecules.md`

## Exit Criteria

- Molecules compose atom elements directly.
- Molecule events are stable and documented by usage.

## Execution Notes

- Added pill, segmented-control, build-item, and tooltip molecules.
- Added semantic slider events for range and blend changes.
- Updated HUD kit molecule examples to use direct custom element tags.

## Verification

- `npx tsc --noEmit`
- `npx eslint src/client/hud/ui src/client/hud/demo/HudPanelWorkbench.ts`
- `git diff --check`
- `/hud-kit.html` responded with HTTP 200 on the running dev server.
