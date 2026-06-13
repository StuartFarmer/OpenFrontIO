# Deliverables

## D1: Explicit Front Control Command Contract

**Outcome**: Foundation grow commands can represent broad click pushes and focused drag pushes deterministically.
**Demo**:
`npm test -- tests/games/foundation/runtime.test.ts`
**Acceptance Checks**:

- [ ] `foundation.grow_territory` accepts normalized front mode/focus fields with safe defaults.
- [ ] Runtime behavior is testable without DOM pointer events.
      **Dependencies**: None.
      **Notes**: Preserve command compatibility for callers that only pass `targetTileRef` and `troopRatio`.

## D2: Uniform Click Expansion

**Outcome**: Plain click after placement uses equal border troop shares, matching OpenFront-style broad pressure from all sides.
**Demo**:
`npm test -- tests/games/foundation/runtime.test.ts tests/games/foundation/wilderness_elevation.test.ts`
**Acceptance Checks**:

- [ ] Plain click no longer uses target distance to tighten the front.
- [ ] Existing terrain speed, attrition, and front capacity behavior remain intact.
      **Dependencies**: D1.
      **Notes**: Target tile should still identify direction/event intent where needed.

## D3: Drag-Based Focused Expansion

**Outcome**: Click-drag from owned territory dispatches a focused front whose concentration scales smoothly with drag distance.
**Demo**:
`npm test -- tests/games/foundation/client/FoundationPage.test.ts tests/games/foundation/runtime.test.ts`
**Acceptance Checks**:

- [ ] Drag start inside owned territory enters attack-drag mode.
- [ ] Drag focus is sigmoid-smoothed, normalized, and capped at max distance.
- [ ] Non-attack gestures preserve expected placement/build/pan behavior.
      **Dependencies**: D1, D2.
      **Notes**: The client computes normalized focus; runtime applies it.

## D4: Preview and Tuning Alignment

**Outcome**: Heat/vector previews and mechanic descriptions explain the new broad-click and focused-drag semantics.
**Demo**:
`npm test -- tests/games/foundation/client/FoundationPage.test.ts tests/games/foundation/client/FoundationTuningPanel.test.ts`
**Acceptance Checks**:

- [ ] Hover/click preview does not imply distance-click concentration.
- [ ] Drag preview reflects focused concentration.
- [ ] `wildernessDistanceFocus` is described as maximum concentration sharpness.
      **Dependencies**: D2, D3.
      **Notes**: Prefer shared calculation helpers where feasible to reduce preview/runtime drift.

## D5: Validation Pass

**Outcome**: Focused and broad expansion behavior is covered by targeted tests and a stack-appropriate build check.
**Demo**:
`npm run build-dev`
**Acceptance Checks**:

- [ ] Runtime, client, and tuning tests pass.
- [ ] TypeScript build passes.
      **Dependencies**: D1, D2, D3, D4.
      **Notes**: Use narrower Vitest commands during development, then run build-dev before completion.
