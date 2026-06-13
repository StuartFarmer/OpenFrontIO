# Painted Farmland Contract

## Model Decision

Farmland is a normal `UnitType` and a member of the player-buildable/structure domain.

## Rationale

- Existing construction, disabled-unit config, transport, stats, update serialization, and renderer flows are all keyed from `UnitType`.
- The first implementation needs a visible, owned, targetable map object with normal authoritative validation.
- A separate tile-overlay model would add a second build/update path before there is evidence that Farmland needs fundamentally different lifecycle rules.

## Gameplay Semantics

- Footprint: 1x1 tile.
- Placement terrain: owned land territory only.
- Duplicate policy: one Farmland per tile; a tile already containing Farmland is invalid.
- Upgrade policy: not upgradable.
- Construction: can use normal construction duration if configured, but initial implementation should prefer simple immediate or short construction consistent with selected balancing.
- Production: initially food-oriented, but exact production can be minimal or deferred if the ticket scope needs to isolate placement first.
- Cost: resource cost should be low enough for paint placement and should spend through normal resource validation.

## Source Touchpoints

- `src/core/game/Game.ts`: `UnitType`, `Structures`, `BuildMenus`, `PlayerBuildable`, `UnitParamsMap`.
- `src/core/configuration/Config.ts`: `unitInfo`, `unitResourceCost`, disabled-unit behavior through existing config.
- `src/core/game/PlayerImpl.ts`: placement validation and duplicate rejection.
- `src/core/game/UnitImpl.ts`: stats/build accounting and update serialization if needed.
- `src/client/controllers/BuildPreviewController.ts`: hover preview and paint placement state.
- `src/client/InputHandler.ts`: paint pointer routing and cancellation.
- `src/client/hud/layers/UnitDisplay.ts` or `src/client/hud/layers/BuildBar.ts`: bottom UI integration.

## Intent Decision

Painting uses repeated existing `build_unit` intents, one per accepted tile, for the first implementation.

## Intent Rationale

- Keeps authoritative validation on the existing server/core command path.
- Avoids schema/protocol churn before measuring whether paint traffic is a real problem.
- Keeps rollback simple: each tile placement is an ordinary build command.

## Paint Stroke Semantics

- Starting a stroke attempts placement on the current tile.
- Moving across a new tile attempts placement once for that tile in the current stroke.
- Re-entering a tile already attempted during the same stroke does not emit another intent.
- Invalid, unaffordable, or duplicate occupied tiles do not emit build intents.
- Releasing the mouse ends the active stroke but keeps Farmland selected.
- Right-click, Escape, blur, or selecting another build item cancels paint mode and clears the brush cursor.
