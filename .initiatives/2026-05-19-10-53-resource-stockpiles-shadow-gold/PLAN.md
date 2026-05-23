# Plan: Resource Stockpiles Shadow Gold

**Stack**: TypeScript, npm, Vite, Lit, Vitest, GitHub Actions
**Created**: 2026-05-19

## Summary
- Deliverables: 5
- Waves: 4
- Tickets: 13

## Execution Order
1. W1 Core Resource Model
2. W2 Acquisition Call Sites
3. W3 Client State And UI
4. W4 Verification And Playtest

## Branch Prep

Before implementation, create a feature branch from the intended fork/base branch. Suggested branch name:

```bash
git switch -c feature/resource-stockpiles-shadow-gold
```

## Wave Plan

### W1: Core Resource Model
- Sequential because `Game.ts` and `PlayerImpl.ts` are shared hotspots.
- Establishes types, helpers, stockpile state, compatibility wrappers, and core tests.

### W2: Acquisition Call Sites
- Starts with passive income, then parallelizes trade/train and conquest/donation before a final audit.
- Keeps stats/events/schema names gold-compatible while mutations move to resource payloads.

### W3: Client State And UI
- Adds resource fields to updates/view state, then exposes a compact control-panel display.
- Keeps existing gold UI/state present for compatibility.

### W4: Verification And Playtest
- Runs targeted and full tests.
- Starts local single-player and verifies visible resource behavior.
- Audits scope to ensure no terrain production or resource-specific costs slipped in.

## Acceptance Commands
- `npm test -- tests/PlayerImpl.test.ts tests/economy/ConstructionGold.test.ts`
- `npm test -- tests/ConquerGold.test.ts tests/Donate.test.ts tests/AllianceDonation.test.ts`
- `npm test -- tests/core/executions/TradeShipExecution.test.ts tests/core/game/TrainStation.test.ts`
- `npm test -- tests/GameUpdateUtils.test.ts tests/client/view/PlayerView.test.ts`
- `npm test`
- `npm run start:client`

## Links
- `INITIATIVE.md`
- `REPORT.md`
- `deliverables/DELIVERABLES.md`
- `waves/todo/`
- `tasks/todo/`
