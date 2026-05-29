# W1: Protocol Envelope Scaffold

**Status**: TODO
**Entry**: Analysis docs exist and OpenFront compatibility requirements are understood.
**Exit**: Generic protocol envelope types/schemas are designed beside current OpenFront schemas, with tests proving old messages still parse.
**Parallelization**: 2 parallel tracks: Track A = S1.1 -> S1.3, Track B = S1.2 -> S1.4.
**Deliverables**: D1

## Tickets
- S1.1-protocol-envelope-types.md
- S1.2-openfront-compatibility-adapters.md
- S1.3-client-server-schema-tests.md
- S1.4-default-openfront-module-id.md

## Exit Criteria
- [ ] Generic start/prestart/intent/turn/hash envelopes are defined without OpenFront payload assumptions.
- [ ] Existing OpenFront schemas and behavior remain accepted.
- [ ] Missing `moduleId` resolves to OpenFront through a documented compatibility rule.
