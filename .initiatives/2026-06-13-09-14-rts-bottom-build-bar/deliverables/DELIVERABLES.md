# Deliverables

## D1: Bottom Build Command Surface

**Outcome**: A persistent bottom HUD bar exposes existing buildable options during gameplay.
**Demo**:
`npm run build-dev`
**Acceptance Checks**:

- [ ] The bar is visible for an alive local player after spawn and hidden or disabled during spawn/dead states.
- [ ] The bar is populated from existing buildable metadata and respects disabled-unit config.
- [ ] The bar fits desktop and mobile HUD layouts without overlapping bottom control panels incoherently.
- [ ] Buttons use existing HUD primitives and show active/disabled states.
      **Dependencies**: None.
      **Notes**: Prefer a new focused component over mutating modal `BuildMenu`.

## D2: Ghost Placement Integration

**Outcome**: Selecting a bottom-bar building enters the existing ghost placement flow.
**Demo**:
`npm run test -- tests/client/controllers/BuildPreviewController.test.ts`
**Acceptance Checks**:

- [ ] Button selection sets `uiState.ghostStructure`.
- [ ] Click-to-place, Enter confirm, Escape cancel, and right-click cancel continue to work.
- [ ] Build and upgrade intents remain emitted only by existing placement validation paths.
      **Dependencies**: D1.
      **Notes**: Avoid direct build intent emission from the bar.

## D3: Context Menu Build Removal

**Outcome**: Right-click radial menu no longer opens a building submenu for construction.
**Demo**:
`npm run test -- tests/client/graphics/RadialMenuElements.test.ts`
**Acceptance Checks**:

- [ ] Owned-territory radial menu does not include the build submenu.
- [ ] Info/delete/alliance and non-owned attack/boat actions remain available as before.
      **Dependencies**: D1, D2.
      **Notes**: Do not remove the radial menu itself.

## D4: Existing Buildable Compatibility

**Outcome**: The new bar works with existing buildable types without requiring new unit definitions.
**Demo**:
`npm run test -- tests/client/hud/BuildBar.test.ts`
**Acceptance Checks**:

- [ ] The bar can render current structure buildables.
- [ ] The bar can render current attack buildables if the chosen UX includes them.
- [ ] No core unit, config, capacity, or renderer changes are required.
      **Dependencies**: D1, D2.
      **Notes**: Missing buildables are out of scope.

## D5: Verification And Documentation

**Outcome**: Tests and mechanics documentation reflect the new build surface.
**Demo**:
`npm run build-dev && npm run test`
**Acceptance Checks**:

- [ ] Relevant Vitest suites pass.
- [ ] Help/mechanics docs no longer describe construction as a right-click menu-only flow.
- [ ] Manual smoke notes cover desktop mouse and mobile/touch layout.
      **Dependencies**: D1-D4.
      **Notes**: Full visual automation is optional unless regressions appear.
