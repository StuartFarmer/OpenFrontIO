# TASK-2.2: Icon, Label, And Number Atoms

Status: done

## Goal

Create reusable atoms for icons, HUD labels, and fixed-width quantity text.

## Work

- Standardize icon sizes and tones.
- Standardize label variants.
- Use the fixed-length quantity formatting rule for number display where appropriate.

## Done

- Attack rows, unit displays, pills, and resource labels can reuse these atoms.

## Result

Added scoped Lit atom components:

- `hud-icon`
- `hud-label`
- `hud-number`

Also added `formatHudQuantity(value)` for fixed-width quantity text using `k`, `m`, and `b` suffixes. The HUD kit atom catalog now shows icon sizes, icon tones, labels, and formatted numbers through direct custom element tags.
