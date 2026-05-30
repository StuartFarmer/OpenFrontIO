# Initiative: OpenFront Canonical Mechanics Guide

## Stack
- Language: TypeScript for game, client, server, and tests; Go for `map-generator`.
- Package manager: npm with `package-lock.json`.
- Test runner: Vitest via `npm test`.
- Build: `tsc --noEmit` plus Vite through `npm run build-dev` and `npm run build-prod`.
- UI: Lit/Web Components, WebGL renderer, CSS, and HUD/client modules under `src/client`.
- CI: GitHub Actions under `.github/workflows/`, with `ci.yml`, deploy, release, and PR hygiene workflows.
- Documentation: mdBook scripts already exist on `main` as `docs:build` and `docs:serve`; current docs live under `docs/`.

## Goal

Create an authoritative, source-grounded mdBook game guide for the original canonical OpenFront game mechanics as they exist on `main@782702c1d6c8614f2c44590584b0b34c1016020d`.

The guide should inventory and explain every major game component, mechanic, and dynamic required to understand or recreate an equal game implementation: maps and tile types, players and nations, spawning, territory expansion, troop and resource growth, combat, structures, naval units, rail and trade systems, diplomacy, AI nation behavior, nukes, SAMs, win conditions, game configuration, and UI/player command surfaces.

## Problem Statement

The canonical game mechanics are executable and deterministic, but they are not documented in one coherent product-facing or implementation-facing guide. The rules are spread across `Config`, game interfaces, map loaders, player state, execution classes, pathfinding, nation AI behavior, client command surfaces, map manifests, and tests.

The current working branch contains major mechanics changes, so this analysis intentionally treats `main@782702c1d6c8614f2c44590584b0b34c1016020d` as the source of truth. Any future guide work should keep that branch/ref explicit until the desired documentation baseline changes.

## Success Definition

A future mdBook guide is successful when a developer can read it and reconstruct the canonical OpenFront mechanics with comparable behavior, including:

- Domain schemas and enums for maps, terrain, players, units, relations, game modes, and configuration.
- Per-tick simulation order and execution lifecycle.
- Numeric formulas, constants, thresholds, ranges, cooldowns, capacities, and costs.
- Data-driven map and nation inputs from resources.
- Player-facing commands and the server-side execution classes they trigger.
- AI nation decision rules and difficulty modifiers.
- Test references for non-obvious behavior and edge cases.
- Source references to canonical files and line ranges on `main`.

## Non-Goals

- Do not document mechanics from the current feature branch as canonical unless they also exist on `main@782702c1`.
- Do not implement the guide, generator, mdBook chapters, waves, tickets, or code changes during this analysis.
- Do not rebalance mechanics or propose gameplay changes as part of the guide.
- Do not treat renderer-only visual effects as mechanics unless they affect rules, targeting, state, or player decisions.

## Constraints

- The analysis source is `main@782702c1d6c8614f2c44590584b0b34c1016020d`, inspected through a detached worktree at `/private/tmp/openfront-main-analysis`.
- The active workspace branch is dirty and contains unrelated modified files in `src/games/foundation/domain/WildernessExploration.ts` and `tests/games/foundation/runtime.test.ts`; this initiative does not modify or rely on them.
- Mechanics evidence must come from code, tests, map manifests, or tracked docs, not inferred memory.
- The final guide should preserve code-owned formulas and use documentation as an explanation layer.

## Assumptions

- "Original canonical game" means the current local `main` branch at commit `782702c1d6c8614f2c44590584b0b34c1016020d`.
- The desired guide is both player-readable and implementation-readable: it should explain concepts in prose, but also include math, schema, and source traces.
- Existing docs under `docs/` may be reused when accurate, but should not be trusted without cross-checking code.

## Risk Posture

High accuracy, low implementation risk. The hard part is coverage and drift control, not technical complexity. The guide should prioritize completeness and source traceability over early polish, because omissions in mechanics documentation are more damaging than rough prose.

## Next Step

Run planning for this initiative.
