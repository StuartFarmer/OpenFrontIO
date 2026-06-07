# W2: Schema-First Editor Persistence

**Status**: DONE
**Entry**: W1 completed with a neutral canonical dynamics core.
**Exit**: Foundation editor saves/loads canonical schema/view/scenario objects
while React Flow remains only a UI projection.
**Parallelization**: 2 tracks after storage API is established: Track A = S2.2
editor projection, Track B = S2.3 built-in projection cleanup, then S2.4 joins.
**Deliverables**: D2

## Tickets

- S2.1-v2-storage-primary-api.md
- S2.2-react-flow-projection-layer.md
- S2.3-schema-first-builtins.md
- S2.4-editor-save-load-flow.md

## Exit Criteria

- [x] Storage APIs expose canonical v2 systems as primary data.
- [x] React Flow node/edge types are isolated to UI mapping code.
- [x] Editor save/load/import/export behavior remains compatible.

## Completion Notes

- Completed S2.1 through S2.4.
- Saved libraries and built-ins are canonical `DynamicsSavedSystem` records.
- React Flow imports are confined to `src/games/foundation/dynamics/react`.
- Wave validation:
  - `npx eslint src/games/foundation/dynamics/FoundationDynamicsStorage.ts src/games/foundation/dynamics/FoundationDynamicsModel.ts src/games/foundation/dynamics/react/FoundationDynamicsReactFlowMapping.ts src/games/foundation/dynamics/react/FoundationDynamicsReactBridge.tsx src/games/foundation/client/FoundationDynamicsPage.ts tests/games/foundation/dynamics/FoundationDynamicsModel.test.ts tests/games/foundation/dynamics/FoundationDynamicsReactFlowMapping.test.ts tests/games/foundation/dynamics/FoundationEconomyDynamics.test.ts tests/games/foundation/client/FoundationDynamicsPage.test.ts`
  - `npx vitest run tests/games/foundation/dynamics/FoundationDynamicsSchema.test.ts tests/games/foundation/dynamics/FoundationDynamicsModel.test.ts tests/games/foundation/dynamics/FoundationDynamicsReactFlowMapping.test.ts tests/games/foundation/dynamics/FoundationEconomyDynamics.test.ts tests/games/foundation/client/FoundationDynamicsPage.test.ts tests/games/foundation/dynamics/FoundationDynamicsCompiler.test.ts tests/games/foundation/dynamics/FoundationDynamicsSimulator.test.ts`
