# Plan: Trade Resource Export Blend

**Stack**: TypeScript, npm, Vitest, Vite, Lit/custom HUD
**Created**: 2026-05-21 17:22

## Summary
- Deliverables: 4
- Waves: 2
- Tickets: 4

## Execution Order
1. W1: Trade Blend Core
2. W2: Ship Trade And Regression

## Links
- `INITIATIVE.md`
- `REPORT.md`
- `deliverables/DELIVERABLES.md`
- `waves/todo/`
- `tasks/todo/`

## Implementation Spine

1. Add `resourcesFromExportBlend(totalAmount, exporterResources)` without changing `resourcesFromGoldAmount`.
2. Wire train stop payouts to use the train owner's pre-payout blend.
3. Wire trade ship completion payouts to use the source/exporter's pre-payout blend.
4. Validate exact totals, rounding, zero-stockpile fallback, stats preservation, and type safety.

## Key Decision To Confirm

Captured trade ships should probably award cargo based on the original owner's export blend, because the captor is receiving stolen cargo rather than exporting their own resources. If the desired feel is "captor converts stolen trade into their economy mix," then S2.1 should use the captor's blend instead.
