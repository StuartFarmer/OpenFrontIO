# Plan: Mechanics Balancer Dev Mode

**Stack**: TypeScript, npm, Vite, Lit, Vitest, GitHub Actions
**Created**: 2026-05-25

## Summary
- Deliverables: 5
- Waves: 4
- Tickets: 13

## Execution Order
1. W1 Mechanics Contract
2. W2 Sandbox Lifecycle
3. W3 Balancer UI
4. W4 Validation And Handoff

## Wave Plan

### W1: Mechanics Contract
- Sequential because `src/core/Schemas.ts`, `src/core/configuration/Config.ts`, and formula tests are shared write hotspots.
- Establishes the mechanics defaults/schema and proves default preservation before any sandbox UI can rely on the contract.

### W2: Sandbox Lifecycle
- Two tracks after the solo start builder begins:
  - Track A: shared solo start builder, sandbox run marker, and side-effect bypass.
  - Track B: `/sandbox` route shell.
- Joins before W3 so the UI can target a real route and lifecycle.

### W3: Balancer UI
- Starts with shared pending/active mechanics state.
- Then splits JSON import/export from launch/run controls and diagnostics.
- Keeps pending mechanics values separate from active game state; restart applies pending values.
- Uses the HUD UI catalog primitives in `src/client/hud/ui/` as the default UI building blocks for controls, surfaces, indicators, rows, and diagnostics.

### W4: Validation And Handoff
- Core and client validation can run independently.
- Final build/manual verification joins the validation results and records handoff guidance for a future master mechanics configuration.

## Acceptance Commands
- `npx vitest run tests/core/configuration/ResourceCapacity.test.ts`
- `npx vitest run tests/core/executions/PlayerExecution.test.ts`
- `npx vitest run tests/client/LocalServer.test.ts tests/client/JoinLobbyModal.test.ts`
- `npx vitest run tests/client/sandbox`
- `npx tsc --noEmit`
- `npm run build-dev`
- `npm run start:client -- --host 127.0.0.1`

## Known Constraints
- `/sandbox` is a standalone developer route and should not be exposed through normal navigation.
- Mechanics presets are copy/paste JSON only: no named local presets, localStorage preset library, or file loading.
- Isolated mode uses the existing World map, with bots/nations controlled through sandbox launch settings.
- Sandbox runs must not archive or connect to achievements/stats.
- Mechanics changes apply on restart/start. Do not add live mechanics mutation.
- Private-lobby preset sharing is out of scope.
- The tuned output is expected to inform a future master mechanics configuration for all games.
- Sandbox UI should use the HUD UI catalog (`docs/HUD_UI_CATALOG_PLAN.md`, `src/client/hud/ui/`) rather than creating one-off Tailwind-heavy controls or panels.

## Links
- `INITIATIVE.md`
- `REPORT.md`
- `deliverables/DELIVERABLES.md`
- `waves/todo/`
- `tasks/todo/`
