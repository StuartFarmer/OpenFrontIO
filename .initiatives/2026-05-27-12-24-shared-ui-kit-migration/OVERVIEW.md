# Shared UI Kit Migration Overview

## Current Shape

The reusable UI layer is split across three directories.

`src/client/hud/ui` is the richest kit today. It defines components such as:

- layout and shell: `hud-surface`, `hud-surface-header`, `hud-surface-body`, `hud-surface-footer`, `hud-stack`, `hud-row`, `hud-grid`, `hud-split`
- controls: `hud-button`, `hud-icon-button`, `hud-input`, `hud-textarea`, `hud-select`, `hud-range`, `hud-dual-range`, `hud-blend-slider`, `hud-segmented-control`
- display primitives: `hud-label`, `hud-number`, `hud-pill`, `hud-meter`, `hud-stat-grid`, `hud-stat`, `hud-table`, `hud-table-row`, `hud-table-cell`
- feedback and modal/menu primitives: `hud-modal-header`, `hud-modal-body`, `hud-modal-footer`, `hud-alert`, `hud-toast`, `hud-confirm-actions`, `hud-menu`, `hud-menu-item`, `hud-tooltip`, `hud-popover`
- HUD/game composites: `hud-control-panel`, `hud-player-control-panel`, `hud-unit-display`, `hud-unit-button`, `hud-event-row`, `hud-attack-row`

`src/client/components/ui` is the shared app-wide primitive layer. It now contains:

- `UiComponents.ts`: reusable `ui-*` primitives for surfaces, modal shells, buttons, action groups, labels, pills, alerts, form controls, stats, tables/lists, loading/empty states, menus, and layout helpers.
- `ActionButton.ts`: compatibility helper now backed by shared button primitives.
- `Divider.ts`: `ui-divider`, kept as a compatibility primitive.
- `ModalHeader.ts`: compatibility helper now using shared icon-button behavior.

`src/client/components/baseComponents` has older app primitives:

- `Button.ts`: `<o-button>`
- `Modal.ts`: `<o-modal>`
- ranking, settings, and stats components with their own raw styling

The result is an inverted ownership model: the most complete primitives live under `hud`, while the application-wide component namespace has only partial helpers and older primitives.

## Intended Boundary

The shared primitive layer should live under `src/client/components/ui`.

Generic primitives live there:

- `ui-surface`
- `ui-surface-header`
- `ui-surface-body`
- `ui-surface-footer`
- `ui-button`
- `ui-icon-button`
- `ui-action-group`
- `ui-label`
- `ui-pill`
- `ui-input`
- `ui-textarea`
- `ui-select`
- `ui-range`
- `ui-stat-grid`
- `ui-stat`
- `ui-table`
- `ui-table-row`
- `ui-table-cell`
- `ui-list-row`
- `ui-form-row`
- `ui-modal-shell`
- `ui-modal-header`
- `ui-modal-body`
- `ui-modal-footer`
- `ui-alert`
- `ui-empty-state`
- `ui-loading-state`
- `ui-menu`
- `ui-menu-item`
- `ui-row`
- `ui-stack`
- `ui-grid`

HUD-specific pieces should remain under `src/client/hud/ui`:

- `hud-control-panel`
- `hud-player-control-panel`
- `hud-unit-display`
- `hud-unit-button`
- `hud-event-row`
- `hud-attack-row`
- any fixed-density or gameplay-only composites

The HUD kit can either wrap shared primitives or re-export HUD-themed aliases. The app should not need to import from `src/client/hud/ui` to render a normal modal, button, slider, table, stat, or card.

Compatibility wrappers remain during migration:

- `<o-button>` composes through `ui-button` / `ui-icon-button` while preserving its public attributes.
- `<o-modal>` keeps its existing open/close/body-scroll lifecycle and can migrate internals incrementally.
- `actionButton`, `modalHeader`, and `ui-divider` remain callable by existing files while later tickets move call sites to direct primitive composition.

## Conversion Principle

The migration should preserve behavior first and reduce styling duplication second.

Each conversion should keep:

- existing events and custom event names,
- modal open/close behavior,
- keyboard behavior,
- focus behavior,
- disabled states,
- translations,
- data attributes used by tests or code,
- state update timing,
- game event bus emissions,
- layout constraints such as pointer-events, fixed positioning, and mobile breakpoints.

The implementation surface should change from raw utility markup to composition:

```text
raw div/button/input classes
-> shared shell/control/display primitive
-> local component only owns behavior and data mapping
```

For example, `send-resource-modal` should keep its existing donation logic, percent presets, cap clamp, slider math, keyboard handling, and event dispatch. Only the modal shell, close button, available pill, preset buttons, range control, summary display, and footer buttons should move to shared primitives.

## Existing Shared Usage Evidence

Files already using `components/ui`:

- `src/client/AccountModal.ts`
- `src/client/ClanModal.ts`
- `src/client/FlagInputModal.ts`
- `src/client/HelpModal.ts`
- `src/client/HostLobbyModal.ts`
- `src/client/JoinLobbyModal.ts`
- `src/client/LanguageModal.ts`
- `src/client/LeaderboardModal.ts`
- `src/client/Matchmaking.ts`
- `src/client/NewsModal.ts`
- `src/client/SinglePlayerModal.ts`
- `src/client/Store.ts`
- `src/client/TerritoryPatternsModal.ts`
- `src/client/TokenLoginModal.ts`
- `src/client/TroubleshootingModal.ts`
- `src/client/UserSettingModal.ts`
- `src/client/components/RankedModal.ts`
- `src/client/hud/layers/PlayerPanel.ts`
- `src/client/hud/layers/PlayerModerationModal.ts`

Files already using the richer HUD kit:

- `src/client/hud/layers/AttacksDisplay.ts`
- `src/client/hud/layers/ControlPanel.ts`
- `src/client/hud/layers/EventsDisplay.ts`
- `src/client/hud/layers/GameLeftSidebar.ts`
- `src/client/hud/layers/GameRightSidebar.ts`
- `src/client/hud/layers/Leaderboard.ts`
- `src/client/hud/layers/PlayerInfoOverlay.ts`
- `src/client/hud/layers/ReplayPanel.ts`
- `src/client/hud/layers/TeamStats.ts`
- `src/client/hud/layers/UnitDisplay.ts`
- `src/client/sandbox/FoodSystemsSandbox.ts`
- `src/client/sandbox/PopulationFoodSystemsSandbox.ts`
- `src/client/sandbox/SandboxBalancer.ts`
- `src/client/sandbox/WarBattleSystemsSandbox.ts`

Files still strongly hand-styled are listed in `UI_MIGRATION_INVENTORY.md`.
