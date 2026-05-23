# W2: Metadata And Generator

**Status**: TODO
**Entry**: W1 is complete and mdBook can build static chapters.
**Exit**: TypeScript mechanics metadata can generate deterministic mdBook Markdown and be checked for drift.
**Parallelization**: 2 parallel tracks after S2.1: Track A = S2.2 generator CLI, Track B = S2.3 test/check harness; S2.4 joins both.
**Deliverables**: D2

## Tickets
- S2.1-mechanics-metadata-model.md
- S2.2-docs-generator-cli.md
- S2.3-generator-tests-check-mode.md
- S2.4-generated-docs-integration.md

## Exit Criteria
- [ ] Metadata exports are side-effect-free and do not import browser-only code.
- [ ] Generated output has stable ordering and formatting.
- [ ] `npm run docs:generate` and `npm run docs:check` are available.
