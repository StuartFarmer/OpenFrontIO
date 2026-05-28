# W1: Leaderboard and Stats Tables

**Status**: DONE
**Entry**: Remaining raw tables/buttons in leaderboard and stats-oriented display files.
**Exit**: Leaderboard player/clan tables and stats tree/table actions use HUD primitives with typecheck passing.
**Parallelization**: Sequential (1 owner) because leaderboard files share table layout assumptions.
**Deliverables**: D1, D5 partial

## Tickets
- S1.1-leaderboard-player-table.md
- S1.2-leaderboard-clan-table.md
- S1.3-stats-tree-actions.md

## Exit Criteria
- [x] `LeaderboardPlayerList.ts` uses `hud-table` primitives for the main table.
- [x] `LeaderboardClanTable.ts` uses `hud-table` and HUD sort buttons.
- [x] Stats tree raw action buttons are converted or documented as deferred with reason.
- [x] `npx tsc --noEmit` passes.
