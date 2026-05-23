# W3: Client State And UI

**Status**: DONE
**Entry**: W1 is complete. W2 can still be in progress if the resource shape is stable.
**Exit**: Resource stockpiles are present in player updates, renderer state, player views, and a minimal control-panel display.
**Parallelization**: 2 tracks: Track A = S3.1 state/update plumbing, Track B = S3.2 UI display after S3.1 interface decisions are settled; S3.3 joins with frontend tests.
**Deliverables**: D3, partial D4

## Tickets
- S3.1-resource-update-and-view-state.md
- S3.2-control-panel-resource-display.md
- S3.3-client-resource-state-tests.md

## Exit Criteria
- [x] Resource state crosses worker/client update boundaries.
- [x] `PlayerView` exposes resource values for UI code.
- [x] Control panel shows Food, Energy, and Materials compactly.
- [x] Client update/view tests cover resource state.

## Completion Notes
- Completed S3.1, S3.2, and S3.3.
- W3 is the first meaningful playtest stop because resources are now visible in the in-game control panel.
- Validation passed: `npx vitest run tests/GameUpdateUtils.test.ts tests/client/view/PlayerView.test.ts tests/client/hud/ControlPanel.test.ts`.
- Validation passed: `npx tsc --noEmit`.
