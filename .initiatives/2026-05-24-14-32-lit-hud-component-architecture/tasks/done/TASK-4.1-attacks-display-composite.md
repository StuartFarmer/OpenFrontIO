# TASK-4.1: Attacks Display Composite

Status: done

## Goal

Rebuild the attacks display from HUD atoms and molecules.

## Work

- Use icon atoms for attack type and action buttons.
- Use fixed-width number atom for quantities.
- Use a stretching label region for the target/attacker text.

## Done

- Attack rows match the agreed layout and use reusable components.

## Result

Added `hud-attack-row` as a composite component. `AttacksDisplay.ts` now renders attack rows through that component, with slotted primary icon, direction icon, action, fixed-width amount, and stretching label.
