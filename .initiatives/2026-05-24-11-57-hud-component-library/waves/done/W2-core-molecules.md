# W2: Core Molecules

**Status**: DONE
**Entry**:
The HUD UI boundary is in place.
**Exit**:
The highest-value repeated HUD controls are reusable from `src/client/hud/ui`.
**Parallelization**:
2 parallel tracks after S2.1: Track A = S2.2 metric and pill molecules, Track B = S2.3 slider and meter molecules. S2.4 joins both tracks in `/hud-kit`.
**Deliverables**:
D2

## Tickets

- S2.1-normalize-icons-labels-and-colors.md
- S2.2-extract-metric-pill-and-segment-molecules.md
- S2.3-extract-slider-and-meter-molecules.md
- S2.4-demo-core-molecules-in-hud-kit.md

## Exit Criteria

- [x] Metric bars, pills, segmented controls, blend sliders, and mini meters no longer require copied Tailwind structure.
- [x] `/hud-kit` demonstrates each core molecule from the shared exports.

## Working Notes

- Started W2 locally in this session.
- Added shared HUD color tokens and render helpers for mask icons, icon pills,
  meters, dual range sliders, and blend sliders.
- Updated `/hud-kit` samples to consume the shared helpers.
- Verified with `npx tsc --noEmit`, `npx eslint src/client/hud/ui
  src/client/hud/demo/HudPanelWorkbench.ts`, and `git diff --check`.
