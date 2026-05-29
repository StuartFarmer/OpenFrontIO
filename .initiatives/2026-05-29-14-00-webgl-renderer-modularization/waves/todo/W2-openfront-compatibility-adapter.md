# W2: OpenFront Compatibility Adapter

**Status**: TODO
**Entry**: W1 contract is accepted.
**Exit**: Existing OpenFront WebGL path is wrapped or named as an OpenFront adapter without behavior changes.
**Parallelization**: Sequential (1 owner), because this touches shared OpenFront render integration files.
**Deliverables**: D3

## Tickets
- S2.1-openfront-adapter-wrapper.md
- S2.2-openfront-render-regression-tests.md

## Exit Criteria
- [ ] OpenFront client startup still mounts the current renderer and HUD.
- [ ] Existing `WebGLFrameBuilder` behavior is preserved.
- [ ] Tests/build validate no behavior regression.
