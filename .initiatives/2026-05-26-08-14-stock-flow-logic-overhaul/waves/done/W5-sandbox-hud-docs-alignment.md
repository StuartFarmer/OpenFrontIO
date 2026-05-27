# W5: Sandbox, HUD, And Docs Alignment

**Status**: DONE
**Entry**: Explicit food/war stock-flow outputs exist.
**Exit**: Sandbox, HUD/dev diagnostics, and docs consume or describe the
runtime-backed model.
**Parallelization**: 3 independent tickets, then 1 join ticket: S5.1 sandbox,
S5.2 HUD/dev diagnostics, S5.3 docs, then S5.4 validation.
**Deliverables**: D5

## Tickets

- S5.1-sandbox-model-driven-graphs.md
- S5.2-hud-and-dev-diagnostics.md
- S5.3-economy-docs-alignment.md
- S5.4-full-validation-pass.md

## Exit Criteria

- [x] Sandbox graphs are model-driven.
- [x] HUD remains stable and dev diagnostics are scoped intentionally.
- [x] Docs match shipped behavior.
- [x] Typecheck, relevant tests, and docs build pass.

## Working Notes

- Added sandbox food controls and model-backed food graphs.
- Exposed optional diagnostics through `PlayerView`.
- Updated economy docs to match implemented stock-flow behavior.
- Final validation passed with typecheck, targeted tests, and docs build.
