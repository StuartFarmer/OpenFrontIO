# W1: Mechanics Contract

**Status**: TODO
**Entry**: `INITIATIVE.md` and `REPORT.md` are complete, with `/sandbox`, copy/paste JSON, World-map isolation, and sandbox-only scope fixed.
**Exit**: Mechanics defaults, schema validation, and core formula reads are in place with default-preservation and custom-preset tests.
**Parallelization**: Sequential (1 owner) because `src/core/Schemas.ts`, `src/core/configuration/Config.ts`, and mechanics tests are shared write hotspots.
**Deliverables**: D1, D2

## Tickets
- S1.1-mechanics-defaults-schema.md
- S1.2-config-formula-integration.md
- S1.3-core-mechanics-tests.md

## Exit Criteria
- [ ] Optional mechanics config is represented in schema and types.
- [ ] `Config` reads mechanics values through one defaulted contract.
- [ ] Defaults preserve current resource/troop behavior.
- [ ] Custom mechanics values affect the intended formula outputs only.
