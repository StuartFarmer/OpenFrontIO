# Plan: Generic Protocol and Update Envelope Migration

**Stack**: TypeScript, npm, Vite, Vitest, Zod, Express/WebSocket, custom WebGL2 renderer
**Created**: 2026-05-29

## Summary
- Deliverables: 6
- Waves: 5
- Tickets: 12

## Execution Order
1. W0: Protocol Contract Baseline
2. W1: OpenFront Bridge
3. W2: Worker Update Transport
4. W3: Intent and Turn Transport
5. W4: Foundation Readiness and Documentation

## Parallelism

W0 is sequential because it establishes shared type names and schema boundaries. W1 has two parallel adapter tracks after W0. W2 and W3 can proceed in parallel after the OpenFront bridge is available because update transport and intent transport touch different hotspots, but their final integration should not be merged simultaneously without a full test run. W4 joins the results and should be last.

## Validation Commands
- `npm run build-dev`
- `npm test -- tests/core/systems/WorkerClientUpdateParity.test.ts`
- `npm test -- tests/GameUpdateUtils.test.ts`
- `npm test -- tests/server`
- `npm test -- tests/core/protocol`

## Links
- `INITIATIVE.md`
- `REPORT.md`
- `deliverables/DELIVERABLES.md`
- `waves/todo/`
- `tasks/todo/`
