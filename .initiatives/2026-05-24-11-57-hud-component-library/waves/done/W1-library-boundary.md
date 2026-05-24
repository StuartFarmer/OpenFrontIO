# W1: Library Boundary

**Status**: DONE
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

- [x] Shared HUD exports have a clear primitive/molecule/composite boundary.
- [x] Existing `HUD_*` exports remain compatible or have direct replacements.

## Working Notes

- Started W1 locally in this session.
- Completed S1.1 and S1.2.
- Verified `HudTheme.ts` remains a compatibility barrel over grouped HUD UI exports.
- Verified with `npx tsc --noEmit` and `npx eslint src/client/hud/ui`.
