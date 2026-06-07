# W2: Canonical Current Dynamics Definition

**Status**: DONE
**Entry**: W1 completed; stale deleted-module references no longer steer implementation.
**Exit**: Current Foundation dynamics graphs persist through a framework-neutral schema with migration from the current v1 JSON shape.
**Parallelization**: Sequential (1 owner) because schema, persistence, and React Flow mapping share the same model boundary.
**Deliverables**: D2

## Tickets

- S2.1-current-dynamics-schema.md
- S2.2-v1-persistence-migration.md
- S2.3-react-flow-schema-mapping.md

## Exit Criteria

- [x] Schema tests prove definitions, scenarios, view metadata, and runtime state are separate.
- [x] Existing saved/imported v1 systems still load.
- [x] Editor save/load/import/export behavior remains intact.
