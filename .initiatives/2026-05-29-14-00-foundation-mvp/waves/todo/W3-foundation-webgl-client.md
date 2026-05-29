# W3: Foundation WebGL Client

**Status**: TODO
**Entry**: W1 map/domain and W2 runtime update envelopes are ready.
**Exit**: Foundation can render blank terrain and claimed ownership through the custom WebGL renderer via a small adapter.
**Parallelization**: 2 parallel tracks: Track A = S3.1 renderer adapter, Track B = S3.2 click input mapping, then S3.3 joins adapter/runtime updates.
**Deliverables**: D4, D6

## Tickets
- S3.1-webgl-renderer-adapter.md
- S3.2-click-input-adapter.md
- S3.3-render-runtime-integration.md
- S3.4-webgl-adapter-tests.md

## Exit Criteria
- [ ] Adapter constructs and disposes the custom WebGL view.
- [ ] Clicks map to tile refs without OpenFront `InputHandler`.
- [ ] Placement updates tile ownership rendering.
- [ ] Renderer compatibility types stay inside adapter/client code.
