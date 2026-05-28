# W6: AI, Client Updates, And Legacy Retirement

**Status**: DONE
**Entry**: W3, W4, and W5 migrated the major simulation families.
**Exit**: Turns, AI/nations, worker/client updates, and final validation run
against the systems runtime.
**Parallelization**: 2 parallel tracks: Track A = S6.1 intent bridge -> S6.2
AI/nations; Track B = S6.3 update payload parity; S6.4 and S6.5 join for
legacy retirement and full validation.
**Deliverables**: D6

## Tickets

- S6.1-intent-command-surface.md
- S6.2-ai-and-nation-command-migration.md
- S6.3-worker-client-update-parity.md
- S6.4-legacy-execution-retirement.md
- S6.5-full-validation-and-docs.md

## Exit Criteria

- [x] Intent and AI command paths use system-native surfaces or documented
      compatibility shims.
- [x] Worker/client updates remain stable.
- [x] Full validation passes and legacy execution status is explicit.

## Validation

`npx tsc --noEmit`, `npm run test`, `npm run build-prod`, and targeted systems
migration suites pass. Legacy execution status is explicit in
`src/core/systems/LegacyExecutionRegistry.ts`.
