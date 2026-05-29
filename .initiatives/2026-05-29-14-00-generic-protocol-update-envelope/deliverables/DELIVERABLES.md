# Deliverables

## D1: Engine Protocol Contracts
**Outcome**: Shared start, turn, intent, update, event, error, and transferable contracts exist outside OpenFront domain files.
**Demo**:
`npm run build-dev`
**Acceptance Checks**:
- [ ] Generic protocol types do not import `src/core/game/Game`, `GameUpdateType`, or OpenFront `Intent`.
- [ ] Envelope tests cover minimal valid start, turn, intent, update, and error objects.
**Dependencies**: None
**Notes**: Prefer `src/core/protocol` or equivalent shared engine location.

## D2: OpenFront Legacy Bridge
**Outcome**: OpenFront can wrap and unwrap legacy `GameStartInfo`, `Turn`, `StampedIntent`, and `GameUpdateViewData` through generic envelopes.
**Demo**:
`npm test -- tests/core/protocol`
**Acceptance Checks**:
- [ ] Legacy OpenFront update payloads round-trip without changing update ordering or typed array contents.
- [ ] Old records or starts without `moduleID` default to `openfront`.
- [ ] OpenFront bridge is isolated and marked transitional.
**Dependencies**: D1
**Notes**: This bridge lets OpenFront remain stable while Foundation starts clean.

## D3: Generic Worker Update Transport
**Outcome**: Worker message batching and `WorkerClient` can transport `EngineUpdateEnvelope` while OpenFront consumers still receive legacy updates through the bridge.
**Demo**:
`npm test -- tests/core/systems/WorkerClientUpdateParity.test.ts`
**Acceptance Checks**:
- [ ] Worker batching transfers map/update buffers from generic envelopes.
- [ ] Existing OpenFront parity test still passes.
- [ ] Error update handling remains intact.
**Dependencies**: D1, D2
**Notes**: Preserve buffer transfer performance; do not structured-clone large tile arrays accidentally.

## D4: Generic Intent and Turn Transport
**Outcome**: Client, local server, and remote server paths can carry generic stamped intent envelopes while OpenFront intent handling remains bridged.
**Demo**:
`npm test -- tests/core/protocol tests/server`
**Acceptance Checks**:
- [ ] Local single-player stamps client IDs into generic intents.
- [ ] Remote WebSocket validation validates envelope shape and delegates payload validation.
- [ ] OpenFront intents still reach `IntentCommandSurface` unchanged after bridging.
**Dependencies**: D1, D2
**Notes**: Keep multiplayer-compatible turn ordering and hash fields.

## D5: Foundation-Ready Clean Path
**Outcome**: A non-OpenFront module can define config, intents, and updates without importing OpenFront schemas or update enums.
**Demo**:
`npm run build-dev`
**Acceptance Checks**:
- [ ] A skeletal Foundation protocol fixture compiles using generic envelopes only.
- [ ] Foundation can express `foundation/player_placed` as a module event.
- [ ] Tests assert Foundation protocol fixtures do not depend on OpenFront bridge functions.
**Dependencies**: D1, D3, D4
**Notes**: No gameplay implementation required.

## D6: Migration Documentation
**Outcome**: The transitional bridge, final target, and follow-on initiatives are documented for future implementation work.
**Demo**:
Review `src/core/protocol` docs or migration notes added by the implementation wave.
**Acceptance Checks**:
- [ ] Documentation identifies legacy and generic shapes.
- [ ] Documentation lists what remains OpenFront-specific after this initiative.
- [ ] Documentation names follow-on renderer, replay, and module relocation work.
**Dependencies**: D1-D5
**Notes**: Keep documentation close to protocol code where possible.
