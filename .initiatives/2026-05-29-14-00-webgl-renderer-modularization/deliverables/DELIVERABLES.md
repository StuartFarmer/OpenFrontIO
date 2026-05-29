# Deliverables

## D1: Renderer Surface Inventory

**Outcome**: A documented inventory of reusable renderer primitives and OpenFront-specific integration points.
**Demo**:
`npm run build-dev`
**Acceptance Checks**:

- [x] The inventory identifies the current WebGL facade, terrain pass, territory pass, camera, upload path, frame builder, and input overlay touchpoints.
- [x] Each reusable candidate has a current file owner and a migration note.
      **Dependencies**: None.
      **Notes**: This is a planning/analysis deliverable that implementation tickets can refine into source comments or docs.

## D2: Base Map Renderer Contract

**Outcome**: A minimal TypeScript contract for rendering terrain, ownership, camera state, terrain deltas, and tile-state deltas without OpenFront frame fields.
**Demo**:
`npm run build-dev`
**Acceptance Checks**:

- [x] The contract does not mention units, structures, railroads, nukes, alliances, names, or OpenFront `GameView`.
- [x] The contract can be implemented by the existing WebGL facade through an adapter.
      **Dependencies**: D1.
      **Notes**: Keep this contract small. Add extensions only when Foundation needs them.

## D3: OpenFront Compatibility Adapter

**Outcome**: Current OpenFront rendering behavior is preserved behind an OpenFront-named adapter path.
**Demo**:
`npm test`
**Acceptance Checks**:

- [ ] Existing OpenFront gameplay, HUD, replay, and sandbox renderer tests remain green.
- [ ] `WebGLFrameBuilder` and `uploadFrameData()` are clearly OpenFront compatibility paths or are wrapped by such a path.
      **Dependencies**: D1, D2.
      **Notes**: This is the safety net for deeper modularization.

## D4: Foundation WebGL Adapter MVP

**Outcome**: Foundation has a module-owned adapter plan and implementation path that uses the custom WebGL renderer for blank terrain, ownership, camera, and click-to-place.
**Demo**:
`npm run build-dev`
**Acceptance Checks**:

- [ ] Foundation can drive terrain and ownership buffers without constructing OpenFront client `GameView`.
- [ ] Foundation click-to-place can translate screen position to tile ref and update ownership state.
- [ ] No population/food simulation is required for this deliverable.
      **Dependencies**: D2, D3.
      **Notes**: This deliverable belongs with the Foundation MVP initiative for actual route/module wiring.

## D5: Pass Group Migration Path

**Outcome**: A staged plan for separating base-map passes from OpenFront-only passes without breaking OpenFront rendering.
**Demo**:
`npm run build-dev`
**Acceptance Checks**:

- [ ] The base-map profile includes terrain, ownership/territory, camera, and optional owner hit testing.
- [ ] OpenFront-only passes are categorized into optional groups such as structures, units, railroads, FX, names, nukes, and radial UI.
- [ ] The plan explains how to test pass ordering and shared texture dependencies.
      **Dependencies**: D1, D2, D3.
      **Notes**: This should avoid a public feature-boolean matrix for game modules.
