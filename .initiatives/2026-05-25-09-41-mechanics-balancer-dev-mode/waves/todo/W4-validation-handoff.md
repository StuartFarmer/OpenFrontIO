# W4: Validation And Handoff

**Status**: TODO
**Entry**: W1-W3 are implemented and `/sandbox` is manually usable.
**Exit**: Targeted automated tests, build checks, manual verification, and handoff notes are complete.
**Parallelization**: 2 independent validation tickets (S4.1 and S4.2), then 1 join ticket (S4.3) for build/manual verification and handoff.
**Deliverables**: D5

## Tickets
- S4.1-core-validation.md
- S4.2-client-sandbox-tests.md
- S4.3-build-manual-handoff.md

## Exit Criteria
- [ ] Core formula and execution tests pass.
- [ ] Client sandbox lifecycle and UI tests pass.
- [ ] `npm run build-dev` passes or failures are recorded with cause.
- [ ] Manual `/sandbox` verification covers isolated and bot/nation scenarios.
- [ ] Handoff notes explain how tuned values can become master game configuration.
