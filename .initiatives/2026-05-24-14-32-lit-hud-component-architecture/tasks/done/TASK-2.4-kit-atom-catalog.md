# TASK-2.4: HUD Kit Atom Catalog

Status: done

## Goal

Show all atoms at the top of `/hud-kit.html`.

## Work

- Add catalog sections for surfaces, icons, labels, numbers, and buttons.
- Use direct custom element tags in the catalog.

## Done

- The catalog demonstrates the atom API without render helpers.

## Result

Updated the atom sections in `src/client/hud/demo/HudPanelWorkbench.ts` to use direct atom tags for surfaces, icons, labels, numbers, buttons, and icon buttons.

Validation:

- `npx tsc --noEmit`
- `git diff --check`
- `curl -s -I http://localhost:9001/hud-kit.html`
