# W1: Canonical Guide Scaffold

**Status**: DONE
**Entry**: Analysis exists and canonical `main@782702c1` worktree is available at `/private/tmp/openfront-main-analysis`.
**Exit**: The mdBook has a canonical mechanics section, placeholder chapters, and a source index that build cleanly.
**Parallelization**: Sequential (1 owner), because `docs/SUMMARY.md` and the new guide index are shared write hotspots.
**Deliverables**: D1, D2

## Tickets
- S1.1-source-index.md
- S1.2-mdbook-skeleton.md
- S1.3-build-check.md

## Exit Criteria
- [x] `docs/canonical-mechanics/SourceIndex.md` is populated from canonical `main`.
- [x] `docs/canonical-mechanics/README.md` and placeholder chapter files exist.
- [x] `docs/SUMMARY.md` links the canonical mechanics section.
- [x] `npm run docs:build` succeeds or a concrete environment blocker is recorded.

## Working Notes
- 2026-05-30: Started W1 execution locally.
- 2026-05-30: Added canonical mechanics source index, mdBook scaffold, and summary links. `npm run docs:build` succeeded.
