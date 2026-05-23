# Plan: Resource Capacity And Regen

**Stack**: TypeScript, npm, Vite, Lit, Vitest, GitHub Actions
**Created**: 2026-05-21

## Summary
- Deliverables: 5
- Waves: 4
- Tickets: 12

## Execution Order
1. W1 Resource Math And Config
2. W2 Capped Passive Regen
3. W3 Client Capacity Visibility
4. W4 Verification And Playtest

## Branch Prep

Before implementation, create a feature branch from the current resource branch or intended base branch. Suggested branch name:

```bash
git switch -c resource-capacity-and-regen
```

## Wave Plan

### W1: Resource Math And Config
- Sequential because `Resources.ts` and `Config.ts` establish the shared capacity and regen contracts.
- Establishes pure math helpers, Factory-based capacity, and curve tests before tick integration.

### W2: Capped Passive Regen
- Sequential because `PlayerExecution` is the shared tick integration point.
- Moves passive resource income from old gold-rate mirroring to capped resource regen while preserving gold compatibility elsewhere.

### W3: Client Capacity Visibility
- Starts with update/view state plumbing, then UI display, then a test join.
- Makes capacity visible for playtesting without redesigning the economy UI.

### W4: Verification And Playtest
- Runs targeted and full validation.
- Starts local single-player and records whether resources visibly approach cap and Factories raise capacity.
- Audits scope to ensure terrain production and resource-specific costs did not slip in.

## Acceptance Commands
- `npx vitest run tests/core/game/Resources.test.ts`
- `npx vitest run tests/core/executions/PlayerExecution.test.ts tests/PlayerImpl.test.ts tests/economy/ConstructionGold.test.ts`
- `npx vitest run tests/ConquerGold.test.ts tests/Donate.test.ts tests/AllianceDonation.test.ts tests/core/executions/TradeShipExecution.test.ts tests/core/game/TrainStation.test.ts`
- `npx vitest run tests/GameUpdateUtils.test.ts tests/client/view/PlayerView.test.ts tests/client/hud/ControlPanel.test.ts`
- `npx tsc --noEmit`
- `npm test`
- `npm run start:client -- --host 127.0.0.1`

## Known Constraints
- Full `npm test` currently has unrelated client localStorage test-environment failures in `InputHandler.test.ts` and `SoundManager.test.ts`; targeted tests plus `tsc` are the primary feature signal unless that global issue is fixed.
- Gold compatibility remains in place for construction, events, stats, replay fields, and legacy reward paths.
- This plan caps passive resource regen only; it does not cap trade, conquest, train, or donation transfers.

## Links
- `INITIATIVE.md`
- `REPORT.md`
- `deliverables/DELIVERABLES.md`
- `waves/todo/`
- `tasks/todo/`
