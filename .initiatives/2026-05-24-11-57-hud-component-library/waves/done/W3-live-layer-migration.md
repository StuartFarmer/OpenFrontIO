# W3: Live Layer Migration

**Status**: DONE
**Entry**:
Reusable HUD molecules are available and demonstrated in `/hud-kit`.
**Exit**:
High-value live HUD layers consume the shared library for common UI structures.
**Parallelization**:
3 tracks with limited overlap: Track A = S3.1 control panel, Track B = S3.2 player/unit displays, Track C = S3.3 events/sidebar/table shells. S3.4 joins with cleanup.
**Deliverables**:
D3

## Tickets

- S3.1-migrate-control-panel.md
- S3.2-migrate-player-and-unit-displays.md
- S3.3-migrate-events-sidebars-and-tables.md
- S3.4-remove-duplicate-ad-hoc-classes.md

## Exit Criteria

- [x] Live layers use shared HUD exports for the identified common structures.
- [x] No gameplay event handling or state behavior changes are introduced.

## Working Notes

- Started W3 locally in this session.
- Migrated control panel, player/unit displays, events/right sidebar, and
  leaderboard economy stat fragments to shared HUD exports/helpers.
- Left component-specific placement, scroll bounds, row state, and live data
  behavior intact.
- Verified with `npx tsc --noEmit`, targeted ESLint over migrated HUD files,
  and `git diff --check`.
