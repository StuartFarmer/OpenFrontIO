# Deliverables

## D1: 1x1 Placeable Contract

**Outcome**: Farmland has a clear core model as a 1x1 placeable with validation, cost, disabled-unit compatibility, and no accidental upgrade behavior.
**Demo**:
`npm test -- tests/core/game/PlayerImpl.test.ts tests/core/configuration/ResourceCapacity.test.ts`
**Acceptance Checks**:

- [ ] Farmland can be validated and built only on valid owned land tiles.
- [ ] Farmland cannot be placed twice on the same tile.
- [ ] Farmland cost/resource handling is covered by unit/config tests.
      **Dependencies**: None.
      **Notes**: The first implementation may keep production effects minimal if gameplay balance is not yet decided.

## D2: Farmland Render And Hover Preview

**Outcome**: Farmland appears on the map as a 1x1 square/tile visual and existing hover feedback correctly shows valid/invalid placement.
**Demo**:
`npm run build-dev`
**Acceptance Checks**:

- [ ] Existing non-paint ghost previews still render normally.
- [ ] Farmland preview is visually tile-aligned and distinct from larger structures.
- [ ] Built farmland remains visible after placement and updates consistently.
      **Dependencies**: D1.
      **Notes**: Prefer renderer-native tile treatment before adding complex art.

## D3: Paint Placement Interaction

**Outcome**: Selecting a paintable build item enables brush cursor, hold-to-paint placement, stroke duplicate suppression, and right-click/Escape cancellation.
**Demo**:
`npm test -- tests/client`
**Acceptance Checks**:

- [ ] Left mouse down on a valid tile places farmland and movement over new valid tiles places more.
- [ ] Releasing the mouse ends only the current stroke, leaving paint mode selected.
- [ ] Right-click cancels paint mode without opening the radial menu on that same click.
- [ ] Normal camera drag and non-paint build placement still work.
      **Dependencies**: D1, D2.
      **Notes**: If there is no current client test harness for the controller, add narrow unit tests around the new placement controller/state helper.

## D4: Bottom Build UI Integration

**Outcome**: Farmland is discoverable and selectable from the new bottom building UI rather than the right-click build menu.
**Demo**:
`npm run build-dev`
**Acceptance Checks**:

- [ ] Farmland appears in the bottom building area with selected/disabled/affordability states.
- [ ] Selecting Farmland enters paint mode through the same command surface as other bottom build items.
- [ ] The old right-click build menu is not the primary entry point for Farmland.
      **Dependencies**: D3 and coordination with `.initiatives/2026-06-13-09-14-rts-bottom-build-bar`.
      **Notes**: This is intentionally the final functional integration step.

## D5: Verification And Regression Pass

**Outcome**: The feature is covered by targeted tests and a manual smoke pass across build, paint, cancel, and existing placement flows.
**Demo**:
`npm test`
**Acceptance Checks**:

- [ ] Core tests cover Farmland placement rules.
- [ ] Client/controller tests cover paint state transitions.
- [ ] Manual smoke notes confirm existing build, radial, drag, and cancel interactions.
      **Dependencies**: D1-D4.
      **Notes**: Expand test scope if the implementation introduces a new transport intent or renderer update shape.
