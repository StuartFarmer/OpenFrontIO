# W6. Cleanup, Guardrails, And Final Validation

## Goal

Remove avoidable duplication, document the final component boundary, and add checks that prevent future UI drift.

## Tickets

- `S6.1-cleanup-legacy-helpers.md`
- `S6.2-static-ui-drift-check.md`
- `S6.3-documentation-refresh.md`
- `S6.4-final-validation.md`

## Dependencies

- W1 through W5.

## Order

`S6.1`, `S6.2`, and `S6.3` can proceed after most migrations are complete. `S6.4` is the final closeout ticket.

## Done Criteria

- Legacy helpers are either migrated, wrapped, or explicitly documented.
- CI or local validation can detect new raw UI patterns in component files.
- Documentation matches the implementation.

