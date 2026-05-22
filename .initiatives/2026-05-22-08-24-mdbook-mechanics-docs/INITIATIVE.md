# Initiative: mdBook Mechanics Documentation

## Stack
- Language: TypeScript for client, core simulation, and server; Go for `map-generator`
- Package manager: npm with `package-lock.json`
- Test runner: Vitest via `npm run test` and `npm run test:coverage`
- Build: Vite plus `tsc --noEmit` via `npm run build-prod`
- UI: Lit components, Tailwind-driven styles, Pixi/WebGL rendering
- CI: GitHub Actions with Node 24 jobs for build, test, ESLint, Prettier, and generated map freshness

## Goal

Install and wire mdBook as the durable home for game-mechanics documentation, then make rules, constants, formulas, and balance knobs discoverable from the codebase instead of manually copied into static docs.

## Problem Statement

The repository already has Markdown docs, but mechanics knowledge is spread through deterministic core TypeScript and some client lobby controls. Many important values are currently encoded as method bodies, literals, formulas, and schemas rather than as a documented mechanics model. That makes it hard to know the real rules, hard to identify where to balance them, and easy for docs to drift.

## Success Definition

The team can open a local mdBook and inspect rules for economy, combat, units, diplomacy, nukes, spawning, lobby-adjustable parameters, and other balance surfaces. Published pages are generated or checked from code-owned sources so important numbers and formulas cannot silently diverge from simulation behavior.

## Non-Goals
- Do not rebalance mechanics during this initiative.
- Do not replace the deterministic simulation architecture.
- Do not expose private or server-only operational configuration as game rules.
- Do not convert every formula to data before the documentation model has proved useful.

## Constraints
- `src/core` must remain deterministic and suitable for client-side worker execution.
- Existing npm/Vite/Vitest/Prettier workflows should remain the primary developer path.
- mdBook is a Rust binary, while this repository currently has no root Rust crate or `Cargo.toml`.
- Existing local worktree changes must be preserved.
- Generated documentation should avoid importing browser-only client modules into Node scripts.

## Assumptions
- Documentation will live under the existing `docs/` tree unless planning finds a stronger reason to split it.
- The first generation path should use TypeScript extraction because the mechanics source of truth is TypeScript.
- Some formulas should remain executable code and be documented through metadata/examples rather than forced into static JSON.
- CI should check generated docs for drift once the extraction path exists.

## Risk Posture

Moderate. Adding mdBook is low-risk, but centralizing mechanics can become invasive if it attempts to refactor all rules at once. The safer direction is to establish a small typed mechanics metadata surface, generate docs from it, and migrate high-value balance knobs incrementally.

## Next Step
Run planning for this initiative.
