# W1: Missing HUD Primitives

**Status**: DONE
**Entry**: Current `HudComponents.ts` has core atoms/molecules but lacks table, form, toolbar, stat, and general event row components.
**Exit**: New canonical components exist and are documented through types/properties/slots in code.
**Parallelization**: 3 parallel tracks: Track A = S1.1 table/stat components, Track B = S1.2 form/range components, Track C = S1.3 toolbar/event components. S1.4 joins and validates shared APIs.
**Deliverables**: D1

## Tickets

- S1.1-table-stat-components.md
- S1.2-form-range-components.md
- S1.3-toolbar-event-components.md
- S1.4-component-api-validation.md

## Exit Criteria

- [x] New components compile under `npx tsc --noEmit`.
- [x] No public `HUD_*` class-token API is reintroduced.
- [x] Components have scoped styles and semantic properties.

## Completion Notes

- Added canonical table/stat, form/range, toolbar/timer, action-group, and event-row components.
- Verified with `npx prettier --write`, `npx tsc --noEmit`, `npx eslint src/client/hud/ui`, `rg "HUD_|className|inputClass|labelClass|contentClass|valueClass" src/client/hud/ui/HudComponents.ts -n`, and `git diff --check`.
