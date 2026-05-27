# W4: Attack, Territory, And Conquest Systems

**Status**: DONE
**Entry**: W3 gives a proven native-system migration pattern.
**Exit**: Live attacks, territory capture, retreat, and conquest behavior run
through systems with 1:1 parity.
**Parallelization**: Sequential for S4.1 and S4.2 because active attack state
and command semantics are shared; then 2 parallel tracks: Track A = S4.3 battle
tick, Track B = S4.4 territory/conquest application; S4.5 joins with parity.
**Deliverables**: D4

## Tickets

- S4.1-attack-command-boundary.md
- S4.2-active-attack-state-adapter.md
- S4.3-battle-resolution-system.md
- S4.4-territory-conquest-system.md
- S4.5-attack-parity-suite.md

## Exit Criteria

- [x] Existing attack tests pass through systems.
- [ ] Legacy and systems paths match active attack state, troop losses, tile
      ownership, stats, updates, and hashes.
- [x] Legacy and systems paths match active attack state, troop losses, tile
      ownership, stats, updates, and hashes.
- [x] Sandbox battle model role is explicit and non-conflicting.
