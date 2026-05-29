# W3: Foundation Renderer Adapter MVP

**Status**: TODO
**Entry**: Base-map contract exists and OpenFront compatibility path is protected.
**Exit**: Foundation has a planned and testable adapter path for terrain, ownership, camera, and click-to-place.
**Parallelization**: 2 parallel tracks after S3.1: Track A = S3.2 map upload, Track B = S3.3 input/camera; S3.4 joins them.
**Deliverables**: D4

## Tickets
- S3.1-foundation-adapter-skeleton.md
- S3.2-foundation-map-upload.md
- S3.3-foundation-camera-input.md
- S3.4-foundation-adapter-integration-tests.md

## Exit Criteria
- [ ] Foundation adapter does not depend on OpenFront client `GameView`.
- [ ] Click-to-place path can compute a tile ref from screen coordinates.
- [ ] Ownership tile-state changes can be uploaded through the base renderer contract.
