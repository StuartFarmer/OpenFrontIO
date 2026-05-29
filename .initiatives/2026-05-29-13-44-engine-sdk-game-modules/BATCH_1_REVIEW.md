# Batch 1 Review

**Branch**: `engine-sdk-batch-1`
**Status**: Batch 1 implementation complete; ready for review before Batch 2.

## Completed Lanes

- OpenFront runtime seam:
  - Added `src/core/modules/GameModuleRuntime.ts`.
  - Added `src/games/openfront/OpenFrontModule.ts`.
  - Added `src/games/registry.ts`.
  - Added `tests/games/registry.test.ts`.
  - Completed OpenFront W1 tickets and moved W1 wave to done.
- Generic protocol baseline:
  - Added generic protocol types, Zod schemas, transferable collection helpers, and focused protocol tests.
  - `TurnEnvelope`, start/update/error envelopes carry `moduleId` where applicable.
  - Completed Generic Protocol W0 tickets and wave.
- Foundation map/domain groundwork:
  - Added `src/games/foundation` skeleton.
  - Added semantic-free Foundation map primitive, all-grass map generation, module-owned terrain query, `Player`, and radius-10 placement logic.
  - Added Foundation map and placement tests.
  - Completed Foundation W1 tickets and wave.
- Renderer inventory:
  - Completed W1 renderer surface inventory, base map render contract, and test strategy docs.
  - Confirmed the first Foundation renderer path should be a thin adapter over existing custom WebGL2 terrain/ownership/camera/click surfaces.

## Validation

- `npx vitest run tests/games/registry.test.ts tests/core/protocol tests/games/foundation/map.test.ts tests/games/foundation/placement.test.ts`
  - Passed: 4 files, 16 tests.
- `npx tsc --noEmit`
  - Passed.
- `npm run build-dev`
  - Passed. Vite emitted the existing large chunk warning.

## Stop-Gate Review Questions

- Does `GameModuleRuntime` expose lifecycle seams without encoding OpenFront features?
- Are generic protocol envelopes using `moduleId` and Zod while keeping module payloads unknown/module-owned?
- Does Foundation W1 avoid importing OpenFront gameplay/domain types?
- Does renderer W1 keep Foundation on the custom WebGL path while preserving OpenFront visual parity as the baseline?
- Are there any scattered `if moduleId === "foundation"` or feature-flag abstractions? None were introduced in Batch 1 source changes.

## Next Batch After Review

Proceed to Batch 2 only after review:

- OpenFront W2 server runtime wrapper.
- OpenFront W3 client runtime/HUD wrapper.
- Generic Protocol W1 OpenFront bridge adapters.

Do not start Foundation route/client wiring, renderer adapter implementation, or multiplayer server work until Batch 2 has passed its review gate.
