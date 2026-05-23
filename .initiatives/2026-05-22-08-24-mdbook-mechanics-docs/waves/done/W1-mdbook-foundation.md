# W1: mdBook Foundation

**Status**: DONE
**Entry**: Analysis and plan are approved; existing docs and npm scripts are unchanged.
**Exit**: A local mdBook can be built from `docs/` through npm scripts, with existing docs reachable.
**Parallelization**: Sequential (1 owner) because `docs/` layout and `package.json` scripts are shared write hotspots.
**Deliverables**: D1

## Tickets
- S1.1-mdbook-bootstrap.md
- S1.2-book-structure.md
- S1.3-local-docs-workflow.md

## Exit Criteria
- [x] `npm run docs:build` builds the book when mdBook is installed.
- [x] Existing `docs/Architecture.md`, `docs/API.md`, and `docs/Auth.md` are represented in book navigation.
- [x] Missing-mdBook failure path gives a clear install instruction.
