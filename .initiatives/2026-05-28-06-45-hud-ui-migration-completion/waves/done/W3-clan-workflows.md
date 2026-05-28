# W3: Clan Workflows

**Status**: DONE
**Entry**: Clan browse/detail/manage/request/ban/transfer surfaces still use raw action buttons.
**Exit**: Clan workflow actions and repeated records use HUD primitives consistently.
**Parallelization**: 3 independent tracks: browse/detail, manage/mutations, requests/bans/transfer; then one validation pass.
**Deliverables**: D3, D5 partial

## Tickets
- S3.1-clan-browse-detail.md
- S3.2-clan-manage-actions.md
- S3.3-clan-requests-bans-transfer.md
- S3.4-clan-validation.md

## Exit Criteria
- [x] Clan action buttons use HUD buttons.
- [x] Repeated rows use `hud-list-row` where appropriate.
- [x] Async mutation behavior is unchanged.
- [x] `npx tsc --noEmit` passes.

## Completion Notes
- Converted clan browse/detail, manage, request, ban, pending-request, transfer, and stats controls to HUD primitives.
- Used `hud-list-row` where rows contain other interactive content.
- Validated with raw-control scan, typecheck, and development build.
