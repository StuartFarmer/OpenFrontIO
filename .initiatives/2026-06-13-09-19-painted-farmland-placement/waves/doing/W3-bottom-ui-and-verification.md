# W3: Bottom UI And Verification

**Status**: DOING
**Entry**: Paint mode works from an internal/debug command path.
**Exit**: Farmland is integrated into the bottom building UI and the full feature is verified.
**Parallelization**: 2 tracks: Track A = S3.1 UI integration, Track B = S3.2 regression tests, then S3.3 verification join
**Deliverables**: D4, D5

## Tickets

- S3.1-bottom-build-ui-integration.md
- S3.2-regression-test-pass.md
- S3.3-manual-smoke-and-docs.md

## Exit Criteria

- [x] Farmland is selectable from the bottom build area, not the right-click build menu.
- [x] Automated checks pass for core, client/controller, and build/typecheck coverage.
- [ ] Manual smoke pass covers painting, cancel, normal build placement, radial/context menu, and camera drag.

## Working Notes

- S3.1 integrated Farmland into the bottom BuildBar.
- Focused Vitest and `npm run build-dev` pass.
- Follow-up Foundation route fix: `src/games/foundation/client/FoundationPage.ts` now derives its bottom bar from the shared Foundation building catalog, so Farmland appears next to Grain Silo and Oil Tank there as well.
