# Command Surface

Canonical baseline: `main@782702c1d6c8614f2c44590584b0b34c1016020d`.

The command surface connects UI actions to intent schemas and execution classes. The authoritative payload schemas are in `src/core/Schemas.ts`; client files decide when to create and send them.

## Command Map

| Player action                           | Schema source                  | Likely runtime handling                            |
| --------------------------------------- | ------------------------------ | -------------------------------------------------- |
| Spawn                                   | `SpawnIntentSchema`            | `SpawnExecution`                                   |
| Land attack                             | `AttackIntentSchema`           | `AttackExecution`                                  |
| Boat attack                             | `BoatAttackIntentSchema`       | `TransportShipExecution` / boat attack path        |
| Build unit/structure                    | `BuildUnitIntentSchema`        | `ConstructionExecution` or unit-specific execution |
| Upgrade structure                       | `UpgradeStructureIntentSchema` | `UpgradeStructureExecution`                        |
| Cancel attack                           | `CancelAttackIntentSchema`     | Attack object retreat/cancel handling              |
| Alliance request/reject/extension/break | alliance intent schemas        | `src/core/execution/alliance/**`                   |
| Donate gold/troops                      | donation intent schemas        | `DonateGoldExecution`, `DonateTroopsExecution`     |
| Embargo or embargo all                  | embargo intent schemas         | `EmbargoExecution`, `EmbargoAllExecution`          |
| Target player                           | `TargetPlayerIntentSchema`     | `TargetPlayerExecution`                            |
| Emoji/quick chat                        | emoji and quick chat schemas   | `EmojiExecution`, `QuickChatExecution`             |
| Move warship                            | client controller command path | `MoveWarshipExecution`                             |

## Client Sources

Important client touchpoints:

- `src/client/hud/layers/BuildMenu.ts`
- `src/client/hud/layers/BuildBar.ts`
- `src/client/hud/layers/MainRadialMenu.ts`
- `src/client/hud/layers/PlayerActionHandler.ts`
- `src/client/hud/layers/ControlPanel.ts`
- `src/client/hud/layers/SendResourceModal.ts`
- `src/client/hud/layers/UnitDisplay.ts`
- `src/client/hud/layers/AttacksDisplay.ts`
- `src/client/controllers/BuildPreviewController.ts`
- `src/client/controllers/WarshipSelectionController.ts`
- `src/client/controllers/HoverHighlightController.ts`

The active construction entry point is the persistent bottom `BuildBar`, which
sets `UIState.ghostStructure`. `BuildPreviewController` owns placement
validation, preview rendering, and build/upgrade intent emission. The radial
menu remains the contextual surface for non-build actions.

## Guide Rule

Document command availability from both sides:

1. UI/client entry point: what the player can try to do.
2. Schema: what payload is legal.
3. Execution/state path: what actually mutates the game.

This separation matters because UI affordances, schema validity, and runtime legality are not identical.
