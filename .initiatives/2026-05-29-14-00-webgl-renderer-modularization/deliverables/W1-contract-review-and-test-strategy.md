# W1 Contract Review And Test Strategy

## Review Result

The proposed base-map contract is small enough for Foundation's first visible
loop and can be adapted to the current custom WebGL renderer. It includes only:

- terrain bytes and terrain deltas;
- tile-state buffer and tile-state deltas;
- owner palette entries;
- camera state/fit/resize;
- screen-to-world and screen-to-tile conversion;
- owner lookup by tile.

It intentionally excludes units, structures, railroads, trails as gameplay
semantics, names, alliances, relation matrices, nukes, SAM radius, conquest
popups, radial menu, spawn overlay, OpenFront `GameView`, and OpenFront
`FrameData`.

## Existing Regression Coverage To Preserve

| Risk                                   | Existing tests / validation                                                                     | Why it matters                                                                                                      |
| -------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| OpenFront tile buffer ABI              | `tests/client/view/GameView.test.ts:321-399`; `tests/core/game/GameMap.tileStateBuffer.test.ts` | Verifies `Uint16Array` tile-state shape, low owner bits, stable frame data object, full-upload and delta semantics. |
| Input event routing                    | `tests/InputHandler.test.ts`                                                                    | Protects the existing input overlay path used by OpenFront while Foundation develops a thinner click adapter.       |
| Warship selection renderer integration | `tests/client/controllers/WarshipSelectionController.test.ts`                                   | Ensures OpenFront-only selection surface remains adapter-owned.                                                     |
| Radial menu behavior                   | `tests/client/graphics/RadialMenuElements.test.ts` and `tests/radialMenuElements.test.ts`       | Keeps radial menu out of base contract while preserving OpenFront behavior.                                         |
| Frame-derived overlays                 | `tests/client/render/frame/derive/*.test.ts`                                                    | Protects OpenFront-specific derived fields such as player status and rail connectivity.                             |
| Build/type health                      | `npm run build-dev`                                                                             | Catches TypeScript/Vite import and shader raw import issues.                                                        |
| Suite regression                       | `npm test`                                                                                      | Broad OpenFront/client regression baseline before behavior-changing renderer work.                                  |

## New Tests For Future Implementation Tickets

These are test intents for W2/W3, not W1 implementation.

| Test intent                                    | Suggested location                                                                                                         | Assertions                                                                                                                                             |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `test_base_map_render_contract_types`          | `tests/client/render/base/BaseMapRendererContract.test.ts` or a type-only `*.test-d.ts` if the repo adds type-test tooling | A Foundation-like adapter input with `width`, `height`, `terrainBytes`, `tileState`, and palette satisfies the contract without OpenFront fields.      |
| `test_foundation_contract_no_openfront_fields` | same as above or static lint-style test                                                                                    | Contract source does not import `src/core/game/GameView`, OpenFront `FrameData`, units, structures, railroads, nukes, relations, or radial menu types. |
| `test_screen_to_tile_bounds`                   | `tests/client/render/base/BaseMapAdapter.test.ts`                                                                          | Given screen/world conversion results, adapter floors in-bounds positions to row-major refs and returns `null` out of bounds.                          |
| `test_tile_state_delta_upload_shape`           | `tests/client/render/base/BaseMapAdapter.test.ts` with fake target                                                         | Adapter forwards `Uint16Array` plus `{ ref, state }` deltas without allocating OpenFront `FrameData`.                                                  |
| `test_foundation_blank_grass_palette_upload`   | Foundation/client adapter test after W3 exists                                                                             | A 256x256 terrain buffer, zero tile state, and one owner palette entry can mount without unit/structure/railroad fields.                               |

## Manual Visual Checks For W3/W4

When implementation reaches a browser-rendered Foundation slice:

- OpenFront regression: current map terrain, ownership colors, camera pan/zoom,
  alt view, names, units, structures, railroads, and radial menu still behave
  unchanged.
- Foundation first loop: `/foundation` or equivalent route displays a 256x256
  all-grass map using the custom WebGL canvas.
- Ownership: clicking places owner `1` and renders the fixed claim radius with
  the same base territory fill behavior used by OpenFront.
- Camera: resize, initial fit, pan/zoom, and click mapping stay aligned with
  visible tiles.
- Pixel check: Playwright/browser screenshot is nonblank and contains terrain
  and ownership colors after one click.

## Suggested Validation Sequence

For W1 docs-only work:

1. No build is required because no runtime or type files are changed.
2. Run `git diff --check` to catch markdown/whitespace issues.

For the first implementation ticket touching source:

1. `npm run build-dev`
2. `npm test -- tests/client/view/GameView.test.ts tests/InputHandler.test.ts tests/client/controllers/WarshipSelectionController.test.ts`
3. New base adapter/contract tests listed above.
4. Manual OpenFront smoke check.
5. Manual Foundation smoke check once a route/client mount exists.

## Blockers

- None for W1 inventory/contract docs.
- Implementation depends on the module runtime/client mount shape from the
  OpenFront wrapping and Foundation initiatives.
- Browser screenshot validation should wait until a Foundation route or adapter
  mount exists.
