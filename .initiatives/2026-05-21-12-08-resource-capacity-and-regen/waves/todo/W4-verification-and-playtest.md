# W4: Verification And Playtest

**Status**: TODO
**Entry**: W1-W3 implementation is complete.
**Exit**: Automated validation and manual playtest confirm capped resource regen is stable and scoped.
**Parallelization**: 2 independent tickets, then 1 join ticket: S4.1 automated validation, S4.2 manual playtest, then S4.3 final audit.
**Deliverables**: D5

## Tickets
- S4.1-run-targeted-and-full-tests.md
- S4.2-single-player-capacity-playtest.md
- S4.3-final-scope-audit.md

## Exit Criteria
- [ ] Targeted resource/config/execution/update/UI tests pass.
- [ ] TypeScript result is recorded.
- [ ] Full `npm test` result is recorded.
- [ ] Manual playtest confirms capped resource behavior.
- [ ] Final audit confirms no terrain production or resource-specific costs were added.
