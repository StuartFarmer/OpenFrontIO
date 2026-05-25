# W2: HUD Kit Catalog Migration

**Status**: DONE
**Entry**: New primitives from W1 are available.
**Exit**: `HudPanelWorkbench.ts` demonstrates all reusable HUD structure through canonical components.
**Parallelization**: Sequential (1 owner). The catalog is one write hotspot and should stay coherent.
**Deliverables**: D2

## Tickets

- S2.1-catalog-atoms-forms.md
- S2.2-catalog-molecules-tables-events.md
- S2.3-catalog-composites-toolbar-economy.md

## Exit Criteria

- [x] `/hud-kit.html` catalog examples no longer teach copied reusable Tailwind structures.
- [x] Atom, molecule, and composite sections remain complete and scrollable.
- [x] TypeScript and targeted ESLint pass for the catalog.
