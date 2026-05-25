# W3: Balancer UI

**Status**: TODO
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
- [ ] Pending and active mechanics states are visibly distinct.
- [ ] Sandbox panels, controls, rows, and diagnostics use cataloged HUD UI primitives where available.
- [ ] Copy/paste JSON import/export is validated.
- [ ] World-map isolated and bot/nation scenarios can be started from the UI.
- [ ] Pause/restart controls apply pending values only on restart.
- [ ] Diagnostics show enough current-state data to tune biomass and population growth.
