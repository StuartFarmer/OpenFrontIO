# W2: Setup and Lobby Controls

**Status**: DONE
**Entry**: Game setup/lobby entry paths still use raw form controls and card buttons.
**Exit**: Setup/lobby form controls compose HUD primitives while preserving behavior.
**Parallelization**: 2 tracks: Track A = setup/game config, Track B = lobby identity and picker controls; join with validation.
**Deliverables**: D2, D5 partial

## Tickets
- S2.1-game-config-cards.md
- S2.2-toggle-input-card.md
- S2.3-identity-inputs.md
- S2.4-lobby-player-map-picker.md

## Exit Criteria
- [x] Raw setup/lobby app-chrome controls are migrated or explicitly deferred.
- [x] `npx tsc --noEmit` passes.
- [x] `npx vite build --mode development` passes.

## Completion Notes
- Converted game config cards, toggle input cards, identity inputs, lobby controls, map picker controls, and matchmaking controls to HUD primitives.
- Added HUD primitive support for full-width/vertical card buttons and configurable HUD inputs.
- Build completed with existing plugin timing/chunk-size warnings only.
