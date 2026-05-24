# Deliverables

## D1: HUD Lit Architecture Contract

Output:

- A short architecture document for HUD components.
- Rules for naming, properties, events, slots, styles, and Shadow DOM usage.

Done when:

- Component authors know how to add an atom, molecule, or composite without inventing a new pattern.

## D2: Atom Component Layer

Output:

- Core atom custom elements for surfaces, text, numbers, icons, and buttons.

Done when:

- The HUD kit shows each atom directly as a custom element.
- Atoms own their styling.

## D3: Molecule Component Layer

Output:

- Reusable controls and small HUD structures built from atoms.

Done when:

- Pills, meters, sliders, segmented controls, tabs, tooltips, and list/table rows are direct web components.

## D4: Composite HUD Panels

Output:

- Complete HUD panels composed from atoms and molecules.

Done when:

- Attacks display, control panel, unit display, sidebar, leaderboard, and player/event panels are represented in the catalog.

## D5: Live HUD Migration

Output:

- Existing HUD layers migrated away from public class-token constants and render helpers.

Done when:

- Live panel code composes `<hud-*>` elements directly.

## D6: Cleanup And Validation

Output:

- Removed or isolated compatibility code.
- Passing validation.

Done when:

- TypeScript, lint, diff checks, and manual HUD kit review pass.
