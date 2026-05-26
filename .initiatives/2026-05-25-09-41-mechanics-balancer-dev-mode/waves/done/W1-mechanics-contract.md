# W1: Mechanics Contract

**Status**: DONE
**Entry**: `INITIATIVE.md` and `REPORT.md` are complete, with `/sandbox`, copy/paste JSON, World-map isolation, and sandbox-only scope fixed.
**Exit**: Mechanics defaults, schema validation, and core formula reads are in place with default-preservation and custom-preset tests.
**Parallelization**: Sequential (1 owner) because `src/core/Schemas.ts`, `src/core/configuration/Config.ts`, and mechanics tests are shared write hotspots.
**Deliverables**: D1, D2

## Tickets

- S1.1-mechanics-defaults-schema.md
- S1.2-config-formula-integration.md
- S1.3-core-mechanics-tests.md

## Exit Criteria

- [x] Optional mechanics config is represented in schema and types.
- [x] `Config` reads mechanics values through one defaulted contract.
- [x] Defaults preserve current resource/troop behavior.
- [x] Custom mechanics values affect the intended formula outputs only.

## Completion Notes
- Added mechanics defaults/schema/resolver in `src/core/configuration/MechanicsConfig.ts`.
- Added optional `GameConfigSchema.mechanics`.
- Routed `Config` resource/troop/biomass formulas through resolved mechanics values.
- Added focused default/custom mechanics coverage.
- Verified with `npx vitest run tests/core/configuration/ResourceCapacity.test.ts tests/core/executions/PlayerExecution.test.ts` and `npx tsc --noEmit`.
