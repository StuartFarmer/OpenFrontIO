# W2: Server Wrapper

**Status**: TODO
**Entry**:
W1 module boundary exists.
**Exit**:
OpenFront server startup and tick runtime are owned by the OpenFront server module while existing behavior remains compatible.
**Parallelization**:
2 parallel tracks after S2.1: Track A = S2.2 worker hookup, Track B = S2.3 compatibility tests.
**Deliverables**:
D2

## Tickets
- S2.1-wrap-openfront-game-runner.md
- S2.2-route-worker-init-through-openfront-module.md
- S2.3-add-server-boundary-tests.md

## Exit Criteria
- [ ] Worker init still creates the same OpenFront runner behavior.
- [ ] OpenFront startup executions remain installed as before.
- [ ] Targeted server/runtime tests pass.
