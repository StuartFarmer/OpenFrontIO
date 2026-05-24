# W4: Catalog And Validation

**Status**: TODO
**Entry**:
Live HUD layers have been migrated to shared primitives and molecules.
**Exit**:
`/hud-kit` is the single source-of-truth catalog and validation checks pass.
**Parallelization**:
Sequential (1 owner). Catalog updates and validation depend on the final migrated component set.
**Deliverables**:
D4, D5

## Tickets
- S4.1-finalize-hud-kit-catalog.md
- S4.2-resolve-legacy-demo-overlap.md
- S4.3-run-validation.md

## Exit Criteria
- [ ] `/hud-kit` shows primitives, molecules, and complete HUD panels.
- [ ] Legacy demo overlap is resolved.
- [ ] TypeScript, ESLint, and diff whitespace checks pass.
