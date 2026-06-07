# W3: Compiled Dynamics Runtime

**Status**: TODO
**Entry**: W2 completed with a canonical current-style dynamics definition.
**Exit**: Dynamics definitions compile to executable runtime structures and drive deterministic simulation traces.
**Parallelization**: 2 parallel tracks after schema is stable: Track A = S3.1 compiler, Track B = S3.2 simulator fixtures, then S3.3 UI diagnostics joins both.
**Deliverables**: D3

## Tickets

- S3.1-graph-compiler.md
- S3.2-compiled-simulator.md
- S3.3-editor-compile-diagnostics.md

## Exit Criteria

- [ ] Compiler rejects invalid graphs with clear diagnostics.
- [ ] Simulator uses compiled structures, not raw React Flow nodes.
- [ ] Current editor traces still render correctly.
