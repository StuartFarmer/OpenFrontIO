# W5: Final Audit

**Status**: TODO
**Entry**: All planned migration waves are complete.
**Exit**: Remaining non-HUD UI structure is categorized and validation passes.
**Parallelization**: Sequential final join ticket after W1-W4.
**Deliverables**: D6

## Tickets
- S5.1-final-raw-structure-audit.md
- S5.2-regression-build-and-notes.md

## Exit Criteria
- [ ] Raw control/table scan remains clean.
- [ ] Structural scan output is reduced and documented.
- [ ] `npx tsc --noEmit --pretty false`, focused Vitest tests, and `npx vite build --mode development` pass.
