# W5: StockFlow Convergence

**Status**: DONE
**Entry**: W1 and W3 completed; canonical dynamics core and binding shape are
stable enough to compare against older core StockFlow usage.
**Exit**: Older `StockFlow*` code is either migrated behind the canonical
dynamics surface or quarantined as internal compatibility code with explicit
import boundaries.
**Parallelization**: 2 tracks after audit: Track A = S5.2 migration/quarantine
decision, Track B = S5.3 parity boundary tests, then S5.4 joins.
**Deliverables**: D5

## Tickets

- S5.1-stockflow-usage-audit.md
- S5.2-stockflow-public-surface-decision.md
- S5.3-openfront-economy-parity-boundaries.md
- S5.4-stockflow-convergence-documentation.md

## Exit Criteria

- [x] There is one documented public dynamics surface.
- [x] `StockFlow*` is no longer an ambiguous peer authoring/runtime model.
- [x] OpenFront population/resource tests protect current behavior.

## Completion Notes

- Completed S5.1 through S5.4.
- Audited StockFlow usage and selected quarantine-first.
- Marked StockFlow core files as internal compatibility code.
- Added StockFlow production import-boundary tests.
- Revalidated OpenFront population/resource/player economy parity boundaries.
- Documented the final canonical dynamics vs StockFlow split.
