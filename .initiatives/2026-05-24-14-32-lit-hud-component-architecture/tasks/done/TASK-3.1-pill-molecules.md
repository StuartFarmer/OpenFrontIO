# TASK-3.1: Pill Molecules

Status: done

## Goal

Create pill molecules that preserve the existing visual fidelity.

## Work

- Implement icon+label pill variants used by the control panel.
- Ensure icon fill follows text color where required.
- Avoid exposing internal utility class props.

## Done

- Existing pill styles can be reused through components.

## Result

Added `hud-pill` as a scoped Lit molecule with semantic `tone`, `value`, and `icon-src` properties. The HUD kit pill examples now use direct `<hud-pill>` tags.
