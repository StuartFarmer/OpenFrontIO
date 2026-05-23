# W1: Core Unit Model

**Status**: DONE
**Entry**: Analysis complete and initiative folder exists.
**Exit**: Station and Silo compile as first-class buildable structures with costs, params, construction routing, stats keys, and renderer type constants, without changing behavior yet.
**Parallelization**: Sequential (1 owner). These tickets share high-conflict model files such as `Game.ts`, `Config.ts`, `ConstructionExecution.ts`, and renderer unit constants.
**Deliverables**: D1

## Tickets
- S1.1-unit-type-and-config.md
- S1.2-construction-and-stats.md
- S1.3-renderer-type-constants.md

## Exit Criteria
- [x] `npm run build-dev` reaches typecheck for the new unit types.
- [x] Station/Silo appear in buildability results when requested and not disabled.
- [x] No behavior has been moved off Factory yet beyond compile-required scaffolding.

## Completion Notes
- Added first-class Rail Station and Silo model/config/construction/stat/render constants.
- Validation: `npm run build-dev`.
