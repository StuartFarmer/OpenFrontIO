# TASK-1.2: Lit Component Conventions

Status: done

## Goal

Define the conventions every HUD web component follows.

## Work

- Define naming by layer: atom, molecule, composite.
- Define property and event naming.
- Define when to use slots.
- Define styling rules for `static styles`, CSS custom properties, and parts.
- Define when `createRenderRoot() { return this; }` is allowed.

## Done

- Conventions are documented before implementation begins.

## Result

Conventions are documented in:

- `ARCHITECTURE.md`

Key decisions:

- The public HUD kit API is custom elements.
- Atoms, molecules, and composites compose through Lit templates.
- New reusable HUD components use Shadow DOM and `static styles`.
- Styling customization uses semantic properties, CSS custom properties, parts, and slots.
- New components do not expose arbitrary Tailwind class props.
- Events bubble and are composed.
