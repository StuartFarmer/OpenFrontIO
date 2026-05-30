# W2: OpenFront Compatibility Adapter

**Status**: DONE
**Entry**: W1 contract is accepted.
**Exit**: Existing OpenFront WebGL path is wrapped or named as an OpenFront adapter without behavior changes.
**Parallelization**: Sequential (1 owner), because this touches shared OpenFront render integration files.
**Deliverables**: D3

## Tickets

- S2.1-openfront-adapter-wrapper.md
- S2.2-openfront-render-regression-tests.md

## Exit Criteria

- [x] OpenFront client startup still mounts the current renderer and HUD.
- [x] Existing `WebGLFrameBuilder` behavior is preserved.
- [x] Tests/build validate no behavior regression.

## Completion Notes

- Added an additive OpenFront compatibility naming wrapper under `src/client/render/base-map/**`.
- Did not change the live OpenFront mount path, HUD setup, or WebGL frame loop.
- Verified with focused OpenFront frame-upload regression tests and `npm exec tsc -- --noEmit`.
