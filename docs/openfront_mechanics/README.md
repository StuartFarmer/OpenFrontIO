# Canonical Mechanics Guide

This section documents the original OpenFront mechanics from `main@782702c1d6c8614f2c44590584b0b34c1016020d`.

The active development branch may contain mechanics changes that are not canonical for this guide. When a rule, constant, schema, or behavior is documented here, it should be checked against the detached main worktree at `/private/tmp/openfront-main-analysis` or another checkout of the same commit.

## Reading Order

Start with the source index, core data model, map model, and engine loop. Those chapters define the vocabulary used by the rest of the guide. Then read spawning, expansion, combat, economy, and win conditions before moving into advanced systems such as naval units, rail trade, nukes, diplomacy, and nation AI.

## Scope

The guide is intended to be both player-readable and implementation-readable. It should explain game concepts in plain terms while preserving the formulas, state transitions, schemas, tests, and source references needed to recreate an equal implementation.

## Canonical Source

- Branch/ref: `main@782702c1d6c8614f2c44590584b0b34c1016020d`
- Local inspection worktree: `/private/tmp/openfront-main-analysis`
- Checked-in reference snapshots: `docs/openfront_mechanics/reference/`
- Runtime source: `src/core/**`
- Client command source: `src/client/**`
- Map and nation data: `resources/maps/**`
- Behavioral evidence: `tests/**`
