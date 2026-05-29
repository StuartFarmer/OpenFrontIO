# W3: Intent and Turn Transport

**Status**: TODO
**Entry**: W1 complete; can run after or alongside W2 with coordination.
**Exit**: Local and remote transport can carry generic turn and stamped intent envelopes.
**Parallelization**: 2 parallel tracks after schema contract: Track A = S3.1 client/local transport, Track B = S3.2 server validation, then S3.3 command bridge
**Deliverables**: D4

## Tickets
- S3.1-client-local-turn-envelope.md
- S3.2-server-wire-envelope.md
- S3.3-openfront-command-bridge.md

## Exit Criteria
- [ ] Local single-player can stamp generic intent envelopes.
- [ ] Remote server validates envelope shape without accepting arbitrary unvalidated module payloads.
- [ ] OpenFront command execution still receives legacy `StampedIntent` through the bridge.
