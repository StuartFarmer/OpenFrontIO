# Plan: OpenFront Canonical Mechanics Guide

**Stack**: TypeScript, npm, Vitest, Vite, Lit/Web Components, mdBook, Go map generator.
**Created**: 2026-05-30

## Summary
- Deliverables: 5
- Waves: 4
- Tickets: 14
- Status: COMPLETE

## Execution Order
1. W1 Canonical Guide Scaffold - DONE
2. W2 Core Rules Chapters - DONE
3. W3 Advanced Systems Chapters - DONE
4. W4 Final Verification And Maintenance - DONE

## Wave Parallelism
- W1: Sequential because docs scaffold and `docs/SUMMARY.md` are shared write hotspots.
- W2: Two tracks can run after W1: core model/map-engine and core rules/economy.
- W3: Three advanced-system tracks can run independently, followed by one command/test-evidence join ticket.
- W4: Sequential final consistency and build verification.

## Acceptance Commands
- `npm run docs:build` for every wave.
- Targeted runtime tests only if documentation work exposes a code/doc contradiction that requires checking behavior.

## Links
- `INITIATIVE.md`
- `REPORT.md`
- `deliverables/DELIVERABLES.md`
- `waves/done/`
- `tasks/done/`

## Canonical Baseline

All mechanics content should cite `main@782702c1d6c8614f2c44590584b0b34c1016020d`, inspected through `/private/tmp/openfront-main-analysis`, unless the user explicitly changes the baseline.
