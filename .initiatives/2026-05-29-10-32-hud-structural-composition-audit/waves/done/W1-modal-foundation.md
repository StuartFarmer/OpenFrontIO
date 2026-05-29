# W1: Modal Foundation

**Status**: DONE
**Entry**: `o-modal` remains the shared modal shell and direct modal call sites still exist.
**Exit**: Modal surfaces compose through HUD modal primitives while preserving behavior.
**Parallelization**: Sequential (1 owner) because `BaseModal` and compatibility shell are shared write hotspots.
**Deliverables**: D1

## Tickets

- S1.1-base-modal-hud-shell.md
- S1.2-direct-modal-call-sites.md
- S1.3-modal-validation.md

## Exit Criteria

- [x] `BaseModal` uses HUD modal shell primitives.
- [x] Direct `<o-modal>` call sites are removed or routed through HUD modal composition.
- [x] `npx tsc --noEmit --pretty false` passes.
- [x] Modal-focused smoke paths are documented.

## Working Notes

- Started W1 execution.
- `BaseModal` now renders HUD modal primitives directly and owns the body scroll lock/open-count lifecycle.
- `ChatModal` and `GameInfoModal` were migrated off direct legacy modal usage.
- The `o-modal` compatibility shell remains registered only for compatibility and internally composes HUD primitives.
- Direct `<o-modal>`/`<o-button>` app call-site scan is clean.
- Focused compatibility smoke: `npx vitest run tests/client/components/UiComponents.test.ts`.
