# Deliverables

## D1: Leaderboard and Stats HUD Tables
**Outcome**: Leaderboard and stats display surfaces use HUD table/button primitives.
**Demo**:
`npx tsc --noEmit`
**Acceptance Checks**:
- [ ] Player leaderboard rows render through `hud-table-*`.
- [ ] Clan leaderboard sorting remains functional through HUD controls.
- [ ] Stats tree/table surfaces do not emit raw table/action controls except inside primitives.
**Dependencies**: Existing `hud-table`, `hud-button`.
**Notes**: Preserve sticky current-user behavior and infinite scroll.

## D2: Game Setup and Lobby Controls
**Outcome**: Game setup, lobby, username/flag/pattern/language controls use HUD form/action primitives.
**Demo**:
`npx vite build --mode development`
**Acceptance Checks**:
- [ ] Solo/private/join game setup controls retain behavior.
- [ ] Card/toggle/input controls use HUD primitives.
- [ ] Keyboard/focus behavior is not regressed.
**Dependencies**: D1 not required.
**Notes**: This is highest interaction risk.

## D3: Clan Workflow Components
**Outcome**: Clan views use HUD buttons/list rows/tables for actions and repeated records.
**Demo**:
`npx tsc --noEmit`
**Acceptance Checks**:
- [ ] Browse/detail/manage/request/ban/transfer actions use HUD buttons.
- [ ] Confirmation and async mutation flows remain intact.
- [ ] Repeated clan records use consistent HUD row/table primitives where appropriate.
**Dependencies**: Existing confirm dialog conversion.
**Notes**: Convert one view group at a time.

## D4: Docs, News, Commerce, and Compatibility Cleanup
**Outcome**: Lower-priority surfaces use HUD primitives for chrome/actions while preserving content media.
**Demo**:
`npx vite build --mode development`
**Acceptance Checks**:
- [ ] Help modal tables use HUD table atoms where practical.
- [ ] News/ranked/install/purchase actions use HUD button primitives.
- [ ] Content images remain raw images.
**Dependencies**: D1-D3.
**Notes**: Avoid changing purchase/cosmetic behavior.

## D5: Audit and Regression Safety
**Outcome**: Remaining raw UI usage is either eliminated or explicitly classified as primitive internals/content media.
**Demo**:
`rg "<button\\b|<input\\b|<select\\b|<textarea\\b|<table\\b|<tr\\b|<td\\b|<th\\b" src/client -n`
**Acceptance Checks**:
- [ ] Raw usage list has no unexplained app-chrome controls.
- [ ] `npx tsc --noEmit` passes.
- [ ] Focused Vitest suite passes.
- [ ] `npx vite build --mode development` passes.
**Dependencies**: D1-D4.
**Notes**: The audit command will still report allowed primitive internals in `HudComponents.ts`.
