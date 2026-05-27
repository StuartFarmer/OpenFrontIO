# W1: Parity Foundation

**Status**: DONE
**Entry**: Initiative analysis is complete and current tests pass on the legacy
path.
**Exit**: Deterministic baseline snapshots and scenario fixtures exist for the
main migration surfaces.
**Parallelization**: 2 parallel tracks: Track A = S1.1 -> S1.2 harness work,
Track B = S1.3 -> S1.4 scenario inventory and initial fixtures; join at wave
exit.
**Deliverables**: D1

## Tickets

- S1.1-parity-snapshot-contract.md
- S1.2-parity-runner-and-diff-output.md
- S1.3-baseline-scenario-inventory.md
- S1.4-high-risk-scenario-fixtures.md

## Exit Criteria

- [x] Snapshot output captures the state needed for 1:1 comparison.
- [x] Parity runner can compare two equivalent game paths.
- [x] Scenario coverage is documented for economy, attacks, units, AI, and
      update payloads.

## Completion Notes

- Added parity snapshot and parity runner test utilities under
  `tests/util/parity/`.
- Added scenario inventory in `tests/util/parity/SCENARIOS.md`.
- Added baseline legacy fixtures in `tests/core/systems/SystemsParity.test.ts`.
- Validated with focused Vitest parity tests and `npx tsc --noEmit`.
