# Deliverables

## D1: Module-Aware Protocol Envelopes
**Outcome**: Shared client/server schemas can represent OpenFront and non-OpenFront module start, prestart, intent, turn, hash, and error messages without requiring module payloads to be OpenFront-shaped.
**Demo**:
`npm test -- tests/server/GameLifecycle.test.ts tests/client/LocalServer.test.ts`
**Acceptance Checks**:
- [ ] Existing OpenFront `ClientMessageSchema` and `ServerMessageSchema` behavior is preserved through compatibility adapters.
- [ ] New generic envelopes carry `moduleId`, server-stamped `clientID`, ordered turns, and unknown module payloads behind module validators.
- [ ] OpenFront remains the default module when old messages/configs omit `moduleId`.
**Dependencies**: None.
**Notes**: This is the first shared contract. Do not migrate all callers until compatibility tests exist.

## D2: Local-First Foundation Turn Compatibility
**Outcome**: Foundation can stay single-player/local while exercising the same start, intent, turn, turn-complete, and optional hash envelope semantics needed for eventual remote multiplayer.
**Demo**:
`npm test -- tests/client/LocalServer.test.ts`
**Acceptance Checks**:
- [ ] `LocalServer` or a module-local equivalent accepts generic module envelopes.
- [ ] Foundation local play does not depend on OpenFront `GameConfig`, `Intent`, `Winner`, or stats records.
- [ ] Local and remote turn envelope construction are intentionally aligned.
**Dependencies**: D1.
**Notes**: This is not Foundation remote multiplayer; it is compatibility groundwork.

## D3: Server And Lobby Module Capability Boundary
**Outcome**: Server lobby lifecycle, private/public game creation, start/prestart, remote join/rejoin, and turn relay use `GameModuleRuntime` without special-casing Foundation.
**Demo**:
`npm test -- tests/server/GameLifecycle.test.ts tests/server/ClientMsgRateLimiter.test.ts`
**Acceptance Checks**:
- [ ] `GameServer` can validate module payloads through the module registry boundary.
- [ ] Public lobby scheduling can support registered modules without schema rewrites.
- [ ] Server-stamped identity, rate limits, and invalid-message kicks are preserved.
**Dependencies**: D1.
**Notes**: Keep private/local module support ahead of public matchmaking work if needed, but `GameModuleRuntime` should target both.

## D4: Worker Runtime And Update Bridge
**Outcome**: The main-thread worker runtime separates generic turn/update processing from OpenFront-specific query messages and `GameUpdateViewData`.
**Demo**:
`npm test -- tests/core/systems/WorkerClientUpdateParity.test.ts`
**Acceptance Checks**:
- [ ] Worker init and turn messages can carry generic module start/turn envelopes.
- [ ] OpenFront worker queries continue to work through an OpenFront adapter.
- [ ] Foundation has a path to module-owned updates without faking OpenFront player/build/attack query APIs.
**Dependencies**: D1, D2.
**Notes**: The existing drain loop is reusable; the OpenFront query surface is not.

## D5: Replay, Rejoin, Hash, Desync, Archive Compatibility
**Outcome**: Replay, rejoin, hash/desync reporting, winner voting, and archive payloads are `GameModuleRuntime.services` with module-owned schemas.
**Demo**:
`npm test -- tests/client/LocalServer.test.ts tests/server/GameLifecycle.test.ts`
**Acceptance Checks**:
- [ ] OpenFront rejoin, replay, hash/desync, winner voting, and archive behavior is preserved.
- [ ] Foundation can provide minimal archive/winner payloads while still using deterministic local turns.
- [ ] Record formats are versioned or bridged before any generic archive storage is introduced.
**Dependencies**: D1, D3, D4.
**Notes**: This deliverable should not force Foundation into remote multiplayer.
