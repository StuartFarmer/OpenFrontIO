# W3: Economy And Player Upkeep Systems

**Status**: TODO
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

- [ ] Economy deltas match legacy player execution behavior.
- [ ] Non-economy player upkeep remains intact.
- [ ] Player updates and optional diagnostics remain client-compatible.
