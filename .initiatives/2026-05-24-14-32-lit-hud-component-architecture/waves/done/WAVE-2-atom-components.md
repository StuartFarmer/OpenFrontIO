# Wave 2: Atom Components

Status: done

## Objective

Create the smallest reusable HUD custom elements.

## Tickets

- `TASK-2.1-surface-layout-atoms.md`
- `TASK-2.2-icon-label-number-atoms.md`
- `TASK-2.3-button-atoms.md`
- `TASK-2.4-kit-atom-catalog.md`

## Exit Criteria

- Atoms render in `/hud-kit.html`.
- Atoms do not expose arbitrary internal class props.

## Execution Notes

- Added surface, header, body, icon, label, number, button, and icon-button atoms.
- Added typed tag map entries for HUD custom elements.
- Updated atom catalog samples to use direct custom element tags.

## Verification

- `npx tsc --noEmit`
- `git diff --check`
- `/hud-kit.html` responded with HTTP 200 on the running dev server.
