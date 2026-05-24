# TASK-4.3: Secondary HUD Composites

Status: done

## Goal

Migrate the remaining repeated HUD displays to the component tree.

## Work

- Review player info, unit display, right sidebar, leaderboard, events, and replay display.
- Replace shared ad hoc structures with components where the component already exists.

## Done

- Secondary panels stop inventing their own shared HUD UI patterns.

## Result

Migrated the unit build strip to `hud-build-item` in `UnitDisplay.ts`. This removes the repeated hotkey/icon/count markup from that live panel while preserving click and hover behavior.
