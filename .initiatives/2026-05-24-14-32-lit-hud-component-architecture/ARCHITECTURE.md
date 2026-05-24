# HUD Lit Component Architecture Contract

Status: active

## Source Root

HUD implementation files live in:

- `src/client/hud/ui`
- `src/client/hud/demo`
- `src/client/hud/layers`

## Public API Rule

The public HUD kit API is custom elements.

Panel authors should compose UI with tags such as:

- `<hud-icon>`
- `<hud-label>`
- `<hud-number>`
- `<hud-button>`
- `<hud-icon-button>`
- `<hud-pill>`
- `<hud-meter>`
- `<hud-dual-range>`
- `<hud-blend-slider>`
- `<hud-attack-row>`

Class-token constants and render helper functions are compatibility code during migration. They are not the long-term public API.

## Component Layers

Atoms:

- Smallest reusable elements.
- Own their styles.
- Examples: icon, label, number, surface, button, input.

Molecules:

- Compose atoms into small controls or repeated row fragments.
- Examples: pill, meter, dual range, blend slider, segmented control, tooltip, build item.

Composites:

- Compose atoms and molecules into complete HUD panels or panel rows.
- Examples: attack row, attacks display, unit display, control panel sections, leaderboard table.

Compatibility:

- Existing `HUD_*` class constants.
- Existing `renderHud*` helpers.
- Existing light-DOM HUD layers that still depend on global Tailwind classes.

## Lit Component Rules

- Each reusable HUD element extends `LitElement`.
- Register each component with `@customElement("hud-*")`.
- Add `HTMLElementTagNameMap` entries for authored components when the file is stabilized.
- Prefer composition over inheritance.
- Use only a small shared base element for theme/style setup if it removes duplication.
- Do not create a large abstract base class with unused hooks.

## Properties

- Properties are semantic and typed.
- Use names like `tone`, `size`, `variant`, `value`, `selected`, `disabled`, `items`, `segments`, `start`, and `end`.
- Do not expose arbitrary internal Tailwind class props such as `contentClass`, `labelClass`, `valueClass`, or `inputClass` on new components.
- Object and array properties use `{ attribute: false }`.

## Events

- User changes dispatch `CustomEvent`.
- Events bubble and are composed.
- Event names describe the semantic action, not the internal input element.
- Prefer names like:
  - `range-change`
  - `blend-change`
  - `selection-change`
  - `action`

Event detail payloads should be minimal and typed.

## Slots

- Use slots when the consumer supplies content.
- Use named slots for clear regions such as `icon`, `label`, `value`, `action`, and `footer`.
- Do not require consumers to know internal wrapper class names.

## Styling

- Reusable HUD components put styles in `static styles`.
- Use Shadow DOM by default for reusable kit components.
- Use CSS custom properties for theme values that need to cross component boundaries.
- Use `part` names only when outside styling is intentionally supported.
- Tailwind utility classes may remain in compatibility files during migration.
- Do not inject arbitrary utility classes through component properties in new components.

## Shadow DOM

Allowed:

- New atoms and molecules use Shadow DOM.
- Existing live HUD layers may temporarily return `this` from `createRenderRoot()` while they depend on global page styles or legacy layout.

Not allowed:

- New reusable HUD kit components opting out of Shadow DOM without a documented integration reason.

## Export Boundary

Long-term public exports from `src/client/hud/ui` should be:

- Component modules.
- Component types.
- Explicit theme types or constants required by component APIs.

Compatibility exports should be isolated and named/documented as legacy during migration.

## Migration Rule

Migrate one layer at a time:

1. Add or correct the required atom.
2. Build the molecule from atoms.
3. Replace catalog usage with direct tags.
4. Replace live panel usage.
5. Remove the helper or token usage only after the live call sites are gone.
