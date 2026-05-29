# Analysis Report: HUD Structural Composition Migration

## Executive Summary
- Highest impact: the legacy `o-modal` shell still anchors many app modals, so modal composition remains split between old compatibility wrappers and the HUD modal system.
- High impact: homepage and page chrome still hand-roll page layout, nav, footer, and action-group surfaces outside HUD primitives.
- High impact: the in-game HUD shell is duplicated as raw fixed/grid layout in production and demo paths, creating a shared layout hotspot that should become a HUD game-shell primitive.
- Medium impact: settings, store, account, lobby, ranking, and profile surfaces now use HUD controls but still build cards, rows, empty states, and sections with raw Tailwind.
- Lower impact: some raw media and special effect elements are correct to keep raw because they are content, not UI primitives.

## Findings

### 1. Legacy Modal Shell Still Owns Modal Composition
- Evidence:
  - `src/client/components/baseComponents/Modal.ts` defines `@customElement("o-modal")`.
  - `src/client/components/BaseModal.ts` renders `<o-modal>`.
  - Direct usages remain in `src/client/hud/layers/ChatModal.ts` and `src/client/GameInfoModal.ts`.
  - `src/client/components/baseComponents/Button.ts` still defines `@customElement("o-button")`, though no direct `<o-button>` call sites remain.
- Impact:
  - Modal layout, overlay behavior, close affordances, tab styling, and body scrolling remain split from `hud-modal-shell`, `hud-modal-header`, `hud-modal-body`, and `hud-modal-footer`.
  - Future modal work has two competing APIs.
- Recommendation:
  - Convert `BaseModal` to render HUD modal primitives directly.
  - Convert direct `<o-modal>` users to HUD primitives or to the updated `BaseModal` path.
  - Keep `o-modal` only as a temporary compatibility alias if needed, then remove it after call sites are gone.
- Risk:
  - Modal open-count/body-scroll behavior is shared and must be preserved.
  - Tabs need parity with the existing `BaseModal` configuration.

### 2. Homepage Chrome Is Still Structurally Raw
- Evidence:
  - `src/client/components/DesktopNavBar.ts` uses raw `nav`, logo wrapper, and backdrop classes.
  - `src/client/components/Footer.ts` uses raw footer/social link layout and inline SVG icon blocks.
  - `src/client/components/MainLayout.ts` owns raw page layout and responsive scroll sizing.
  - `src/client/components/PlayPage.ts` mixes `hud-surface` with raw page wrappers and mobile top bar.
  - `src/client/GameModeSelector.ts` uses HUD buttons but raw layout wrappers.
- Impact:
  - Homepage is visually adjacent to the HUD kit but not actually composed from the same layout primitives.
  - Future homepage fixes can drift from HUD spacing, surface, and toolbar conventions.
- Recommendation:
  - Introduce or reuse `hud-page-shell`, `hud-safe-area`, `hud-toolbar`, `hud-surface`, `hud-stack`, `hud-row`, and `hud-action-group` for page chrome.
  - Keep logos as full-color media, but place them inside HUD layout primitives.
- Risk:
  - Homepage had recent regressions around zero-height layout, so shell changes need direct browser smoke testing.

### 3. Game HUD Shell Is Duplicated Raw Layout
- Evidence:
  - `src/client/Main.ts` builds the game shell using raw fixed/grid wrappers around `attacks-display`, `control-panel`, `unit-display`, `chat-display`, `events-display`, sidebars, and modals.
  - `src/client/hud/demo/HudLiveComponentsDemo.ts` duplicates similar raw shell classes.
- Impact:
  - The most important runtime UI layout is still not a reusable webcomponent.
  - Fixes to positioning, safe area, z-index, responsive control-panel placement, and right sidebar layout must be duplicated.
- Recommendation:
  - Create a `hud-game-shell` or `hud-game-layout` primitive that exposes slots for center stack, right stack, top-right stack, overlays, and game canvas.
  - Migrate `Main.ts` and HUD live demo to that primitive together.
- Risk:
  - High visual/runtime risk because this touches the actual game play HUD. It should be a dedicated wave with screenshot/playtest validation.

### 4. HUD Overlays Still Hand-Roll Status/Alert Presentation
- Evidence:
  - `src/client/hud/layers/HeadsUpMessage.ts` uses raw fixed toast/message boxes.
  - `src/client/hud/layers/SpawnTimer.ts` uses raw fixed progress strip segments.
  - `src/client/hud/layers/AlertFrame.ts` uses a custom full-screen alert border.
  - `src/client/hud/layers/ImmunityTimer.ts` and `src/client/hud/layers/InGamePromo.ts` appear in the no-HUD structural scan.
- Impact:
  - High-visibility HUD status elements do not benefit from shared HUD notice/toast/progress primitives.
  - Repeated visual effects are not represented in the UI kit.
- Recommendation:
  - Convert `HeadsUpMessage` to `hud-toast` / `hud-notice` where possible.
  - Add a small HUD primitive for top progress strips if existing `hud-meter` does not fit.
  - Document alert-frame as an effect primitive or wrap it in a HUD-named component with demo coverage.
- Risk:
  - These are timing/animation-driven components. Visual parity and event behavior matter more than markup purity.

### 5. App Screens Use HUD Controls But Raw Structural Cards/Rows
- Evidence:
  - `src/client/UserSettingModal.ts`, `src/client/Store.ts`, `src/client/AccountModal.ts`, `src/client/JoinLobbyModal.ts`, and `src/client/TokenLoginModal.ts` show substantial raw structural layout.
  - `src/client/components/baseComponents/ranking/PlayerRow.ts`, `src/client/components/baseComponents/stats/DiscordUserHeader.ts`, and `src/client/components/map/MapDisplay.ts` appear in the no-HUD structural scan.
  - `src/client/components/leaderboard/*` and clan components use many HUD atoms but still keep some raw card/row wrappers.
- Impact:
  - The codebase has a half-migrated feel: controls are standardized, but surfaces and rows are not.
  - Visual consistency still depends on copy-pasted Tailwind classes.
- Recommendation:
  - Convert repeated cards/rows to `hud-surface`, `hud-list-row`, `hud-stat`, `hud-pill`, `hud-alert`, `hud-empty-state`, `hud-loading-state`, and `hud-scroll-area`.
  - Add only the missing primitives that remove real duplication, such as a media-card or section-heading primitive if repeated enough.
- Risk:
  - Broad but low-to-moderate if done screen group by screen group.

### 6. Raw Media Should Remain Raw
- Evidence:
  - Remaining `<img>` usage includes logos, screenshots, flags, maps, avatars, cosmetics, Markdown/news images, and full-color currency art.
  - `hud-icon` uses CSS masks and would flatten these to a single color.
- Impact:
  - Attempting to force full-color media through `hud-icon` would degrade visuals and break semantic media usage.
- Recommendation:
  - Keep content media raw or use purpose-built media webcomponents.
  - Use `hud-icon` / `hud-mask-icon` only for monochrome symbolic icons and icon slots.
- Risk:
  - Low, but this distinction should be documented so future audits do not chase false positives.

## Quick Wins
- Convert `HeadsUpMessage` toast/message presentation to existing HUD notice/toast primitives.
- Convert `TokenLoginModal` loading/success rows to `hud-loading-state`, `hud-alert`, and `hud-list-row`.
- Replace direct `<o-modal>` in `ChatModal` and `GameInfoModal`.
- Add UI kit examples for any new progress/status primitives.

## Medium Changes
- Migrate `BaseModal` from `o-modal` to HUD modal primitives while preserving open-count and tab behavior.
- Convert homepage shell/navigation/footer using HUD layout primitives.
- Convert settings/store/account/lobby structural cards and rows.
- Convert ranking/profile rows to HUD list/player/stat primitives.

## High-Risk Decisions
- Whether to remove `o-modal` entirely in the same initiative or keep it as a compatibility alias until all modal subclasses have been verified.
- Whether `hud-game-shell` should be generic layout infrastructure or game-specific to current HUD slots.
- Whether social/link icons in footer should become HUD icon buttons or remain branded full-color/link media wrappers.

## Guardrails
- Preserve full-color content media as media.
- No behavior changes to auth, lobby, matchmaking, game transport, ad loading, or store purchase logic.
- Every wave must end with `npx tsc --noEmit --pretty false`.
- UI-impacting waves should also run focused Vitest coverage and `npx vite build --mode development`.
- Run raw structural scans after each wave to measure progress rather than relying on subjective review.
