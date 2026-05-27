# W2. Homepage And Lobby Migration

## Goal

Migrate the user-facing game start path to shared UI components while preserving solo/private/join behavior.

## Tickets

- `S2.1-homepage-play-shell.md`
- `S2.2-game-start-modals.md`
- `S2.3-lobby-config-and-map.md`
- `S2.4-homepage-lobby-validation.md`

## Dependencies

- W1 shared primitives.

## Order

`S2.1`, `S2.2`, and `S2.3` can proceed after W1. `S2.4` runs after those migrations land.

## Done Criteria

- The home page and play/lobby flows use shared primitives.
- Starting a solo game, hosting a private lobby, and joining a game remain functional.
- Previous zero-width/zero-height layout regressions are covered by validation.

## Completion Notes

- Migrated homepage game mode actions to shared `ui-button`.
- Wrapped the play-page username entry block in shared surface primitives while keeping username validation untouched.
- Migrated low-risk start modal chrome to shared button/alert/modal primitives.
- Migrated lobby config summary items to `ui-stat`.
- Migrated map picker tabs to shared buttons.
- Added homepage/play-flow smoke coverage for entry controls.

## Validation

- `npx tsc --noEmit`
- `npx vitest run tests/client/components/HomepagePlayFlow.test.ts tests/client/utilities/SinglePlayerGameStart.test.ts tests/client/components/UiComponents.test.ts tests/client/JoinLobbyModal.test.ts`
