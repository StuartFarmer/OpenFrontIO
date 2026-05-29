# Deliverables

## D1: HUD Modal System Consolidation
**Outcome**: Legacy modal surfaces compose through `hud-modal-shell`, `hud-modal-header`, `hud-modal-body`, and `hud-modal-footer`, with direct `<o-modal>` usage removed.
**Demo**:
`npx tsc --noEmit --pretty false`
**Acceptance Checks**:
- [ ] `BaseModal` preserves open/close, tabs, inline mode, max-width, and body-scroll behavior while using HUD modal primitives.
- [ ] Direct modal call sites in chat and game info no longer use `<o-modal>`.
- [ ] No direct `<o-modal>` usage remains outside a temporary compatibility wrapper, if retained.
**Dependencies**: None
**Notes**: This is the highest-leverage migration because many app modals inherit from `BaseModal`.

## D2: Homepage And Page Chrome HUD Composition
**Outcome**: Homepage layout, nav, footer, and game-mode entry screen use HUD layout primitives instead of bespoke raw surface/card wrappers.
**Demo**:
Open `/` and verify solo/private/join entry still displays and works.
**Acceptance Checks**:
- [ ] `DesktopNavBar`, `Footer`, `MainLayout`, `PlayPage`, and `GameModeSelector` compose HUD primitives where semantically appropriate.
- [ ] Brand/logo/media assets remain full-color media.
- [ ] Homepage does not regress into zero-height or hidden content.
**Dependencies**: D1 preferred but not strictly required
**Notes**: Keep visual changes conservative.

## D3: Game HUD Shell Primitive
**Outcome**: Production game HUD and live HUD demo share a reusable webcomponent shell for fixed/grid/safe-area layout.
**Demo**:
Open a sandbox/solo game and verify control panel, attacks, unit display, chat/events, sidebars, and overlays are positioned correctly.
**Acceptance Checks**:
- [ ] Raw game shell layout in `Main.ts` is replaced by a HUD shell primitive.
- [ ] HUD live demo uses the same primitive.
- [ ] Safe-area and responsive breakpoints keep current behavior.
**Dependencies**: D1
**Notes**: This should be isolated because it touches gameplay UI positioning.

## D4: HUD Status, Progress, And Overlay Primitives
**Outcome**: Heads-up status messages, spawn progress, and simple overlay status rows use shared HUD primitives or newly added documented HUD primitives.
**Demo**:
Open `/ui-kit` and verify new/updated primitives appear; run a sandbox/solo game to see spawn/pause/toast states.
**Acceptance Checks**:
- [ ] `HeadsUpMessage` uses HUD notice/toast primitives.
- [ ] Spawn progress uses `hud-meter` or a new `hud-progress-strip` primitive.
- [ ] New primitives are shown on the UI kit page.
**Dependencies**: D3 preferred for shell context
**Notes**: Preserve animation/timing behavior.

## D5: App Screen Structural Migration
**Outcome**: Settings, store, account, lobby, ranking/profile, and lightweight content components use HUD surface/list/stat/alert primitives for repeated card and row structures.
**Demo**:
Open settings, account, store/patterns, lobby create/join, leaderboard/ranked/profile views.
**Acceptance Checks**:
- [ ] Repeated raw cards/rows become HUD primitives.
- [ ] Functional controls and data flow remain unchanged.
- [ ] Content media stays raw where appropriate.
**Dependencies**: D1, D2
**Notes**: Execute in small screen-group tickets.

## D6: Final Audit And Regression Pass
**Outcome**: Remaining non-HUD UI structure is audited, categorized, and validated with typecheck, tests, build, and manual smoke paths.
**Demo**:
`npx vite build --mode development`
**Acceptance Checks**:
- [ ] Raw interactive control/table scan remains clean.
- [ ] Remaining structural raw markup is documented as layout/media/effect or ticketed.
- [ ] Typecheck, focused tests, and build pass.
**Dependencies**: D1-D5
**Notes**: The final audit should update initiative notes with remaining intentional exceptions.
