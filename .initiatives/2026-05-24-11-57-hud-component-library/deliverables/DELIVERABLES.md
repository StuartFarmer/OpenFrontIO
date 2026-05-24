# Deliverables

## D1: HUD Library Structure
**Outcome**:
`src/client/hud/ui` has a clear primitive/molecule/composite boundary that keeps Tailwind styling encapsulated behind reusable HUD exports.
**Demo**:
`npx tsc --noEmit`
**Acceptance Checks**:
- [ ] HUD primitives and molecules are discoverable from `src/client/hud/ui`.
- [ ] Existing `HUD_*` consumers keep working or are migrated with minimal churn.
- [ ] No new framework or broad architecture layer is introduced.
**Dependencies**:
None.
**Notes**:
Preserve `HudTheme.ts` as the compatibility anchor unless a small split is clearly cleaner.

## D2: Reusable HUD Molecules
**Outcome**:
Common controls such as metric bars, pills, segmented controls, dual/blend sliders, mini meters, tooltips, table shells, and panel shells are reusable without copying raw Tailwind.
**Demo**:
`npm run lint -- src/client/hud/ui src/client/hud/demo/HudPanelWorkbench.ts`
**Acceptance Checks**:
- [ ] The troop count segmented bar and resource blend slider are available as reusable molecules.
- [ ] Resource icon/label/% blend labels inherit the dual slider layout.
- [ ] Pill icon fill, numeric label width, and icon sizing behavior are expressed through shared HUD exports.
**Dependencies**:
D1.
**Notes**:
Only promote UI patterns that already exist in live HUD layers or `/hud-kit`.

## D3: Live HUD Layer Migration
**Outcome**:
High-value live HUD layers consume the shared library instead of owning duplicate Tailwind molecule structure.
**Demo**:
`npx eslint src/client/hud/layers/ControlPanel.ts src/client/hud/layers/PlayerInfoOverlay.ts src/client/hud/layers/UnitDisplay.ts src/client/hud/layers/EventsDisplay.ts src/client/hud/layers/GameLeftSidebar.ts src/client/hud/layers/GameRightSidebar.ts src/client/hud/layers/Leaderboard.ts src/client/hud/layers/TeamStats.ts`
**Acceptance Checks**:
- [ ] `ControlPanel` uses reusable molecules for metric bars, rate pills, and blend sliders.
- [ ] `PlayerInfoOverlay` uses a reusable mini meter.
- [ ] `UnitDisplay`, events, sidebars, leaderboard, and team stats use shared shell/table/tooltip/toolbar primitives where applicable.
**Dependencies**:
D1, D2.
**Notes**:
Do not change data flow or gameplay state updates.

## D4: Source-of-Truth HUD Kit
**Outcome**:
`/hud-kit` shows every supported primitive, molecule, and complete HUD panel from the shared library, and old demo overlap is resolved.
**Demo**:
`npm run start:client`
**Acceptance Checks**:
- [ ] `/hud-kit` demonstrates atoms, molecules, and composite HUD panels in one scrollable page.
- [ ] Catalog-only layout classes are separated from reusable component styling.
- [ ] Legacy demo pages are marked or removed from active usage after route confirmation.
**Dependencies**:
D1, D2, D3.
**Notes**:
This is the documentation and visual QA surface for future HUD panel work.

## D5: Validation Pass
**Outcome**:
The library migration is type-safe, lint-clean, and visually checked against the current HUD kit and representative live layers.
**Demo**:
`npx tsc --noEmit`
**Acceptance Checks**:
- [ ] TypeScript passes.
- [ ] ESLint passes for touched HUD files.
- [ ] `git diff --check` passes.
- [ ] `/hud-kit` visually shows the standardized components without obvious regressions.
**Dependencies**:
D1, D2, D3, D4.
**Notes**:
Use targeted checks; avoid adding a large test harness unless behavior changes require it.
