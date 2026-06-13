# W1: Bottom Build Bar

**Status**: DONE
**Entry**: Initiative approved for implementation.
**Exit**: Alive players can select existing buildable units from a persistent bottom bar and place via ghost preview.
**Parallelization**: 2 parallel tracks after S1.1: Track A = S1.2 UI component, Track B = S1.3 input/ghost contract tests; S1.4 joins.
**Deliverables**: D1, D2

## Tickets

- S1.1-bottom-bar-metadata.md
- S1.2-persistent-build-bar-ui.md
- S1.3-build-bar-ghost-tests.md
- S1.4-hud-shell-placement.md

## Exit Criteria

- [x] Bottom bar renders in the live game shell.
- [x] Selecting a button sets ghost placement state.
- [x] Existing ghost placement controller owns build confirmation.

## Verification

- `npx vitest run tests/client/hud/BuildBar.test.ts`
- `npm run build-dev`
