# Plan: Multiplayer Module Compatibility

**Stack**: TypeScript, npm, Vitest, Vite, Express, `ws`, Zod, custom WebGL renderer.
**Created**: 2026-05-29

## Summary
- Deliverables: 5
- Waves: 5
- Tickets: 16

## Execution Order
1. W1: Protocol Envelope Scaffold
2. W2: Local Foundation Turn Path
3. W3: Server Lobby Capabilities
4. W4: Worker Update Bridge
5. W5: Rejoin Replay Desync Archive

## Wave Overview
- W1 introduces generic module-aware protocol envelopes and OpenFront compatibility adapters. This must happen first because every later wave depends on a stable payload boundary.
- W2 keeps Foundation single-player first but routes local play through multiplayer-shaped envelopes. This prevents a future second rewrite.
- W3 makes private and public server/lobby lifecycle module-aware through `GameModuleRuntime`.
- W4 separates worker runtime messages from OpenFront query messages and update payloads.
- W5 routes rejoin, replay, hash/desync, winner voting, and archive behavior through `GameModuleRuntime.services`.

## Parallelism
- W1 has two parallel tracks: envelope definitions/tests and OpenFront adapter/defaulting.
- W2 is sequential because `LocalServer`, `Transport`, and client start handling are shared hotspots.
- W3 can split after the `GameModuleRuntime` contract: start/prestart and validation/rate-limit boundaries can proceed in parallel.
- W4 is sequential because worker message unions and batching are fragile shared surfaces.
- W5 can split rejoin, hash/desync, and winner/archive record work, then join on the regression suite.

## Validation Commands
- `npm test -- tests/server/GameLifecycle.test.ts`
- `npm test -- tests/client/LocalServer.test.ts`
- `npm test -- tests/server/ClientMsgRateLimiter.test.ts`
- `npm test -- tests/core/systems/WorkerClientUpdateParity.test.ts`
- `npm run build-dev`

## Links
- `INITIATIVE.md`
- `REPORT.md`
- `deliverables/DELIVERABLES.md`
- `waves/todo/`
- `tasks/todo/`
