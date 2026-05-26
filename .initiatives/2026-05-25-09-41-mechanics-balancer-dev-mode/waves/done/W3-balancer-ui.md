# W3: Balancer UI

**Status**: DONE
**Entry**: W1 mechanics contract exists and W2 route/lifecycle shell exists.
**Exit**: `/sandbox` has usable HUD-kit-based controls, JSON import/export, launch settings, run controls, and diagnostics for biomass/resource/troop tuning.
**Parallelization**: 2 parallel tracks after S3.1 state model: Track A = S3.2 JSON import/export, Track B = S3.3 launch/run controls -> S3.4 diagnostics.
**Deliverables**: D4

## Tickets

- S3.1-balancer-state-controls.md
- S3.2-json-import-export.md
- S3.3-launch-run-controls.md
- S3.4-sandbox-diagnostics.md

## Exit Criteria

- [x] Pending and active mechanics states are visibly distinct.
- [x] Sandbox panels, controls, rows, and diagnostics use cataloged HUD UI primitives where available.
- [x] Copy/paste JSON import/export is validated.
- [x] World-map isolated and bot/nation scenarios can be started from the UI.
- [x] Pause/restart controls apply pending values only on restart.
- [x] Diagnostics show enough current-state data to tune biomass and population growth.

## Working Notes

- 2026-05-25: Completed the HUD-kit sandbox UI with pending/active mechanics, controls for population/resource/terrain values, copy/paste JSON import/export, isolated/scenario launch settings, pause/restart controls, and sandbox-only live diagnostics.
- 2026-05-25: Added reusable `hud-textarea` to the HUD kit/catalog for JSON editing.
- 2026-05-25: Validation passed: `npx vitest run tests/client/sandbox/SandboxBalancer.test.ts tests/client/hud/HudCatalog.test.ts`; `npx tsc --noEmit`.
