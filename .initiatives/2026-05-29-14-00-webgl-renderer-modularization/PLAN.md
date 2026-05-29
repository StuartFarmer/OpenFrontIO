# Plan: Custom WebGL Renderer Modularization

**Stack**: TypeScript, Vite, custom WebGL2, Lit HUD, Vitest.
**Created**: 2026-05-29

## Summary
- Deliverables: 5
- Waves: 4
- Tickets: 10

## Execution Order
1. W1 - inventory and contract boundaries.
2. W2 - OpenFront compatibility adapter.
3. W3 - Foundation minimal renderer adapter.
4. W4 - pass group modularization path.

## Wave Dependencies
- W1 is first and establishes the concrete contract.
- W2 and W3 can partially overlap after W1 if they avoid shared files, but the safest order is W2 before W3 so OpenFront remains the regression baseline.
- W4 depends on lessons from W2 and W3.

## Links
- `INITIATIVE.md`
- `REPORT.md`
- `deliverables/DELIVERABLES.md`
- `waves/todo/`
- `tasks/todo/`

## Validation Commands
- `npm run build-dev` - TypeScript and Vite build validation.
- `npm test` - Existing Vitest suite.
- Targeted tests should prefer existing renderer/client test locations under `tests/client/` and `tests/util/`.
