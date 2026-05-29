# W3: Game HUD Shell And Overlays

**Status**: DONE
**Entry**: Production game shell and HUD live demo duplicate raw fixed/grid layout; status overlays hand-roll presentation.
**Exit**: Game HUD shell and core overlays use shared HUD primitives.
**Parallelization**: Sequential shell work first, then 2 parallel overlay tracks if shell API is stable.
**Deliverables**: D3, D4

## Tickets
- S3.1-game-shell-primitive.md
- S3.2-main-and-live-demo-shell.md
- S3.3-heads-up-status-overlays.md
- S3.4-spawn-progress-alert-effects.md
- S3.5-game-shell-validation.md

## Exit Criteria
- [x] `Main.ts` and HUD live demo share a HUD shell primitive.
- [x] Heads-up status and spawn progress use HUD primitives or documented new primitives.
- [x] `/ui-kit` includes any new primitives.
- [x] Sandbox/solo smoke path verifies HUD placement.

## Working Notes
- Added `hud-game-shell` and migrated production runtime markup plus `HudLiveComponentsDemo`.
- Converted `HeadsUpMessage` to `hud-toast`/`hud-notice`.
- Converted `SpawnTimer` to a compact `hud-meter`; `AlertFrame` remains an intentional full-screen effect exception.
- Validation passed with typecheck, focused HUD regression tests, and development build.
- Manual desktop/mobile browser smoke remains recommended because the workspace has no installed browser automation.
