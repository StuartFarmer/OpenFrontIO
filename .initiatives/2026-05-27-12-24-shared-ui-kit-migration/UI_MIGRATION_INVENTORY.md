# UI Migration Inventory

This inventory documents files under `src/client/components`, root-level app UI files, and HUD-layer UI files that either do not use the shared kit or only partially use it. "Convert to" names describe the intended `src/client/components/ui` primitive family, not current implementation names.

## Conversion Legend

- `ui-surface`: reusable panel/card/surface shell.
- `ui-modal-shell`: modal overlay, focus container, body and footer structure.
- `ui-modal-header`: reusable modal/back/close/title header.
- `ui-button`: normal button.
- `ui-icon-button`: icon-only button.
- `ui-action-group`: aligned action row/group.
- `ui-input`: text/number input.
- `ui-textarea`: textarea.
- `ui-select`: select/dropdown.
- `ui-range`: range slider.
- `ui-toggle`: checkbox/switch.
- `ui-pill`: badge/chip/pill.
- `ui-alert`: warning/error/info strip.
- `ui-list-row`: repeated row with leading/body/meta/actions slots.
- `ui-table`: table/grid display.
- `ui-stat-grid` / `ui-stat`: stats display.
- `ui-meter`: progress/meter display.
- `ui-empty-state` / `ui-loading-state`: status placeholders.

## Component UI Primitives Already Present

### `src/client/components/ui/ActionButton.ts`
- Does: functional button helper for player action panels.
- Current kit usage: it is part of `components/ui`, but not a custom element and is tightly styled for action cards.
- Convert to: either keep as a convenience wrapper over `ui-button`/`ui-action-card`, or replace with a custom element primitive.

### `src/client/components/ui/Divider.ts`
- Does: `ui-divider` separator.
- Current kit usage: already in target namespace.
- Convert to: keep, but align tokens/density with broader `ui-surface` spacing.

### `src/client/components/ui/ModalHeader.ts`
- Does: functional modal header with back button and title.
- Current kit usage: widely used by root app modals.
- Convert to: replace or wrap with a custom element `ui-modal-header` while preserving back-button callback and right-content slot.

## Base Components

### `src/client/components/baseComponents/Button.ts`
- Does: defines `<o-button>` with variants, sizes, icon positions, width modes, and translation key support.
- Current kit usage: older primitive, not `components/ui`.
- Convert to: make `ui-button` the canonical primitive; either wrap `<o-button>` around `ui-button` for compatibility or migrate callers to `ui-button`.

### `src/client/components/baseComponents/Modal.ts`
- Does: defines `<o-modal>` shell with inline/fullscreen behavior, backdrop, tabs, close handling, scroll body, and modal open-count overflow lock.
- Current kit usage: older primitive, not `components/ui`.
- Convert to: extract shell behavior into `ui-modal-shell`; preserve `inline`, `alwaysMaximized`, `hideCloseButton`, `tabs`, `activeTab`, `onTabChange`, and body scroll behavior.

### `src/client/components/baseComponents/ranking/GameInfoRanking.ts`
- Does: renders game ranking info composition.
- Current kit usage: no shared UI primitives detected.
- Convert to: `ui-surface`, `ui-stat-grid`, `ui-table`, and `ui-list-row` for ranking sections.

### `src/client/components/baseComponents/ranking/PlayerRow.ts`
- Does: ranking/player row display with rank, player metadata, score-like columns, and responsive row styling.
- Current kit usage: hand-styled display cells.
- Convert to: `ui-list-row` or `ui-table-row`/`ui-table-cell`; keep rank rendering as data content.

### `src/client/components/baseComponents/ranking/RankingControls.ts`
- Does: tab/filter controls and small action buttons for ranking views.
- Current kit usage: raw `<button>`.
- Convert to: `ui-segmented-control` for tabs/filters and `ui-button` for small actions.

### `src/client/components/baseComponents/ranking/RankingHeader.ts`
- Does: ranking header with action button.
- Current kit usage: raw `<button>`.
- Convert to: `ui-surface-header`, `ui-label`, `ui-action-group`, `ui-button`.

### `src/client/components/baseComponents/setting/SettingKeybind.ts`
- Does: keybind capture row with reset/capture buttons.
- Current kit usage: raw buttons and card styling.
- Convert to: `ui-form-row`, `ui-field-label`, `ui-pill` for key display, `ui-action-group`, `ui-button`.

### `src/client/components/baseComponents/setting/SettingNumber.ts`
- Does: number setting row with label and numeric input.
- Current kit usage: raw `<input type="number">`.
- Convert to: `ui-form-row`, `ui-field-label`, `ui-input`.

### `src/client/components/baseComponents/setting/SettingSelect.ts`
- Does: select setting row.
- Current kit usage: raw `<select>`.
- Convert to: `ui-form-row`, `ui-field-label`, `ui-select`.

### `src/client/components/baseComponents/setting/SettingSlider.ts`
- Does: slider setting row with custom range styling.
- Current kit usage: raw `<input type="range">`.
- Convert to: `ui-form-row`, `ui-field-label`, `ui-range`, optional value `ui-pill`.

### `src/client/components/baseComponents/setting/SettingToggle.ts`
- Does: setting toggle row with hidden checkbox and custom switch.
- Current kit usage: raw `<input type="checkbox">` plus custom switch classes.
- Convert to: `ui-form-row`, `ui-field-label`, `ui-toggle`.

### `src/client/components/baseComponents/stats/DiscordUserHeader.ts`
- Does: Discord user profile/header display.
- Current kit usage: hand-styled surface.
- Convert to: `ui-surface`, `ui-list-row`, `ui-pill`.

### `src/client/components/baseComponents/stats/GameList.ts`
- Does: game history/list display with local buttons.
- Current kit usage: raw buttons and hand-styled list sections.
- Convert to: `ui-list-row`, `ui-button`, `ui-empty-state`, `ui-loading-state`.

### `src/client/components/baseComponents/stats/PlayerStatsGrid.ts`
- Does: grid of player stats.
- Current kit usage: hand-styled stat cards.
- Convert to: `ui-stat-grid` and `ui-stat`.

### `src/client/components/baseComponents/stats/PlayerStatsTable.ts`
- Does: multiple stats tables.
- Current kit usage: raw table/surface styling.
- Convert to: `ui-table`, `ui-table-row`, `ui-table-cell`, wrapped in `ui-surface`.

### `src/client/components/baseComponents/stats/PlayerStatsTree.ts`
- Does: expandable stats tree with buttons.
- Current kit usage: raw buttons and custom rows.
- Convert to: `ui-list-row`, `ui-icon-button`, `ui-table` where tabular.

## Top-Level `src/client/components`

### `src/client/components/BaseModal.ts`
- Does: base class that renders `<o-modal>` and delegates modal config/content/header slots to subclasses.
- Current kit usage: depends on old `<o-modal>`.
- Convert to: preserve this compatibility class, but swap internals to `ui-modal-shell` once available.

### `src/client/components/CapIcon.ts`
- Does: icon-only visual component.
- Current kit usage: no shared primitive needed unless icon normalization is desired.
- Convert to: optional `ui-icon` if app-wide icon primitive is introduced.

### `src/client/components/ConfirmDialog.ts`
- Does: confirm dialog with buttons, checkbox/input behavior, and local modal/card styling.
- Current kit usage: raw buttons and input.
- Convert to: `ui-modal-shell`, `ui-modal-header`, `ui-alert`, `ui-toggle` or `ui-input`, `ui-confirm-actions`, `ui-button`.

### `src/client/components/CopyButton.ts`
- Does: copy-to-clipboard button with stateful copied feedback.
- Current kit usage: raw buttons.
- Convert to: `ui-button` or `ui-icon-button` with copied state variant; preserve clipboard logic and feedback timing.

### `src/client/components/CosmeticButton.ts`
- Does: selectable cosmetic button/card.
- Current kit usage: raw button/card styling.
- Convert to: `ui-list-row` or `ui-card-button`, plus `ui-pill` for owned/locked/price states.

### `src/client/components/CosmeticContainer.ts`
- Does: visual container/effects for cosmetics.
- Current kit usage: mostly custom visual behavior.
- Convert to: keep specialized effect component; use `ui-surface` only for static shell if needed.

### `src/client/components/CosmeticInfo.ts`
- Does: cosmetic metadata display.
- Current kit usage: hand-styled display.
- Convert to: `ui-surface`, `ui-label`, `ui-pill`.

### `src/client/components/CurrencyDisplay.ts`
- Does: currency display component.
- Current kit usage: no raw control evidence.
- Convert to: optional `ui-pill` or `ui-stat` if standardized display is desired.

### `src/client/components/DesktopNavBar.ts`
- Does: desktop logo/version nav.
- Current kit usage: hand-styled shell.
- Convert to: `ui-topbar`/`ui-surface-header` only if navigation primitives are added; otherwise keep as layout-specific.

### `src/client/components/Difficulties.ts`
- Does: difficulty definitions/data.
- Current kit usage: no UI migration needed.
- Convert to: no conversion.

### `src/client/components/FluentSlider.ts`
- Does: custom slider component with raw range inputs.
- Current kit usage: raw `<input type="range">`.
- Convert to: `ui-range` or deprecate in favor of shared `ui-range`; preserve current event/value API if used externally.

### `src/client/components/Footer.ts`
- Does: footer links and language selector.
- Current kit usage: hand-styled surface.
- Convert to: optional `ui-surface-footer` and `ui-icon-button` for links; low priority because it is mostly static.

### `src/client/components/GameConfigSettings.ts`
- Does: game configuration controls with buttons and setting rows.
- Current kit usage: raw buttons.
- Convert to: `ui-surface`, `ui-form-row`, `ui-button`, `ui-action-group`, and setting primitives.

### `src/client/components/IOSAddToHomeScreenBanner.ts`
- Does: install prompt/banner with multiple buttons.
- Current kit usage: raw buttons and alert/card styling.
- Convert to: `ui-alert` or `ui-surface`, `ui-action-group`, `ui-button`, `ui-icon-button`.

### `src/client/components/LobbyConfigItem.ts`
- Does: lobby config display item.
- Current kit usage: hand-styled card.
- Convert to: `ui-stat` or `ui-list-row`.

### `src/client/components/LobbyPlayerView.ts`
- Does: lobby player row/card with kick/host controls.
- Current kit usage: raw buttons and hand-styled row.
- Convert to: `ui-list-row`, `ui-pill`, `ui-action-group`, `ui-icon-button`.

### `src/client/components/MainLayout.ts`
- Does: legacy layout wrapper moving children into main content.
- Current kit usage: no shared primitives; currently a layout shell.
- Convert to: avoid this pattern for page composition; if retained, use a layout-specific `ui-page-shell` without relocating children manually.

### `src/client/components/MobileNavBar.ts`
- Does: mobile nav menu button/list.
- Current kit usage: raw button.
- Convert to: `ui-menu`, `ui-menu-item`, `ui-icon-button`; preserve `data-page` navigation hooks.

### `src/client/components/ModalOverlay.ts`
- Does: overlay component.
- Current kit usage: no raw control evidence.
- Convert to: merge behavior into `ui-modal-shell` if redundant.

### `src/client/components/NavNotificationsController.ts`
- Does: controller logic for nav notification state.
- Current kit usage: no UI migration needed.
- Convert to: no conversion.

### `src/client/components/NewsBox.ts`
- Does: news card with action buttons.
- Current kit usage: raw buttons and hand-styled card.
- Convert to: `ui-surface`, `ui-surface-header`, `ui-button`, `ui-empty-state`/`ui-loading-state`.

### `src/client/components/NotLoggedInWarning.ts`
- Does: warning/CTA row.
- Current kit usage: raw button/card.
- Convert to: `ui-alert` with `ui-button` action slot.

### `src/client/components/PatternPreview.ts`
- Does: visual pattern preview.
- Current kit usage: no generic UI migration needed unless wrapped in picker rows.
- Convert to: keep specialized visual.

### `src/client/components/PlayPage.ts`
- Does: homepage play screen shell with username and mode selector.
- Current kit usage: hand-styled page sections.
- Convert to: `ui-page-shell`, `ui-surface`, and shared spacing primitives; preserve simple first screen.

### `src/client/components/PlutoniumIcon.ts`
- Does: icon-only visual component.
- Current kit usage: no generic UI migration needed.
- Convert to: optional `ui-icon`.

### `src/client/components/PurchaseButton.ts`
- Does: purchase CTA buttons with variant styling and sparkle effects.
- Current kit usage: raw buttons.
- Convert to: `ui-button` with purchase variants; keep sparkle/effect as optional decorator.

### `src/client/components/RankedModal.ts`
- Does: ranked modal content and button.
- Current kit usage: uses `modalHeader`, still has raw button/content styling.
- Convert to: `ui-modal-shell`, `ui-modal-header`, `ui-button`, `ui-alert`.

### `src/client/components/SubscriptionPanel.ts`
- Does: subscription display and purchase actions.
- Current kit usage: uses `<o-button>` but hand-styles panels.
- Convert to: `ui-surface`, `ui-stat`, `ui-list-row`, `ui-button`.

### `src/client/components/ToggleInputCard.ts`
- Does: clickable card with checkbox/toggle input.
- Current kit usage: raw button/input/card styling.
- Convert to: `ui-toggle-card` or `ui-list-row` plus `ui-toggle`.

## Clan Components

### `src/client/components/clan/ClanBansView.ts`
- Does: banned users list with unban action.
- Current kit usage: raw button and hand-styled cards.
- Convert to: `ui-list-row`, `ui-button`, `ui-empty-state`.

### `src/client/components/clan/ClanBrowseView.ts`
- Does: browse/search clans UI with search input and action buttons.
- Current kit usage: raw input/buttons/cards.
- Convert to: `ui-input`, `ui-list-row`, `ui-button`, `ui-empty-state`, `ui-loading-state`.

### `src/client/components/clan/ClanCard.ts`
- Does: clan card button with metadata.
- Current kit usage: raw button/card styling.
- Convert to: `ui-list-row` or `ui-card-button`, `ui-pill`.

### `src/client/components/clan/ClanDetailView.ts`
- Does: clan detail panels and membership action buttons.
- Current kit usage: raw buttons and surface cards.
- Convert to: `ui-surface`, `ui-list-row`, `ui-stat-grid`, `ui-action-group`, `ui-button`, `ui-alert`.

### `src/client/components/clan/ClanManageView.ts`
- Does: clan management form, text inputs, textarea, toggle, danger actions, member rows.
- Current kit usage: raw buttons, inputs, textarea, custom toggle, cards.
- Convert to: `ui-surface`, `ui-form-row`, `ui-input`, `ui-textarea`, `ui-toggle`, `ui-action-group`, `ui-button`, `ui-alert`, `ui-list-row`.

### `src/client/components/clan/ClanMyRequestsView.ts`
- Does: user request rows and cancel button.
- Current kit usage: raw button and row cards.
- Convert to: `ui-list-row`, `ui-button`, `ui-empty-state`.

### `src/client/components/clan/ClanRequestsView.ts`
- Does: incoming request rows with accept/reject controls.
- Current kit usage: raw buttons and row cards.
- Convert to: `ui-list-row`, `ui-action-group`, `ui-button`.

### `src/client/components/clan/ClanShared.ts`
- Does: shared clan helpers for buttons, search input, selects, filter chips, progress bars, cards, rows.
- Current kit usage: many raw buttons, inputs, select, progress/card classes.
- Convert to: replace helpers with `ui-button`, `ui-input`, `ui-select`, `ui-pill`, `ui-meter`, `ui-list-row`, `ui-surface`.

### `src/client/components/clan/ClanStatsBreakdown.ts`
- Does: expandable stats rows.
- Current kit usage: raw button row.
- Convert to: `ui-list-row` with expandable state and `ui-icon-button`.

### `src/client/components/clan/ClanTransferView.ts`
- Does: clan transfer candidate rows and confirm action.
- Current kit usage: raw buttons and cards.
- Convert to: `ui-list-row`, `ui-button`, `ui-alert`.

## Leaderboard Components

### `src/client/components/leaderboard/LeaderboardClanTable.ts`
- Does: clan leaderboard table/list with retry/action buttons and loading/error/empty states.
- Current kit usage: raw buttons and hand-styled status cards.
- Convert to: `ui-table`, `ui-button`, `ui-loading-state`, `ui-empty-state`, `ui-alert`.

### `src/client/components/leaderboard/LeaderboardPlayerList.ts`
- Does: player leaderboard list/table with retry/action buttons and status states.
- Current kit usage: raw buttons and hand-styled status cards.
- Convert to: `ui-table`, `ui-list-row`, `ui-button`, `ui-loading-state`, `ui-empty-state`, `ui-alert`.

## Map Components

### `src/client/components/map/MapDisplay.ts`
- Does: map preview/display with hand-styled framing.
- Current kit usage: no controls, hand-styled display.
- Convert to: optional `ui-surface` or `ui-card` wrapper; keep map rendering specialized.

### `src/client/components/map/MapPicker.ts`
- Does: map selection grid with selectable buttons.
- Current kit usage: raw buttons.
- Convert to: `ui-card-button`/`ui-list-row`, `ui-segmented-control` or `ui-grid`, `ui-button`.

## Root App UI Files

### `src/client/AccountModal.ts`
- Does: account profile, auth states, Discord/email sign-in controls, stats sections.
- Current kit usage: `modalHeader`, some `<o-button>`, but also raw buttons/inputs/cards.
- Convert to: `ui-modal-shell`, `ui-modal-header`, `ui-surface`, `ui-input`, `ui-button`, `ui-stat-grid`, `ui-alert`.

### `src/client/ClanModal.ts`
- Does: clan modal router/shell and top-level clan sections.
- Current kit usage: `modalHeader`, still has raw buttons/cards.
- Convert to: keep view routing, convert shell/actions to `ui-modal-header`, `ui-surface`, `ui-button`, `ui-list-row`.

### `src/client/FlagInput.ts`
- Does: flag selector button.
- Current kit usage: raw button.
- Convert to: `ui-icon-button` or `ui-button` with image slot; preserve click event.

### `src/client/FlagInputModal.ts`
- Does: flag selection modal with input/search and confirm button.
- Current kit usage: `modalHeader`, `<o-button>`, raw input.
- Convert to: `ui-modal-header`, `ui-input`, `ui-button`, `ui-list-row`/grid item.

### `src/client/GameInfoModal.ts`
- Does: game info modal with ranking display.
- Current kit usage: `<o-modal>`, raw status display.
- Convert to: `ui-modal-shell`, `ui-loading-state`, `ui-alert`, `ui-table`.

### `src/client/GameModeSelector.ts`
- Does: homepage solo/create/join action buttons.
- Current kit usage: raw buttons.
- Convert to: `ui-button` or `ui-action-card`; preserve username validation before opening modals.

### `src/client/GameStartingModal.ts`
- Does: fixed game-starting modal/status overlay.
- Current kit usage: hand-styled modal/status box.
- Convert to: `ui-modal-shell` or `ui-surface` plus `ui-loading-state`.

### `src/client/HelpModal.ts`
- Does: large help/manual modal with many cards/tables/examples and one raw navigation button.
- Current kit usage: `modalHeader`; extensive hand-styled content.
- Convert to: `ui-modal-header`, `ui-surface`, `ui-table`, `ui-list-row`, `ui-button`, `ui-alert`. Content can remain data-driven/static but use primitives for repeated sections.

### `src/client/HostLobbyModal.ts`
- Does: private lobby host flow and start button.
- Current kit usage: `modalHeader`, `<o-button>`, hand-styled sections.
- Convert to: `ui-modal-header`, `ui-surface`, `ui-form-row`, `ui-button`, `ui-alert`.

### `src/client/JoinLobbyModal.ts`
- Does: join lobby form, code input, copy/share controls, player rows, warnings.
- Current kit usage: `modalHeader`, `<o-button>`, raw button/input/cards.
- Convert to: `ui-modal-header`, `ui-input`, `ui-button`, `ui-action-group`, `ui-list-row`, `ui-alert`.

### `src/client/LangSelector.ts`
- Does: language dropdown/button.
- Current kit usage: raw button.
- Convert to: `ui-select` or `ui-menu` depending current interaction; preserve current DOM placement and translation behavior.

### `src/client/LanguageModal.ts`
- Does: language selection modal with button rows.
- Current kit usage: `modalHeader`, raw buttons.
- Convert to: `ui-modal-header`, `ui-list-row`/`ui-menu-item`, `ui-pill`.

### `src/client/LeaderboardModal.ts`
- Does: leaderboard modal shell around leaderboard components.
- Current kit usage: `modalHeader`; body components are mostly raw.
- Convert to: `ui-modal-header`; convert nested leaderboard components separately.

### `src/client/Matchmaking.ts`
- Does: matchmaking modal with public/ranked CTA buttons.
- Current kit usage: `modalHeader`, raw buttons.
- Convert to: `ui-modal-header`, `ui-action-card` or `ui-button`, `ui-alert`.

### `src/client/NewsModal.ts`
- Does: news modal with fallback hidden button/control.
- Current kit usage: `modalHeader`, raw button.
- Convert to: `ui-modal-header`, `ui-button`, `ui-surface`.

### `src/client/PatternInput.ts`
- Does: pattern selector buttons.
- Current kit usage: raw buttons.
- Convert to: `ui-icon-button`/`ui-button` with preview slot; preserve pattern-input-click events.

### `src/client/SinglePlayerModal.ts`
- Does: solo game config modal, map controls, start action.
- Current kit usage: `modalHeader`, `<o-button>`, raw buttons and warning card.
- Convert to: `ui-modal-header`, `ui-surface`, `ui-form-row`, `ui-button`, `ui-alert`; preserve game start payloads.

### `src/client/Store.ts`
- Does: store modal shell.
- Current kit usage: `modalHeader`, body mostly delegated.
- Convert to: `ui-modal-header`, `ui-surface`, `ui-empty-state` where applicable.

### `src/client/TerritoryPatternsModal.ts`
- Does: territory pattern modal with search/input and action button.
- Current kit usage: `modalHeader`, `<o-button>`, raw input.
- Convert to: `ui-modal-header`, `ui-input`, `ui-button`, `ui-list-row`/grid item.

### `src/client/TokenLoginModal.ts`
- Does: token login status modal with loading/success display.
- Current kit usage: `modalHeader`, raw loading/status styling.
- Convert to: `ui-modal-header`, `ui-loading-state`, `ui-alert`.

### `src/client/TroubleshootingModal.ts`
- Does: troubleshooting modal with action button.
- Current kit usage: `modalHeader`, `<o-button>`, hand-styled content.
- Convert to: `ui-modal-header`, `ui-surface`, `ui-button`, `ui-alert`.

### `src/client/UserSettingModal.ts`
- Does: user settings modal using older setting components and modal header.
- Current kit usage: `modalHeader`, older setting components.
- Convert to: `ui-modal-header`, then migrate nested setting components to `ui-form-row`, `ui-input`, `ui-select`, `ui-toggle`, `ui-range`.

### `src/client/UsernameInput.ts`
- Does: username text inputs and validation/error display.
- Current kit usage: raw inputs and error popover.
- Convert to: `ui-input` plus `ui-alert`/validation message slot; preserve localStorage/state behavior.

## HUD-Layer UI Still Not Fully On Shared Components

### `src/client/hud/layers/ChatModal.ts`
- Does: chat modal with message input and raw buttons inside `<o-modal>`.
- Current kit usage: `<o-modal>`, raw buttons/input.
- Convert to: `ui-modal-shell`, `ui-input`, `ui-button`, `ui-list-row`; preserve chat dispatch and Enter behavior.

### `src/client/hud/layers/EmojiTable.ts`
- Does: emoji picker popover with close button and emoji buttons.
- Current kit usage: raw buttons and surface.
- Convert to: `ui-popover`/`ui-menu`, `ui-icon-button`, `ui-grid`, `ui-button`.

### `src/client/hud/layers/PlayerModerationModal.ts`
- Does: moderation modal with action buttons using `actionButton`.
- Current kit usage: `components/ui/ActionButton`, raw modal shell.
- Convert to: `ui-modal-shell`, `ui-modal-header`, `ui-action-group`, `ui-button`.

### `src/client/hud/layers/PlayerPanel.ts`
- Does: player action panel with many action buttons, dividers, player info sections, and raw panels.
- Current kit usage: `actionButton` and `ui-divider`, but no `hud/ui` primitives.
- Convert to: `ui-surface`, `ui-list-row`, `ui-action-group`, `ui-button`, `ui-pill`, `ui-divider`; preserve all event bus actions.

### `src/client/hud/layers/SendResourceModal.ts`
- Does: donate troops/gold modal, percent presets, capacity cap, slider, tooltip, summary, actions, Escape/Enter handling.
- Current kit usage: none; raw modal, buttons, range input, chip, tooltip, cap marker.
- Convert to: `ui-modal-shell`, `ui-modal-header`, `ui-pill`, `ui-segmented-control` or `ui-button-group` for presets, `ui-range` with cap marker support, `ui-stat`/summary row, `ui-confirm-actions`; preserve donation events and clamp logic exactly.

### `src/client/hud/layers/SettingsModal.ts`
- Does: in-game settings modal with many button rows and range controls.
- Current kit usage: raw buttons and range inputs.
- Convert to: `ui-modal-shell`, `ui-form-row`, `ui-range`, `ui-toggle`, `ui-button`, `ui-list-row`.

### `src/client/hud/layers/WinModal.ts`
- Does: win/loss modal with share/replay/exit buttons and result sections.
- Current kit usage: `<o-button>`, raw result surfaces.
- Convert to: `ui-modal-shell`, `ui-surface`, `ui-stat-grid`, `ui-button`, `ui-action-group`.

### `src/client/hud/layers/ChatDisplay.ts`
- Does: compact chat display with buttons.
- Current kit usage: raw buttons.
- Convert to: `ui-surface`, `ui-button`, `ui-list-row`.

### `src/client/hud/layers/BuildMenu.ts`
- Does: build menu action button(s).
- Current kit usage: raw button.
- Convert to: `ui-menu`, `ui-menu-item`, `ui-button`.

### `src/client/hud/layers/PerformanceOverlay.ts`
- Does: performance profiler overlay with reset/pause/close buttons and table-like sections.
- Current kit usage: raw buttons and custom CSS.
- Convert to: `ui-surface`, `ui-table`, `ui-button`, `ui-icon-button`; preserve draggable/debug behavior.

### `src/client/hud/layers/MultiTabModal.ts`
- Does: multi-tab warning modal.
- Current kit usage: raw modal/card styling.
- Convert to: `ui-modal-shell`, `ui-alert`, `ui-meter`, `ui-button`.

### `src/client/hud/layers/InGamePromo.ts`
- Does: in-game promo display.
- Current kit usage: hand-styled display.
- Convert to: `ui-surface`/`ui-alert` if retained.

## HUD-Layer Files Already Mostly On HUD Kit

These should eventually consume app-wide primitives or remain HUD-specific wrappers, but they are not the immediate raw-markup problem:

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

## Files With Little Or No Generic UI Migration Need

These files are either mostly data/controller/icon/render-specialized or need only optional wrapping:

- `src/client/components/CapIcon.ts`
- `src/client/components/CurrencyDisplay.ts`
- `src/client/components/Difficulties.ts`
- `src/client/components/NavNotificationsController.ts`
- `src/client/components/PatternPreview.ts`
- `src/client/components/PlutoniumIcon.ts`
- `src/client/components/map/MapDisplay.ts`
