# W1: Single Catalog Spine

**Status**: DONE
**Entry**:
`docs/HUD_UI_CATALOG_PLAN.md` exists and current HUD primitives are discoverable in `src/client/hud/ui/HudComponents.ts`.
**Exit**:
One shared manifest and catalog rendering path exist for all later element waves.
**Parallelization**:
Sequential (1 owner). The schema and renderer are shared write hotspots.
**Deliverables**:
D1

## Tickets
- S1.1-catalog-schema.md
- S1.2-seed-existing-elements.md
- S1.3-catalog-renderer-spine.md

## Exit Criteria
- [x] The manifest can represent category, status, API metadata, examples, source path, and migration notes.
- [x] Existing primitives from `HudComponents.ts` are seeded before new components are added.
- [x] `hud-kit.html` still loads and can show manifest-backed catalog sections.
