# W3: Live Panel Migration

**Status**: DONE
**Entry**: Catalog examples validate the new components and provide migration patterns.
**Exit**: Core live HUD panels use canonical components for repeated structures.
**Parallelization**: 2 parallel tracks after catalog: Track A = S3.1 tables/popovers, Track B = S3.2 controls/toolbars, then S3.3 events/economy join.
**Deliverables**: D3

## Tickets

- S3.1-table-panel-migration.md
- S3.2-control-toolbar-migration.md
- S3.3-events-economy-migration.md

## Exit Criteria

- [x] Core live HUD panels no longer duplicate canonical table/form/toolbar/event/stat structure.
- [x] Existing UI behavior and emitted events are preserved.
- [x] Validation passes for touched live HUD layers.
