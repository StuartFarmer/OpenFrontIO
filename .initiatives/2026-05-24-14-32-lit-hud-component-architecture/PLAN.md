# Implementation Plan

## Strategy

Make the HUD kit real Lit components in small layers:

1. Define the component contract.
2. Build missing atoms.
3. Build molecules from atoms.
4. Build complete panel composites from molecules.
5. Migrate live HUD layers away from class constants and render helpers.
6. Clean up compatibility code.

This avoids a broad rewrite while still correcting the core architecture.

## Wave 1: Architecture Contract

Goal: Decide the rules before adding or rewriting components.

Tasks:

- Audit current HUD public APIs.
- Define the Lit component conventions.
- Define the allowed styling mechanisms.
- Mark constants/helpers as compatibility-only.

Acceptance:

- There is one documented architecture contract.
- New HUD components have a clear naming, property, event, slot, and style convention.
- The team can tell whether a file belongs to atoms, molecules, composites, or compatibility.

## Wave 2: Atom Components

Goal: Create the smallest reusable HUD building blocks as custom elements.

Tasks:

- Implement surface/panel/header/body atoms.
- Implement icon, label, and fixed-width number atoms.
- Implement button and icon-button atoms.
- Update `/hud-kit.html` atom sections to use direct custom elements.

Acceptance:

- Atoms do not require consumers to pass Tailwind class strings.
- Atom styles live in component `static styles`.
- Atom examples render in the HUD kit.

## Wave 3: Molecule Components

Goal: Build reusable HUD controls and row fragments from atoms.

Tasks:

- Implement pill molecules.
- Implement meter, dual range, and blend slider molecules with semantic APIs.
- Implement segmented controls and tab groups.
- Implement tooltip, build item, and table/list row molecules.

Acceptance:

- Molecules compose atoms directly.
- Molecule events bubble and are composed.
- Existing helper wrappers are no longer needed by the catalog.

## Wave 4: Composite Panels

Goal: Rebuild complete HUD panels from the component tree.

Tasks:

- Implement attack row and attacks display composites.
- Migrate the control panel display to component composition.
- Migrate unit display, player info, right sidebar, leaderboard, and event displays where needed.
- Update the HUD kit to show complete panels below atoms and molecules.

Acceptance:

- Complete panels visibly match the current HUD direction.
- Panels use direct `<hud-*>` elements for shared UI.
- The HUD kit remains the source of truth catalog.

## Wave 5: Cleanup And Validation

Goal: Remove the architectural leftovers after migration.

Tasks:

- Remove or isolate render helper functions.
- Remove public usage of `HUD_*` constants from live HUD layers.
- Keep any remaining token files internal and documented.
- Validate TypeScript, lint, formatting, and manual HUD kit rendering.

Acceptance:

- No live HUD layer imports public class-token constants except documented compatibility boundaries.
- No migrated component accepts arbitrary internal class props.
- No new reusable HUD component opts out of Shadow DOM without a documented reason.
- Validation commands pass.

## Validation Commands

Run the relevant subset during implementation:

```bash
npx tsc --noEmit
npx eslint src/client/hud/ui src/client/hud/demo src/client/hud/layers
git diff --check
npm run start:client
```

Manual validation:

- Open `/hud-kit.html`.
- Confirm atoms render first.
- Confirm molecules render next.
- Confirm complete HUD panels render last.
- Confirm sliders, buttons, tabs, attack rows, and unit displays preserve expected behavior.
