# TASK-1.1: Current API Audit

Status: done

## Goal

List every public HUD UI API currently used by demos and live layers.

## Work

- Search imports from `src/client/hud/ui`.
- Classify each import as component, helper, token, or theme.
- Identify live HUD files still using `HUD_*` constants or render helpers.

## Done

- Audit notes identify migration targets and compatibility boundaries.

## Result

Current public HUD UI imports are concentrated in:

- `src/client/hud/demo/HudPanelWorkbench.ts`
- `src/client/hud/layers/ControlPanel.ts`
- `src/client/hud/layers/PlayerInfoOverlay.ts`
- `src/client/hud/layers/AttacksDisplay.ts`
- `src/client/hud/layers/EventsDisplay.ts`
- `src/client/hud/layers/GameLeftSidebar.ts`
- `src/client/hud/layers/GameRightSidebar.ts`
- `src/client/hud/layers/Leaderboard.ts`
- `src/client/hud/layers/ReplayPanel.ts`
- `src/client/hud/layers/TeamStats.ts`
- `src/client/hud/layers/UnitDisplay.ts`

Class-token imports remain the dominant API:

- `HUD_*` constants are exported from `HudTheme.ts`, which re-exports `HudColors.ts`, `HudComposites.ts`, `HudMolecules.ts`, and `HudPrimitives.ts`.
- Live layers still import these constants directly from `../ui/HudTheme`.
- The HUD kit catalog still imports many constants from `../ui`.

Render helper imports remain in:

- `src/client/hud/demo/HudPanelWorkbench.ts`
- `src/client/hud/layers/ControlPanel.ts`
- `src/client/hud/layers/PlayerInfoOverlay.ts`

Actual custom elements currently live in:

- `src/client/hud/ui/HudComponents.ts`

Existing custom elements:

- `hud-mask-icon`
- `hud-icon-pill`
- `hud-meter`
- `hud-dual-range`
- `hud-blend-slider`

Light-DOM HUD layers remain common. `createRenderRoot()` appears in many HUD layer files, including `ControlPanel.ts`, `HudPanelWorkbench.ts`, `AttacksDisplay.ts`, `EventsDisplay.ts`, `Leaderboard.ts`, `UnitDisplay.ts`, and `PlayerInfoOverlay.ts`.

Migration targets:

- Replace `HUD_*` imports in live layers with direct custom elements as those elements are created.
- Replace `renderHud*` helper call sites with direct tags.
- Keep `LucideIcon.ts` as the icon rendering adapter unless a later ticket replaces it.
