# Deliverables

## D1. Shared App UI Primitive Foundation

Create a reusable primitive layer in `src/client/components/ui` that can support app pages, modals, lobby UI, settings, clan/leaderboard screens, and HUD modal composition.

Acceptance criteria:

- Generic primitives exist for surface, modal structure, buttons, icon buttons, action groups, labels, pills, inputs, textareas, selects, ranges, toggles, form rows, stat grids, tables/lists, alerts, loading states, empty states, and menus where needed.
- Primitives preserve accessibility basics: labels, disabled state, focus handling, keyboard-friendly controls, and ARIA where relevant.
- HUD-specific primitives either compose from the shared layer or have a documented reason to remain HUD-only.

## D2. Compatibility Wrappers And Migration Path

Keep existing functionality stable while moving call sites from ad hoc markup and legacy helpers to shared primitives.

Acceptance criteria:

- Existing `<o-button>`, `<o-modal>`, `ActionButton`, `Divider`, and `ModalHeader` usage has a documented migration path.
- Compatibility wrappers preserve current public attributes/events while internally using the shared primitive layer where practical.
- New code has a clear import path and naming convention.

## D3. Homepage, Game Start, And Lobby Migration

Convert the critical entry path to shared components without changing solo/private/join functionality.

Acceptance criteria:

- Homepage/play page, game mode selector, username input, solo game modal, private lobby host/join modals, lobby config, lobby player list, map picker/display, and game-starting modal use shared primitives.
- Solo game, private game, and join game flows preserve current event behavior and routing.
- Removed or hidden nonessential homepage features stay removed/hidden if already intentionally simplified.

## D4. Root App Modal And Account Surface Migration

Convert root-level app modals and account/store/help/language/news/cosmetics surfaces to shared components.

Acceptance criteria:

- Modal shell behavior remains consistent across account, auth, store, subscription, help, news, troubleshooting, language, flag, pattern, and cosmetics screens.
- Translations remain functional and no raw translation keys are introduced.
- Existing close/cancel/confirm semantics and custom events remain unchanged.

## D5. Settings, Clan, Leaderboard, Ranking, And Stats Migration

Convert dense operational UI surfaces to shared form, table, stat, and modal primitives.

Acceptance criteria:

- Settings controls use shared input/select/range/toggle/form-row primitives while preserving bindings.
- Clan, leaderboard, ranking, stats, and game-info views use shared table/list/stat/surface primitives.
- Responsive behavior and scrolling remain usable on desktop and mobile widths.

## D6. HUD Modal And In-Game Overlay Migration

Convert in-game hand-built modals and overlays to the shared component model while preserving HUD-specific layout where appropriate.

Acceptance criteria:

- `SendResourceModal` is migrated as a high-signal reference pattern.
- Player panel, moderation modal, chat modal, settings modal, emoji table, win modal, multi-tab modal, performance overlay, chat display, build menu, and promo overlays are evaluated and migrated where appropriate.
- Game event dispatch, hotkeys, focus handling, and in-game pointer behavior are preserved.

## D7. Guardrails, Cleanup, And Documentation

Prevent new drift and leave a clear maintenance path.

Acceptance criteria:

- Duplicate raw styling helpers are removed or deprecated only after callers migrate.
- A static scan or lint-style test flags new raw UI patterns in component files unless explicitly allowed.
- Documentation is updated to explain shared versus HUD-specific components, migration rules, and examples.

