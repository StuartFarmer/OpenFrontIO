# W3: React Flow Editor

**Status**: TODO
**Entry**: Route shell, schema, simulator, and persistence service exist.
**Exit**: React Flow editor can render, edit, and persist dynamics graphs from the portable schema.
**Parallelization**: Sequential through dependency install and mount bridge, then 2 parallel tracks: Track A = S3.2 canvas mapping, Track B = S3.3 inspector; S3.4 joins with simulation controls.
**Deliverables**: D4, D5 UI foundation.

## Tickets

- S3.1-react-flow-dependency-and-bridge.md
- S3.2-node-canvas-and-palette.md
- S3.3-node-inspector.md
- S3.4-simulation-controls-and-trace.md

## Exit Criteria

- [ ] React Flow graph is generated from portable dynamics schema.
- [ ] Node edits update schema, not React Flow-only state.
- [ ] Simulation controls run against the schema/compiler path.
