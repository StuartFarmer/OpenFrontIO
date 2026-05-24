# TASK-3.2: Slider And Meter Molecules

Status: done

## Goal

Make meters, dual range sliders, and blend sliders proper molecule components.

## Work

- Keep knob and track styling consistent with the current HUD kit.
- Make blend slider inherit the dual-range behavior through composition or shared internal logic.
- Use semantic events for range and blend changes.

## Done

- Control panel and catalog can use direct slider/meter tags.

## Result

Updated slider and meter molecule usage:

- `hud-dual-range` now emits semantic `range-change` events while preserving legacy input events.
- `hud-blend-slider` now emits semantic `blend-change` events while preserving legacy input events.
- `hud-meter` supports semantic segment tones and `label-align`, while retaining compatibility class fields for old callers.
- The HUD kit catalog now uses direct slider and meter tags instead of render helpers.
