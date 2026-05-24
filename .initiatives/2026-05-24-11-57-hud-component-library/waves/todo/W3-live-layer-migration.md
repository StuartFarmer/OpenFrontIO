# W3: Live Layer Migration

**Status**: TODO
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
- [ ] Live layers use shared HUD exports for the identified common structures.
- [ ] No gameplay event handling or state behavior changes are introduced.
