# W2: Homepage And Page Chrome

**Status**: DONE
**Entry**: Homepage layout/nav/footer entry surfaces still use raw structural wrappers.
**Exit**: Homepage and page chrome use HUD layout/surface/action primitives without changing entry behavior.
**Parallelization**: 2 parallel tracks after W1: Track A = nav/footer/layout, Track B = play page/game mode selector; then one validation ticket.
**Deliverables**: D2

## Tickets
- S2.1-nav-footer-main-layout.md
- S2.2-play-page-game-mode-selector.md
- S2.3-homepage-validation.md

## Exit Criteria
- [x] Homepage remains visible and scroll/layout dimensions are stable.
- [x] Solo, quick game, host private, and join game entry actions still work.
- [x] `npx tsc --noEmit --pretty false` and focused homepage smoke checks pass.

## Working Notes
- `DesktopNavBar`, `MobileNavBar`, `Footer`, `MainLayout`, `PlayPage`, and `GameModeSelector` now compose with HUD page/layout/action primitives.
- Existing homepage entry handlers were preserved.
- Validation passed with `npx tsc --noEmit --pretty false`, `npx vite build --mode development`, and static scans for replaced legacy wrappers.
- Manual browser smoke on `/` is still recommended because this workspace does not include local browser automation.
