# W3: Client Wrapper

**Status**: TODO
**Entry**:
W1 module boundary exists.
**Exit**:
OpenFront client mounting and HUD/input/render composition are owned by the OpenFront client module.
**Parallelization**:
2 parallel tracks after S3.1: Track A = S3.2 HUD composition, Track B = S3.3 lifecycle cleanup/tests.
**Deliverables**:
D3

## Tickets
- S3.1-wrap-client-game-creation.md
- S3.2-wrap-openfront-hud-composition.md
- S3.3-preserve-client-lifecycle-cleanup.md

## Exit Criteria
- [ ] Lobby start delegates client mount to OpenFront module.
- [ ] Existing OpenFront HUD composition remains intact.
- [ ] Stop, cleanup, replay, and local single-player behavior remain compatible.
