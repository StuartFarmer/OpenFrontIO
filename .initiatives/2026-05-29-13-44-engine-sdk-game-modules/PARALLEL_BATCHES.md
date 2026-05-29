# Parallel Execution Batches

This document defines the safe execution batches for splitting the engine/module work across parallel agents without creating avoidable merge churn or architectural drift.

## Batch 0: Alignment And Naming

**Purpose**: Lock the shared names and boundaries before implementation.

**Parallel lanes**:
- Lane A: Confirm `GameModuleRuntime` as the top-level module contract name.
- Lane B: Confirm generic protocol names use `moduleId` and Zod schemas.
- Lane C: Confirm Foundation starts under `src/games/foundation` and OpenFront remains the default module.

**Stop and review when**:
- `GameModuleRuntime` shape is written down in the OpenFront wrapping initiative.
- No docs still describe capability booleans as the default multiplayer abstraction.
- No docs still require re-export shims for moved files.

**Do not continue if**:
- The module contract name differs across initiatives.
- Protocol work and module runtime work define competing registries.

## Batch 1: Module Runtime Keystone

**Purpose**: Establish the first real module seam without changing OpenFront behavior.

**Primary initiative**:
- `.initiatives/2026-05-29-14-00-openfront-module-wrapping/`

**Parallel lanes**:
- Lane A: OpenFront W1 registry and `GameModuleRuntime` contract.
- Lane B: Generic Protocol W0 envelope baseline, coordinated with the runtime contract.
- Lane C: Foundation W1 domain/map/placement in new files only.
- Lane D: Renderer W1 inventory and contract boundary documentation only.

**Allowed work**:
- Add module registry and default `openfront` registration.
- Add Zod-backed generic envelope types beside current OpenFront schemas.
- Add Foundation all-grass map primitive and placement tests without route/client integration.
- Inventory current WebGL render inputs and identify shared base visual contracts.

**Blocked work**:
- Do not wire Foundation into route/client startup yet.
- Do not move large OpenFront file groups before the registry seam is reviewed.
- Do not touch multiplayer server lifecycle yet.
- Do not introduce capability booleans for core services.

**Stop and review when**:
- OpenFront still runs as the default module through the registry.
- Generic protocol baseline compiles without replacing existing OpenFront messages.
- Foundation map/placement tests pass in isolation.
- Renderer inventory identifies the minimal shared terrain/ownership/camera path.

**Review questions**:
- Does `GameModuleRuntime` own enough surface to prevent feature flags?
- Did any lane add scattered `if moduleId === ...` branches outside a boundary lookup?
- Did any new Foundation code import OpenFront gameplay/domain types?

## Batch 2: OpenFront Wrapping And Bridge Adapters

**Purpose**: Put existing OpenFront server/client behavior behind the module runtime while keeping compatibility stable.

**Primary initiatives**:
- `.initiatives/2026-05-29-14-00-openfront-module-wrapping/`
- `.initiatives/2026-05-29-14-00-generic-protocol-update-envelope/`

**Parallel lanes after Batch 1 review**:
- Lane A: OpenFront W2 server runtime wrapper.
- Lane B: OpenFront W3 client runtime/HUD wrapper.
- Lane C: Generic Protocol W1 OpenFront bridge adapters.

**Allowed work**:
- Wrap `GameRunner` creation through OpenFront runtime ownership.
- Wrap current client mount/HUD/input/WebGL startup through OpenFront runtime ownership.
- Add OpenFront adapters from existing messages to generic envelopes.
- Move files only if all imports and references are updated directly in the same change.

**Blocked work**:
- No re-export shims.
- No Foundation route.
- No renderer pass extraction beyond what OpenFront wrapping requires.
- No multiplayer server/lobby rewrite.

**Stop and review when**:
- OpenFront server, client, local single-player, and worker tests remain green.
- Current OpenFront HUD and WebGL view behave unchanged.
- Generic envelope bridge preserves OpenFront payload meaning.
- Import paths are clean after any moves.

**Review questions**:
- Is OpenFront now one implementation of `GameModuleRuntime`, not the implicit engine?
- Are current OpenFront schemas/events clearly OpenFront-owned?
- Can Foundation use the same runtime/protocol seam without inheriting OpenFront HUD or gameplay?

## Batch 3: Foundation Vertical Slice

**Purpose**: Produce the first visible Foundation loop: empty grass map, click-to-place, fixed radius ownership, and rendering.

**Primary initiatives**:
- `.initiatives/2026-05-29-14-00-foundation-mvp/`
- `.initiatives/2026-05-29-14-00-webgl-renderer-modularization/`

**Parallel lanes after Batch 2 review**:
- Lane A: Foundation W2 runtime and update shape.
- Lane B: Renderer W2 OpenFront compatibility adapter.
- Lane C: Renderer W3 Foundation minimal adapter.
- Lane D: Foundation W3 client/input integration after renderer adapter shape is stable.

**Allowed work**:
- Add Foundation runtime for placement and ownership updates.
- Use the custom WebGL path through a thin adapter.
- Render 256x256 all-grass terrain and ownership overlay.
- Add click-to-place with radius `10`.
- Keep the debug panel limited to real values that exist.

**Blocked work**:
- No population/food simulation yet unless placement/rendering is already reviewed.
- No placeholder UI fields.
- No alliances, build menus, warships, non-food resources, or OpenFront mechanics.
- No central-server multiplayer enablement yet.

**Stop and review when**:
- `/foundation` shows the intended map view.
- Clicking places a player/nation and renders the claim radius.
- OpenFront rendering remains visually and behaviorally unchanged.
- Foundation does not depend on OpenFront gameplay/domain classes.

**Review questions**:
- Is Foundation proving the reusable core rather than rebuilding OpenFront?
- Are shared visuals truly shared, with Foundation/OpenFront parity where they overlap?
- Is the renderer adapter thin enough to later extract a cleaner base renderer?

## Batch 4: Protocol And Worker Integration

**Purpose**: Move intent/update transport toward the generic envelope after Foundation and OpenFront both have runtime boundaries.

**Primary initiative**:
- `.initiatives/2026-05-29-14-00-generic-protocol-update-envelope/`

**Parallel lanes after Batch 3 review**:
- Lane A: Generic Protocol W2 worker update transport.
- Lane B: Generic Protocol W3 intent and turn transport.

**Allowed work**:
- Carry module-owned update payloads through worker/client boundaries.
- Carry module-owned intent payloads through local transport and turn records.
- Keep OpenFront bridge behavior unchanged.
- Keep Foundation local transport aligned with remote message shapes.

**Blocked work**:
- Do not migrate replay/archive persistence yet.
- Do not change central server lobby lifecycle yet.
- Do not add module-specific branches inside shared transport beyond registry dispatch.

**Stop and review when**:
- OpenFront worker update parity still passes.
- Foundation local path uses generic envelopes.
- OpenFront legacy payloads bridge cleanly.
- The next multiplayer initiative has stable contracts to build on.

## Batch 5: Multiplayer Service Completion

**Purpose**: Make registered modules use the same central-server multiplayer services by default.

**Primary initiative**:
- `.initiatives/2026-05-29-14-00-multiplayer-module-compatibility/`

**Parallel lanes after Batch 4 review**:
- Lane A: Multiplayer W1 protocol envelope scaffold, if any remaining work exists after the generic protocol initiative.
- Lane B: Multiplayer W2 local Foundation turn path.
- Lane C: Multiplayer W3 server/lobby runtime integration after W1/W2.
- Lane D: Multiplayer W5 rejoin/hash/archive/end-state records after server path stabilizes.

**Allowed work**:
- Route public/private lobby creation through `GameModuleRuntime`.
- Use default services for remote multiplayer, rejoin, replay, archive, hash/desync, and winner/end-state handling.
- Implement minimal Foundation payloads where Foundation has no rich semantics yet.

**Blocked work**:
- No permanent OpenFront-only public lobby assumptions.
- No capability booleans for default services unless a concrete exception is identified and reviewed.
- No Foundation remote/public exposure that bypasses the runtime service path.

**Stop and review when**:
- OpenFront multiplayer behavior is preserved.
- Foundation can use the same central-server service path with minimal payloads.
- Rejoin, hash/desync, replay/archive, and end-state behavior travel through module-owned schemas.
- Regression tests cover invalid messages, rate limits, turn ordering, worker batching, and OpenFront compatibility.

## Batch 6: Feature Iteration

**Purpose**: Begin game-design iteration on Foundation after the reusable core is proven.

**Parallel lanes**:
- Lane A: Foundation population growth.
- Lane B: Foundation food model.
- Lane C: Foundation observability/debug readouts for real metrics.
- Lane D: Additional renderer polish that preserves OpenFront parity.

**Blocked work**:
- Do not add broad OpenFront mechanics by default.
- Do not add generic ECS/entity-component storage until a concrete feature needs it.
- Do not expand UI with placeholder controls.

**Stop and review when**:
- Foundation remains a minimal, isolated game implementation.
- New mechanics are module-owned and do not leak into the engine.
- The engine still looks like an SDK rather than a second hardcoded game.
