# Analysis Report

## Summary

The current HUD work has moved in the right direction visually, and there are now real Lit elements in `src/client/hud/ui/HudComponents.ts`. The remaining issue is architectural: the rest of the HUD still treats exported class-name constants and render helper functions as the public UI kit. That prevents the kit from becoming a clean, composable Lit component tree.

The correct direction is not a large inheritance hierarchy. Lit's own model favors custom elements plus composition. We should use a small base element only for shared theme/style setup, then build atom components, molecule components, and panel composites from those elements.

## Findings

### 1. Class-token files are still the primary UI API

Evidence:

- `src/client/hud/ui/HudPrimitives.ts`
- `src/client/hud/ui/HudMolecules.ts`
- `src/client/hud/ui/HudComposites.ts`
- `src/client/hud/demo/HudPanelWorkbench.ts`
- `src/client/hud/layers/ControlPanel.ts`

These files still export and consume `HUD_*` class constants as if they are the HUD kit. This gives us reusable class names, but not reusable components with properties, events, slots, lifecycle, or encapsulated behavior.

Impact:

- Future HUD panels still copy markup and class combinations.
- Consumers need to know internal layout details.
- Composition is string-based instead of component-based.

Recommendation:

- Demote class tokens to internal implementation details.
- Expose custom elements as the public API.
- Keep only a small theme/token layer where it directly supports component styling.

### 2. Render helper functions obscure the custom elements

Evidence:

- `src/client/hud/ui/HudControls.ts`
- Imports such as `renderHudBlendSlider`, `renderHudMeter`, and `renderHudDualRange` in HUD layers and demos.

The helper functions return Lit templates that wrap custom elements. This made migration convenient, but it keeps the public API as functions rather than tags.

Impact:

- The component tree is harder to inspect.
- Event contracts are hidden behind callbacks.
- The kit still feels like a rendering utility package.

Recommendation:

- Use direct component tags in panels and demos.
- Remove helpers once the call sites are migrated.
- If a helper is needed temporarily, mark it as compatibility-only.

### 3. Several components leak styling through class properties

Evidence:

- `contentClass`, `valueClass`, `labelClass`, and `inputClass` in `src/client/hud/ui/HudComponents.ts`.

Those properties keep Tailwind utility classes in the consumer API. That makes components less encapsulated and forces consumers to know internal DOM structure.

Impact:

- Styling remains ad hoc.
- Components are hard to standardize.
- A future panel author can accidentally break layout with class strings.

Recommendation:

- Replace class escape hatches with semantic properties such as `variant`, `size`, `tone`, `selected`, and `disabled`.
- Use CSS custom properties or `part` names where outside styling is truly needed.

### 4. Shadow DOM use is inconsistent

Evidence:

- Many live HUD layers override `createRenderRoot()` and return `this`.
- `HudElement` injects the full `styles.css?inline` bundle with `unsafeCSS`.

Lit uses Shadow DOM by default for DOM and style encapsulation. Returning `this` is valid, but Lit documents it as generally not recommended because it gives up DOM and style scoping.

Impact:

- Global CSS remains a hidden dependency.
- New components can accidentally rely on styles outside their boundary.
- The architecture is not reliably reusable outside this exact page context.

Recommendation:

- Use Shadow DOM for new HUD kit components.
- Keep light DOM only where integration with existing HUD layers requires it, and document those cases.
- Move reusable component styling into `static styles`.
- Use CSS custom properties for theming.

### 5. The atom/molecule/composite tree is incomplete

Evidence:

- Existing custom elements include `hud-mask-icon`, `hud-icon-pill`, `hud-meter`, `hud-dual-range`, and `hud-blend-slider`.
- Missing actual component counterparts include panel surfaces, headers, labels, numbers, buttons, segmented controls, tabs, attack rows, unit displays, build items, tooltips, and table rows.

Impact:

- The kit cannot yet build arbitrary new HUD panels from standardized pieces.
- Live panels still need local markup and constants.

Recommendation:

- Build the missing atoms first.
- Build molecules from those atoms.
- Build complete panels from molecules.
- Show each layer in `/hud-kit.html`.

### 6. Events and properties need explicit contracts

Evidence:

- Custom events exist, but helpers still convert events into callback parameters.
- Array/object properties are used internally, but the public component contract is not documented in the code or catalog.

Impact:

- Panel authors do not have a clear API.
- Test boundaries are unclear.

Recommendation:

- Define typed properties for each component.
- Dispatch stable, bubbling, composed events for user changes.
- Prefer names like `range-change`, `blend-change`, `selection-change`, and `action`.

## Conclusion

The fix is a staged migration, not a rewrite. Keep the current visual system, but move the reusable surface area from constants and helper functions into actual Lit custom elements. The component hierarchy should be composition-first, with a minimal shared base for theme/style behavior only.

## Reference Sources

- Lit defining components: https://lit.dev/docs/components/defining/
- Lit Shadow DOM guidance: https://lit.dev/docs/components/shadow-dom/
- Lit styling guidance: https://lit.dev/docs/components/styles/
- Lit component composition guidance: https://lit.dev/docs/v2/composition/component-composition/
