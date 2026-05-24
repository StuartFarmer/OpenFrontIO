# TASK-5.2: Token Cleanup

Status: done

## Goal

Make class/token files internal implementation details.

## Work

- Remove public imports of `HUD_*` constants from migrated live layers.
- Keep only the minimum token layer needed by components.

## Done

- Panel authors do not compose UI by importing class-name constants.

## Result

Added a compatibility boundary comment to `HudTheme.ts`. Token files still have live callers across legacy HUD layers, so they were not deleted in this wave.

Current rule:

- New HUD work should use direct `hud-*` custom elements.
- Existing `HUD_*` exports remain compatibility support until each live layer is migrated.
