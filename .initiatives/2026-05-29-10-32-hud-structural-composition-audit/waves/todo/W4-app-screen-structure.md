# W4: App Screen Structure

**Status**: TODO
**Entry**: Settings, store, account, lobby, ranking/profile, and utility screens use HUD controls but raw structural cards/rows.
**Exit**: Repeated screen structures compose HUD surfaces, rows, stats, alerts, and empty/loading primitives.
**Parallelization**: 3 parallel tracks after W1/W2: Track A = settings/account/auth, Track B = store/lobby, Track C = ranking/profile/map utility; then validation.
**Deliverables**: D5

## Tickets
- S4.1-settings-account-auth.md
- S4.2-store-lobby-structure.md
- S4.3-ranking-profile-map-structure.md
- S4.4-app-screen-validation.md

## Exit Criteria
- [ ] Repeated raw cards/rows are migrated where existing HUD primitives fit.
- [ ] Any missing primitive need is documented before implementation.
- [ ] Content media remains raw.
- [ ] Typecheck and focused screen tests pass.
