# W4: Docs, Commerce, and Compatibility Cleanup

**Status**: DONE
**Entry**: Help/news/purchase/install/ranked/modal compatibility surfaces still contain raw controls.
**Exit**: Remaining lower-priority app chrome uses HUD primitives; content media remains raw.
**Parallelization**: 2 tracks: docs/news tables/actions and commerce/install/modal actions; then final audit.
**Deliverables**: D4, D5

## Tickets
- S4.1-help-news-ranked.md
- S4.2-commerce-install-modal.md
- S4.3-final-raw-ui-audit.md

## Exit Criteria
- [x] Lower-priority action controls use HUD primitives.
- [x] Help tables are converted where practical.
- [x] Final raw UI audit is documented.
- [x] `npx tsc --noEmit`, focused tests, and `npx vite build --mode development` pass.

## Working Notes
- Started S4.1 by converting NewsModal, NewsBox, and RankedModal action controls.
- Converted HelpModal content tables to HUD table atoms and added wrapped table-cell support.
- Converted remaining commerce, install, modal compatibility, nav, and slider controls to HUD primitives.
- Raw app-level control/table scan is clean; remaining raw controls are the HUD primitive internals.
- Focused HUD/component regression suite passes: `npx vitest run tests/client/hud/ControlPanel.test.ts tests/client/graphics/layers/PlayerPanelKick.test.ts tests/client/hud/SendResourceModal.test.ts tests/client/components/UiComponents.test.ts`.
- `npx tsc --noEmit --pretty false` passes.
- `npx vite build --mode development` passes with the existing large chunk warning.
