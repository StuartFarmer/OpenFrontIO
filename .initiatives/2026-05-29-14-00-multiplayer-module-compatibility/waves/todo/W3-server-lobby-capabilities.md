# W3: Server Lobby Capabilities

**Status**: TODO
**Entry**: W1 compatibility adapters exist; W2 has clarified local Foundation envelope requirements.
**Exit**: Server game creation, lobby info, prestart/start, remote join/rejoin, turn relay, and public scheduling use `GameModuleRuntime`.
**Parallelization**: 2 parallel tracks after S3.1: Track A = S3.2, Track B = S3.3.
**Deliverables**: D3

## Tickets
- S3.1-default-multiplayer-services-contract.md
- S3.2-private-game-start-prestart.md
- S3.3-rate-limit-validation-boundary.md

## Exit Criteria
- [ ] Private module lobbies can be represented without public matchmaking support.
- [ ] Server-stamped identity is preserved.
- [ ] Public lobby scheduling is module-aware and can support registered modules without schema rewrites.
