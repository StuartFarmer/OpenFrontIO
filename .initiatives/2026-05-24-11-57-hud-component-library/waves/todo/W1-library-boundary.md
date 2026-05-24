# W1: Library Boundary

**Status**: TODO
**Entry**:
The initiative has analysis and the current HUD ad hoc elements have been inventoried.
**Exit**:
The HUD library boundary is documented in code structure and the first reusable exports are ready for migration.
**Parallelization**:
Sequential (1 owner). This wave defines shared files and naming, so parallel edits would conflict in `src/client/hud/ui`.
**Deliverables**:
D1

## Tickets
- S1.1-audit-ui-exports.md
- S1.2-define-library-boundary.md

## Exit Criteria
- [ ] Shared HUD exports have a clear primitive/molecule/composite boundary.
- [ ] Existing `HUD_*` exports remain compatible or have direct replacements.
