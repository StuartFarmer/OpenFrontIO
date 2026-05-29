# Initiative: Multiplayer Module Compatibility

## Stack
- Language: TypeScript.
- Package manager: npm.
- Test runner: Vitest.
- Build: Vite plus `tsc --noEmit`.
- UI: Lit custom elements, custom WebGL renderer.
- Server: Express, `ws`, clustered worker processes.
- Validation: Zod.
- CI: GitHub Actions under `.github/workflows/`.

## Goal
Define and plan the multiplayer compatibility path for non-OpenFront game modules, so Foundation can start single-player first while using abstractions that can later join the same connection, lobby, turn, worker, replay, and desync infrastructure as OpenFront.

## Problem Statement
The current multiplayer path is close to a reusable deterministic turn relay, but its public contracts are OpenFront-specific. `GameConfig`, `Intent`, `GameStartInfo`, `Turn`, `prestart`, `winner`, replay records, worker messages, and client event translation all assume OpenFront maps, modes, units, diplomacy, spawn flow, cosmetics, stats, and winner semantics.

Foundation should not implement multiplayer in its first loop. However, if its single-player path uses incompatible local-only abstractions, the later multiplayer migration will require a second rewrite. The engine/module work therefore needs a clear compatibility standard now: generic envelopes, module-owned config and intent payloads, deterministic turn sequencing, module validation hooks, module update streams, and compatibility adapters that preserve OpenFront behavior while non-OpenFront modules mature.

## Success Definition
This initiative succeeds when there is an implementation plan that:

- Keeps Foundation single-player first.
- Defines a generic multiplayer envelope model that can carry OpenFront and non-OpenFront module payloads.
- Preserves existing OpenFront multiplayer, lobby, public-game scheduling, rejoin, replay, hash, desync, and archive behavior during migration.
- Identifies the code boundaries where server, client, local server, worker, and module validation need to meet.
- Defines the test intent needed before Foundation is allowed to opt into remote multiplayer.
- Avoids forcing Foundation to inherit OpenFront config, intent, winner, stats, map, or client HUD assumptions.

## Non-Goals
- Do not implement code in this initiative.
- Do not make Foundation multiplayer in its first MVP.
- Do not rewrite OpenFront networking, matchmaking, or replay storage in one pass.
- Do not remove existing OpenFront schemas until a compatibility bridge and tests exist.
- Do not require non-OpenFront modules to support ranked play, cosmetics, or OpenFront-specific stats on day one. Public/private multiplayer, rejoin, replay, archive, hash/desync, and winner/end-state handling are default engine-service targets for registered modules.

## Constraints
- Work only through additive or compatibility-preserving migration steps.
- Existing OpenFront multiplayer must remain the canonical compatibility target.
- The server must continue stamping client identity from the authenticated connection, not from client payloads.
- Turn ordering must remain deterministic and replayable.
- Message size/rate-limit behavior must stay explicit for module payloads.
- Foundation can remain local/single-player until the protocol and runtime seams are proven.
- The repo may have unrelated dirty worktree changes; do not revert them.

## Assumptions
- The broader engine/module initiative will introduce a `moduleId` concept and game module registry.
- OpenFront will be the default module for existing configs and existing lobbies.
- Foundation will initially use click-to-place local play, then can add deterministic auto-start placement for test automation later.
- Module config and intent payload validation should use Zod schemas.
- OpenFront replay/archive compatibility matters more than rich replay/archive behavior for Foundation, but Foundation should still follow the same service path with minimal payloads.

## Risk Posture
High for direct implementation, medium for incremental planning. The multiplayer path is central to production behavior and includes auth, rate limiting, lobby lifecycle, turn sequencing, rejoin, archives, replay, and desync detection. The safest plan is to introduce generic envelopes and module adapters beside the current OpenFront schemas, then move one boundary at a time.

## Relationship To Engine SDK Game Modules
This initiative is a follow-on split from `.initiatives/2026-05-29-13-44-engine-sdk-game-modules/`. That initiative establishes the engine/module direction. This initiative focuses only on the multiplayer compatibility path for modules that are not OpenFront.

## Design Direction
Use generic transport envelopes with module-owned payloads.

The shared multiplayer layer should own:

- Connection lifecycle.
- Lobby identity and player connection identity.
- Game start and prestart envelopes.
- Turn numbering and ordered turn delivery.
- Server-stamped client identity.
- Rate limiting and payload size checks.
- Rejoin turn replay.
- Hash/desync collection.
- Archival/replay hooks.

Game modules should own:

- Config payload validation.
- Intent payload validation.
- Module-specific lobby metadata.
- Module-specific prestart payload.
- Module-specific start payload.
- Module-specific winner/stats/archive payloads.
- Module-specific hash source and replay semantics.

Foundation can start local-only by using the same envelope shape against `LocalServer`. That keeps its abstractions aligned with remote multiplayer without requiring remote lobby support immediately.

## Next Step
Execute the plan in `PLAN.md` when implementation begins.

## Clarified Decisions
- This initiative should wait until Foundation single-player and protocol envelope work create the needed seams.
- The path should remain easy to complete afterward; earlier initiatives must not paint multiplayer into a corner.
- Local-server parity is fine first, but the final model should support the same central-server concept as OpenFront.
- Defer explicit capability flags until a concrete exception requires them; default registered modules should target the full shared multiplayer service set.
- Public/private game support should not be artificially limited if the central-server model can support modules cleanly. The end goal is instant multiplayer capability for modules once this initiative completes.
