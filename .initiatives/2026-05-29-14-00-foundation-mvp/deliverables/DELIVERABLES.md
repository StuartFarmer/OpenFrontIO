# Deliverables

## D1: Foundation Module Skeleton
**Outcome**: `src/games/foundation` contains the module entrypoint, local types, and clear boundaries for domain, runtime, client, and renderer adapter code.
**Demo**:
`npm run build-dev`
**Acceptance Checks**:
- [ ] Foundation code lives under `src/games/foundation` except for minimal route/test integration.
- [ ] OpenFront startup, nation, unit, alliance, build, warship, and win code are not imported into Foundation domain/runtime files.
- [ ] Public Foundation entrypoints are small and documented through names/types rather than a broad dependency grab.
**Dependencies**: None.
**Notes**: This establishes the module home before runtime and rendering work.

## D2: Semantic-Free Foundation Map And Placement Domain
**Outcome**: Foundation can generate a blank grass map, address tiles, expose raw terrain/state buffers, and claim a fixed radius around a clicked tile for one plain `Player` record.
**Demo**:
`npx vitest run tests/games/foundation/map.test.ts tests/games/foundation/placement.test.ts`
**Acceptance Checks**:
- [ ] Base map API exposes dimensions, ref/coordinate conversion, `terrainBuffer()`, and `stateBuffer()`.
- [ ] Terrain semantics live in a separate Foundation terrain query/adaptor.
- [ ] Fixed-radius claims are deterministic, bounded to the map, and update tile owner state.
- [ ] No OpenFront `GameMap`, `Game`, `Player`, or `Unit` interface is required by Foundation domain code.
**Dependencies**: D1.
**Notes**: The grass byte may use the renderer-compatible low-level land bit while keeping semantics outside the base map.

## D3: Single-Player Foundation Runtime
**Outcome**: Foundation has a local single-player runtime that accepts click placement commands and emits Foundation-native update envelopes.
**Demo**:
`npx vitest run tests/games/foundation/runtime.test.ts`
**Acceptance Checks**:
- [ ] Runtime command payloads are Foundation-owned.
- [ ] Updates separate map/tile deltas from module events.
- [ ] First loop proves placement only; population/food ticking is absent.
- [ ] Runtime shape leaves a clear path to worker/multiplayer transport.
**Dependencies**: D1, D2.
**Notes**: This is intentionally not a full shared protocol migration.

## D4: Custom WebGL Foundation Adapter
**Outcome**: Foundation renders the blank map and owned tile radius through the existing custom WebGL renderer via a minimal adapter.
**Demo**:
`npm run build-dev`
**Acceptance Checks**:
- [ ] Adapter constructs/owns the WebGL canvas and `src/client/render/gl` facade usage.
- [ ] Adapter registers a minimal player palette and uploads tile state changes.
- [ ] OpenFront frame/HUD compatibility types do not leak into Foundation domain/runtime types.
- [ ] Adapter cleanup removes canvas/listeners without affecting OpenFront surfaces.
**Dependencies**: D2, D3.
**Notes**: Visual verification should confirm grass terrain and colored owned radius after placement.

## D5: Foundation Route And Debug Panel
**Outcome**: A Foundation route mounts the prototype and a small debug panel without the OpenFront HUD shell.
**Demo**:
`npm run start:client`, then open `/foundation` or the chosen Foundation route.
**Acceptance Checks**:
- [ ] Route does not call `renderSandboxShell()`.
- [ ] Debug panel shows placement status, selected tile, claimed tile count, map size, and tick/update count.
- [ ] Click-to-place updates both debug state and WebGL ownership rendering.
- [ ] Existing OpenFront routes and sandboxes continue to build.
**Dependencies**: D3, D4.
**Notes**: Route choice should be explicit in the implementation ticket.

## D6: Foundation MVP Test Coverage
**Outcome**: Unit and component tests cover the MVP behavior and protect the module boundary.
**Demo**:
`npx vitest run tests/games/foundation tests/client/games/foundation`
**Acceptance Checks**:
- [ ] Map generation and semantic query tests exist.
- [ ] Placement/domain tests exist.
- [ ] Runtime command/update tests exist.
- [ ] Debug panel/component smoke tests exist.
- [ ] Renderer adapter has input/lifecycle coverage or documented manual verification where WebGL2 cannot run reliably.
**Dependencies**: D1-D5.
**Notes**: Full browser screenshot testing can be deferred unless the execution environment already supports it reliably.
