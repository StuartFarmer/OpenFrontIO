# W3: Compiled Dynamics Runtime

**Status**: DONE
**Entry**: W2 completed with a canonical current-style dynamics definition.
**Exit**: Dynamics definitions compile to executable runtime structures and drive deterministic simulation traces.
**Parallelization**: 2 parallel tracks after schema is stable: Track A = S3.1 compiler, Track B = S3.2 simulator fixtures, then S3.3 UI diagnostics joins both.
**Deliverables**: D3

## Tickets

- S3.1-graph-compiler.md
- S3.2-compiled-simulator.md
- S3.3-editor-compile-diagnostics.md

## Exit Criteria

- [x] Compiler rejects invalid graphs with clear diagnostics.
- [x] Simulator uses compiled structures, not raw React Flow nodes.
- [x] Current editor traces still render correctly.

## Working Notes

- Added the framework-neutral compiler and deterministic compiled simulator.
- Wired the editor simulator through the compiled path while preserving fallback handling for malformed drafts.
- Exposed compile diagnostics in the editor and disabled execution controls while invalid.
- Verification: `npx vitest run tests/games/foundation/dynamics/FoundationDynamicsCompiler.test.ts tests/games/foundation/dynamics/FoundationDynamicsSimulator.test.ts tests/games/foundation/dynamics/FoundationDynamicsModel.test.ts tests/games/foundation/client/FoundationDynamicsPage.test.ts` passed, 4 files / 21 tests.
