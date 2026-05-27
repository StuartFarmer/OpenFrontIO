# Analysis Report: Shared UI Kit Migration

## Executive Summary
- The reusable UI ownership is inverted: `src/client/hud/ui/HudComponents.ts` has the complete primitive kit, while `src/client/components/ui` only has three small helpers. This makes app UI files either import HUD concepts or keep writing raw Tailwind markup.
- `src/client/components` has broad raw UI usage: direct buttons, inputs, cards, lists, tables, setting rows, clan rows, leaderboard rows, and modal body sections. The problem is systemic, not isolated to `SendResourceModal.ts`.
- Existing modal infrastructure is split between `components/ui/ModalHeader.ts`, `components/baseComponents/Modal.ts`, `components/baseComponents/Button.ts`, and raw modal implementations. This makes lifecycle-sensitive conversion risky unless shared primitives preserve existing `BaseModal` and `<o-modal>` behavior during migration.
- HUD overlays are mixed: several gameplay panels already use the HUD kit, but HUD modal-like pieces such as `SendResourceModal.ts`, `SettingsModal.ts`, `ChatModal.ts`, `EmojiTable.ts`, and `WinModal.ts` still hand-build controls.
- The safest migration strategy is to promote generic primitives into `src/client/components/ui`, then convert files by preserving behavior and replacing only visual shell/control markup.

## Findings

### 1. The complete UI kit lives in the wrong namespace
- Evidence:
  - `src/client/hud/ui/HudComponents.ts` defines the broadest primitive set: `hud-surface`, `hud-button`, `hud-icon-button`, `hud-action-group`, `hud-pill`, `hud-meter`, `hud-stat`, `hud-table`, `hud-input`, `hud-select`, `hud-range`, `hud-modal-header`, `hud-alert`, `hud-menu`, and more.
  - `src/client/components/ui` only defines `ActionButton.ts`, `Divider.ts`, and `ModalHeader.ts`.
  - `docs/HUD_UI_CATALOG_PLAN.md` describes the HUD kit as the catalog/workbench source, not an app-wide UI kit.
- Impact:
  - App components cannot compose a complete shared system from `src/client/components/ui`.
  - Developers naturally keep writing raw Tailwind markup in app modals and panels.
  - HUD-specific naming leaks into places where the concept is not HUD-specific.
- Recommendation:
  - Make `src/client/components/ui` the generic primitive namespace.
  - Keep HUD-specific composites in `src/client/hud/ui`.
  - Either move generic HUD primitives into `components/ui` or create equivalent app-wide components and migrate HUD usage to consume/wrap them.
- Risk:
  - Moving custom element tag names directly would be risky. A compatibility phase with aliases or wrappers is safer.

### 2. App modal UI is only partially standardized
- Evidence:
  - `src/client/components/BaseModal.ts` wraps `<o-modal>`.
  - `src/client/components/baseComponents/Modal.ts` defines `<o-modal>` with its own header/tabs/shell styling.
  - Many root modals import `modalHeader()` from `src/client/components/ui/ModalHeader.ts`, but still hand-build the body and action controls.
  - Examples: `SinglePlayerModal.ts`, `JoinLobbyModal.ts`, `AccountModal.ts`, `LanguageModal.ts`, `HelpModal.ts`, and `ClanModal.ts`.
- Impact:
  - Modal layout, close buttons, back buttons, headers, tabs, body padding, empty states, warning states, and action rows are inconsistent.
  - Accessibility behavior is fragmented across helper functions, `BaseModal`, and local raw buttons.
- Recommendation:
  - Keep `BaseModal` and `<o-modal>` behavior initially, but re-skin or wrap the modal internals with shared `components/ui` primitives.
  - Standardize modal body sections, footer actions, alert rows, tab bars, and empty/loading states.
- Risk:
  - Modal conversion can break route handling and close behavior if `BaseModal` semantics are not preserved.

### 3. `src/client/components` contains repeated raw control patterns
- Evidence:
  - Static scan found raw `<button>` or form controls in many component files, including `ConfirmDialog.ts`, `CopyButton.ts`, `GameConfigSettings.ts`, `IOSAddToHomeScreenBanner.ts`, `LobbyPlayerView.ts`, `NewsBox.ts`, `PurchaseButton.ts`, setting components, clan components, leaderboard components, and map picker components.
  - Repeated classes include `bg-white/5`, `border-white/10`, `rounded-xl`, `hover:bg-white/10`, `bg-zinc-*`, `ring-*`, and custom range input styling.
- Impact:
  - Every new UI change requires local styling edits across many files.
  - Small layout bugs, like zero-size custom element hosts or inconsistent button sizing, are more likely because each file owns box and control styling.
- Recommendation:
  - Add generic shared primitives for button, icon button, input, select, textarea, range, card/surface, list row, stat row, table, pill/badge, alert, empty state, loading state, and action group.
  - Convert files so local code owns data and behavior only.
- Risk:
  - Bulk migration can alter visual hierarchy if primitives are too opinionated. Keep variants explicit and preserve local density.

### 4. HUD usage is split between modern kit and older hand-built modal UI
- Evidence:
  - Modern HUD kit usage exists in `ControlPanel.ts`, `EventsDisplay.ts`, `Leaderboard.ts`, `PlayerInfoOverlay.ts`, `ReplayPanel.ts`, `TeamStats.ts`, and `UnitDisplay.ts`.
  - `SendResourceModal.ts` manually implements modal shell, close button, available chip, preset buttons, range slider, tooltip, cap marker, summary, and action buttons.
  - `SettingsModal.ts`, `ChatModal.ts`, `EmojiTable.ts`, `WinModal.ts`, `PlayerModerationModal.ts`, and `PlayerPanel.ts` still include raw buttons or older `components/ui` helpers.
- Impact:
  - In-game modals visually diverge from the HUD panels that were already migrated.
  - The exact same primitives exist in spirit but not in shared ownership.
- Recommendation:
  - Treat HUD modals as consumers of the app-wide component primitives, with HUD density/tone variants where needed.
  - Migrate `SendResourceModal.ts` early because it is a high-signal example of the exact problem.
- Risk:
  - HUD overlays rely on pointer-events, z-index, keyboard handling, and game event bus semantics. Conversion must be markup-local.

### 5. Existing component families overlap rather than compose
- Evidence:
  - `components/ui/ActionButton.ts` is a functional helper, not a web component.
  - `components/ui/ModalHeader.ts` is a functional helper, not a modal shell.
  - `components/baseComponents/Button.ts` defines `<o-button>`, while `hud/ui/HudComponents.ts` defines `hud-button`.
  - `components/baseComponents/setting/*` re-implement input/select/range/toggle patterns independently.
- Impact:
  - There is no single "use this button/input/range/surface" answer for a developer.
  - The codebase has multiple naming schemes: `ui-*`, `o-*`, `hud-*`, and raw helper functions.
- Recommendation:
  - Decide that `components/ui` owns app-wide primitives and naming.
  - Keep `o-*` as compatibility wrappers or migrate them after the primitive layer exists.
  - Keep `hud-*` only for gameplay-specific composites or aliases.
- Risk:
  - Renaming custom elements too early can break templates and tests. Use wrappers or compatibility exports.

## Quick Wins
- Convert `GameModeSelector.ts` raw action buttons to a shared button/action-card primitive.
- Convert `UsernameInput.ts` to a shared input primitive while preserving validation and error popover behavior.
- Convert `SendResourceModal.ts` visual shell to shared modal/button/pill/range/action-group primitives while preserving donation logic.
- Add shared `ui-surface`, `ui-button`, `ui-input`, `ui-range`, `ui-pill`, and `ui-action-group` primitives to `src/client/components/ui` before broad migration.
- Re-export or wrap HUD primitives so existing `hud-*` users can remain stable while app UI adopts `ui-*`.

## Medium Changes
- Convert app modals that already use `modalHeader()` and `<o-button>` so their body sections and local buttons use shared primitives.
- Replace `components/baseComponents/setting/*` local form controls with shared setting row, input, select, toggle, and range primitives.
- Convert clan and leaderboard list/card/table views to shared surface/list/table/action primitives.
- Convert `PlayerPanel.ts` from function helpers to shared component primitives once action button and divider primitives are stable.

## High-Risk Decisions
- Whether to move existing `hud-*` tag definitions into `components/ui` or create parallel `ui-*` primitives. Moving tags is riskier; wrappers are safer.
- Whether `<o-button>` and `<o-modal>` should become the shared components or be replaced by newer `ui-*` names. The current `<o-*>` components are widely used but not rich enough.
- How much HUD visual density should be available in generic `components/ui`. A single visual system is useful, but gameplay HUD and homepage/lobby modals have different density constraints.

## Guardrails
- Preserve custom event names and payloads.
- Preserve `BaseModal` open/close semantics.
- Preserve `inline` modal behavior.
- Preserve translation keys and `translateText` usage.
- Preserve keyboard behavior in modals and controls.
- Preserve disabled behavior and validation behavior.
- Preserve tests and data attributes where present.
- Avoid converting logic and visual markup in the same pass for complex files.

## Inventory

The per-file audit is in `UI_MIGRATION_INVENTORY.md`.
