# Lit HUD Component Architecture

Status: complete
Created: 2026-05-24 14:32

## Goal

Rebuild the HUD kit around actual Lit web components so atoms, molecules, and complete HUD panels compose through custom elements with typed properties, events, slots, and scoped styles.

## Problem

The current HUD kit has useful visual work, but the architecture is not yet the clean Lit component model we want:

- Class-token constants are still the main composition API.
- Render helper functions hide the custom elements.
- Several components expose Tailwind class escape hatches instead of semantic properties.
- Many HUD layers opt out of Shadow DOM with `createRenderRoot() { return this; }`.
- The atom -> molecule -> composite tree is incomplete.

## Scope

Included:

- Analyze the existing HUD UI files and identify where the current implementation diverges from Lit best practices.
- Define a lean component architecture for HUD primitives, molecules, and panels.
- Plan the migration from constants/helpers to direct Lit custom elements.
- Preserve the current HUD visual direction while improving structure.

Excluded:

- Gameplay changes.
- New HUD features unrelated to component architecture.
- Replacing Lit.
- Replacing Tailwind globally.
- Full application redesign.

## Lit Principles To Follow

- A Lit component is a registered custom HTML element extending `LitElement`.
- Prefer component composition: data flows down through properties, user changes flow up through events.
- Use Shadow DOM by default for reusable HUD kit components.
- Put component styles in `static styles`.
- Use CSS custom properties, parts, slots, and semantic properties for customization instead of requiring consumers to pass internal utility classes.

## Definition Of Done

- HUD atoms and molecules are actual custom elements, not exported class strings.
- Complete HUD panels compose those elements directly.
- `/hud-kit.html` is the source of truth catalog and shows atoms first, then molecules, then complete panels.
- Live HUD layers no longer depend on public `HUD_*` class constants except through a temporary, documented migration boundary.
- Render helpers are removed or explicitly isolated as compatibility shims.
- New components have stable property/event contracts.
- Validation commands pass for the touched HUD files.
