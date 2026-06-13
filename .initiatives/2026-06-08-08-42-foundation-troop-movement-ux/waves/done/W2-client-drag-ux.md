# W2: Client Drag UX

**Status**: DONE
**Entry**: Runtime front contract exists and can execute uniform/focused commands.
**Exit**: Foundation canvas supports normal click broad push and owned-territory drag focused push.
**Parallelization**: 2 parallel tracks after S2.1: Track A = S2.2 gesture dispatch, Track B = S2.3 drag math helper/tests.
**Deliverables**: D3

## Tickets

- S2.1-owned-drag-mode.md
- S2.2-drag-command-dispatch.md
- S2.3-drag-focus-math.md

## Exit Criteria

- [x] Plain click dispatches uniform front mode.
- [x] Owned-territory drag dispatches focused front mode on pointer up.
- [x] Drag focus is capped and smooth.

## Working Notes

- 2026-06-08: Completed W2 client drag UX.
- 2026-06-08: Validation passed with `npx vitest run tests/games/foundation/client/FoundationPage.test.ts`.
