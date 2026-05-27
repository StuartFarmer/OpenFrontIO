# W3: Economy And Player Upkeep Systems

**Status**: DONE
**Entry**: W2 scheduler compatibility path is behavior-preserving.
**Exit**: Economy and player upkeep run as native systems with parity against
`PlayerExecution`.
**Parallelization**: 2 parallel tracks after S3.1: Track A = S3.2 economy
system, Track B = S3.3 upkeep system; S3.4 joins with diagnostics and parity.
**Deliverables**: D3

## Tickets

- S3.1-player-upkeep-boundary-map.md
- S3.2-native-economy-system.md
- S3.3-native-player-upkeep-system.md
- S3.4-player-update-diagnostics-parity.md

## Exit Criteria

- [x] Economy deltas match legacy player execution behavior.
- [x] Non-economy player upkeep remains intact.
- [x] Player updates and optional diagnostics remain client-compatible.

## Completion Notes

- Added native player economy and upkeep systems under
  `src/core/systems/gameplay`.
- Slimmed `PlayerExecution` into a legacy activation wrapper that delegates to
  the native systems.
- Added direct system tests for economy deltas, bigint resources, structure
  capture, and dead-player cleanup.
- Verified W3 with focused systems, player execution, parity, update diff, and
  resource-capacity tests plus `npx tsc --noEmit`.
