# Analysis Report: HUD UI Migration Completion

## Executive Summary
- Highest impact remaining raw UI is in workflow screens: leaderboard tables, game setup/lobby controls, and clan management actions.
- HUD overlay debt is now mostly reduced; remaining raw usage in HUD primitive implementation is acceptable, while content imagery should stay as content.
- Several surfaces need either `hud-table` conversion or reusable HUD-compatible row/action helpers to avoid repeating bespoke button/table markup.
- Validation should be wave-based because the migration crosses many independently testable screens.

## Findings

### 1. Leaderboard and stats surfaces still use raw tables
- Evidence: `src/client/components/leaderboard/LeaderboardPlayerList.ts`, `src/client/components/leaderboard/LeaderboardClanTable.ts`, and residual stats/ranking files still contain raw `table/tr/td/th` or sort buttons.
- Impact: These pages visually diverge from the HUD table primitive and are a common source of spacing, overflow, and sticky-header bugs.
- Recommendation: Convert to `hud-table`, `hud-table-row`, and `hud-table-cell`; sort controls should use `hud-button` or `hud-icon-button`.
- Risk: Medium. Sorting, sticky user row, and infinite scroll behavior must be preserved.

### 2. Game setup and lobby controls have legacy buttons/inputs
- Evidence: `GameConfigSettings.ts`, `ToggleInputCard.ts`, `JoinLobbyModal.ts`, `UsernameInput.ts`, `FlagInput.ts`, `PatternInput.ts`, `LangSelector.ts`, `LobbyPlayerView.ts`, `MapPicker.ts`, and `Matchmaking.ts` still contain raw controls.
- Impact: These are user-facing startup paths and set expectations for the app before gameplay begins.
- Recommendation: Convert form controls to `hud-input`, `hud-select`, `hud-toggle`, `hud-button`, and `hud-command-choice` while preserving event contracts.
- Risk: High. Setup controls have many stateful handlers and keyboard/focus behavior.

### 3. Clan management has dense action surfaces with raw buttons
- Evidence: `src/client/components/clan/*` files contain raw buttons across browse, detail, manage, bans, requests, transfer, cards, and stats breakdown.
- Impact: Clan workflows have mixed styling and inconsistent action affordances.
- Recommendation: Convert actions to `hud-button`/`hud-icon-button`, repeated records to `hud-list-row`, and dense data to `hud-table` where appropriate.
- Risk: Medium-high. Async mutations and confirm flows must be preserved.

### 4. Help/docs content contains large raw tables and instructional imagery
- Evidence: `HelpModal.ts` uses extensive raw tables and images.
- Impact: Visual inconsistency remains, but much of the content is document/media rather than app chrome.
- Recommendation: Convert app chrome tables to `hud-table`; leave instructional images as content images unless they are icons in controls.
- Risk: Medium. The file is large and content-heavy; changes should be limited to table wrappers.

### 5. Commerce, news, mobile/install banners, and modal compatibility remain mixed
- Evidence: `PurchaseButton.ts`, `CosmeticButton.ts`, `NewsBox.ts`, `NewsModal.ts`, `RankedModal.ts`, `IOSAddToHomeScreenBanner.ts`, and `baseComponents/Modal.ts` still emit raw controls.
- Impact: Lower priority than game/clan/setup, but still undermines the “HUD primitives everywhere” rule.
- Recommendation: Convert action buttons and modal close controls to HUD primitives while preserving specialized content and animations.
- Risk: Medium. Purchase/cosmetic controls may rely on specific visual effects.

## Quick Wins
- Replace raw close/cancel/action buttons with `hud-button`/`hud-icon-button`.
- Replace raw sortable table header buttons with `hud-button`.
- Replace simple standalone inputs with `hud-input`.

## Medium Changes
- Convert leaderboard tables and stats trees to `hud-table`.
- Convert lobby/setup card controls to `hud-command-choice`, `hud-toggle`, and `hud-input`.
- Convert clan repeated rows to `hud-list-row`.

## High-Risk Decisions
- Whether `hud-command-choice` needs a richer card mode for `GameConfigSettings` and `ToggleInputCard`.
- Whether large help modal tables should be fully rewritten or only wrapped with HUD table atoms.
- Whether purchase buttons need a new `hud-commerce-button` primitive or can remain `hud-button` with effect spans.

## Guardrails
- Do not convert content media to `hud-icon`.
- Keep component public attributes/properties/events stable.
- Validate after every wave with `npx tsc --noEmit` and targeted tests/build.
- Treat raw controls inside `HudComponents.ts` as allowed implementation details.
