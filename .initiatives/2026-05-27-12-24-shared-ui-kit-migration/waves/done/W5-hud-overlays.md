# W5. HUD Modals And In-Game Overlays

## Goal

Migrate in-game modals and overlays that still hand-build UI while keeping HUD-specific interaction behavior intact.

## Tickets

- `S5.1-send-resource-modal.md`
- `S5.2-player-chat-settings-modals.md`
- `S5.3-secondary-hud-overlays.md`
- `S5.4-hud-shared-primitive-boundary.md`

## Dependencies

- W1 shared primitives.
- W3 modal shell conventions are recommended before broad modal conversion.

## Order

Complete `S5.1` first as the reference conversion. `S5.2`, `S5.3`, and `S5.4` can proceed after that.

## Done Criteria

- In-game overlays use shared primitives where generic.
- HUD-specific components remain HUD-specific only when they encode game layout or game interaction behavior.
- EventBus dispatches, hotkeys, pointer behavior, and focus handling are preserved.

