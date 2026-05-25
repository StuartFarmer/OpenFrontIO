# HUD Web Component Residuals

## Shadow Boundary Inventory

Reusable HUD kit primitives in `src/client/hud/ui/HudComponents.ts` use Lit's default Shadow DOM boundary and scoped component styles.

The touched live layers intentionally keep `createRenderRoot()` because they still own game-placement, responsive visibility, scroll containers, and integration hooks that depend on existing light-DOM/Tailwind behavior:

- `ControlPanel.ts`: mobile/desktop visibility, bottom-HUD placement, and meter label composition.
- `Leaderboard.ts`: panel sizing, scroll bounds, show-more placement, and alternate economy view width.
- `TeamStats.ts`: panel sizing, scroll bounds, and button placement.
- `PlayerInfoOverlay.ts`: fixed top overlay positioning and dynamic visibility classes.
- `GameRightSidebar.ts`: parent sidebar transform/visibility shell.
- `GameLeftSidebar.ts`: fixed sidebar placement, responsive width, and leaderboard layout container.
- `EventsDisplay.ts`: event-display positioning, scroll container query hook, and animation classes.
- `ReplayPanel.ts`: panel host remains light DOM for existing page integration; internal surface/header/control composition is canonical.
- `HudPanelWorkbench.ts`: catalog page layout and seeded live-panel demo wrappers.

No low-risk `createRenderRoot()` override was removed in this pass because each touched override still has live placement or global-layout responsibility outside the reusable HUD kit.

## Residual Raw Classes

Remaining raw Tailwind usage in touched files is classified as local layout/state styling, not reusable HUD component structure:

- Placement and sizing: fixed/relative positioning, responsive widths, scroll bounds, margins, and visibility transforms.
- Local content layout: meter label spans, player-name rows, flag/icon image positioning, demo page staging wrappers.
- State coloring: player/team colors, traitor timer coloring, pulse/scale animation for gold updates.
- Integration hooks: `events-container` query target and live demo frame classes.

Canonical web components now cover the reusable structures migrated by this initiative:

- Buttons, icon buttons, icons, labels, numbers, pills.
- Toolbar and timer label.
- Tables, table rows, and cells.
- Form rows, field labels, inputs, selects, ranges, dual ranges, blend sliders.
- Segmented controls.
- Event rows and action groups.
- Meters, stat grids, and stat cells.
- HUD surfaces, headers, and bodies.

The legacy `HUD_*` class-token system and string-export primitive/molecule files are removed from the HUD UI kit. Remaining `className` fields in event/radial data are payload metadata used by existing game message/menu logic; migrated event action rendering maps those event button hints to `hud-button` variants.
