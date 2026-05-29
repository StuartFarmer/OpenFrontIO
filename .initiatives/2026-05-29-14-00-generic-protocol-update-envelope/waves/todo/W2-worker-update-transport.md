# W2: Worker Update Transport

**Status**: TODO
**Entry**: W1 bridge tests complete.
**Exit**: Worker update messages use generic envelopes internally while OpenFront consumers remain bridged.
**Parallelization**: Sequential (1 owner) because `WorkerMessages`, `Worker.worker.ts`, and `WorkerClient` are shared runtime hotspots.
**Deliverables**: D3

## Tickets
- S2.1-worker-message-envelope.md
- S2.2-worker-client-openfront-compat.md
- S2.3-worker-update-parity.md

## Exit Criteria
- [ ] Worker batches send `EngineUpdateEnvelope[]`.
- [ ] Buffer transfer helper handles all update transferables.
- [ ] Existing OpenFront worker/client parity remains green.
