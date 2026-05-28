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

The migration corrected the most important ownership issue: generic primitives now live in `src/client/components/ui`, while HUD-specific controls remain under `src/client/hud/ui`.

## Completed Migration Status

The shared app UI kit now covers the reusable shapes needed by homepage, lobby, settings, clan, leaderboard, modal, sandbox, and generic HUD overlay work:

- surfaces and modal shells
- buttons, icon buttons, action groups, inputs, textareas, selects, ranges, toggles, and checkboxes
- labels, pills, alerts, stat grids, stats, tables, list rows, loading states, empty states, menus, rows, stacks, and grids
- compatibility wrappers for `<o-button>`, `<o-modal>`, `actionButton`, `modalHeader`, and `ui-divider`

The app-facing migration touched:

- homepage and lobby surfaces: `PlayPage`, `GameModeSelector`, `SinglePlayerModal`, `JoinLobbyModal`, `GameStartingModal`, `LobbyConfigItem`, `MapPicker`, `NewsBox`
- root modals: account/help/flag/pattern/token/subscription flows
- settings/clan/leaderboard/stats surfaces and rows
- HUD overlays that are generic dialog/feed shells: send resources, moderation, chat/settings modal shells, emoji table, win/multitab modals, chat display, build menu surface wrapper, profiler controls

Remaining legacy UI is intentionally bounded rather than silently ignored. `tests/client/components/UiMigrationGuard.test.ts` blocks new ad hoc component files from introducing raw controls or obvious custom panel styling unless they are added to the documented legacy allowlist.

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

The app should not import from `src/client/hud/ui` to render a normal modal, button, slider, table, stat, or card. HUD layer files can import `ui-*` for generic dialogs and controls, but should keep `hud-*` for gameplay-dense panels, meters, event rows, attack rows, unit buttons, and resource-specific controls.

## Composition Examples

Shared modal shell:

```ts
html`
  <ui-modal-shell open>
    <ui-modal-header title="Settings" close-label="Close"></ui-modal-header>
    <ui-modal-body>
      <ui-alert tone="warning">Changes apply after restart.</ui-alert>
    </ui-modal-body>
    <ui-modal-footer>
      <ui-button variant="secondary">Cancel</ui-button>
      <ui-button variant="primary">Save</ui-button>
    </ui-modal-footer>
  </ui-modal-shell>
`;
```

Form row:

```ts
html`
  <ui-form-row label="Population growth">
    <ui-range min="0" max="1" step="0.01" value="0.3"></ui-range>
  </ui-form-row>
`;
```

Action group:

```ts
html`
  <ui-action-group align="right">
    <ui-button variant="secondary">Reset</ui-button>
    <ui-button variant="primary">Start</ui-button>
  </ui-action-group>
`;
```

Stats and list composition:

```ts
html`
  <ui-stat-grid columns="3">
    <ui-stat label="Food" value="2.4K" tone="success"></ui-stat>
    <ui-stat label="Population" value="44K"></ui-stat>
    <ui-stat label="Shortage" value="12%" tone="warning"></ui-stat>
  </ui-stat-grid>

  <ui-list-row>
    <span slot="leading">#1</span>
    <span>Player name</span>
    <ui-pill slot="meta" tone="gold">12K</ui-pill>
  </ui-list-row>
`;
```

Compatibility wrappers remain after this migration:

- `<o-button>` composes through `ui-button` / `ui-icon-button` while preserving its public attributes.
- `<o-modal>` keeps its existing open/close/body-scroll lifecycle and composes shared icon-button behavior.
- `actionButton`, `modalHeader`, and `ui-divider` remain callable by existing files with comments explaining why they remain.

These wrappers should not be expanded with new styling variants unless the same variant is also considered for the canonical `ui-*` primitive.

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
- `src/client/components/baseComponents/Button.ts`
- `src/client/components/baseComponents/Modal.ts`
- `src/client/components/baseComponents/setting/*`
- `src/client/components/baseComponents/stats/*`
- `src/client/components/clan/*`
- `src/client/components/leaderboard/*`
- `src/client/hud/layers/BuildMenu.ts`
- `src/client/hud/layers/ChatDisplay.ts`
- `src/client/hud/layers/ChatModal.ts`
- `src/client/hud/layers/EmojiTable.ts`
- `src/client/hud/layers/MultiTabModal.ts`
- `src/client/hud/layers/PerformanceOverlay.ts`
- `src/client/hud/layers/PlayerPanel.ts`
- `src/client/hud/layers/PlayerModerationModal.ts`
- `src/client/hud/layers/SendResourceModal.ts`
- `src/client/hud/layers/SettingsModal.ts`
- `src/client/hud/layers/WinModal.ts`

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
