# W2: Menu Removal And Verification

**Status**: DONE
**Entry**: Bottom bar works with existing buildables.
**Exit**: Right-click build construction is removed as the primary mechanism and verification is complete.
**Parallelization**: 2 parallel tracks: Track A = S2.1 radial cleanup, Track B = S2.2 docs/help; S2.3 joins with full validation.
**Deliverables**: D3, D5

## Tickets

- S2.1-remove-radial-build-submenu.md
- S2.2-update-help-and-docs.md
- S2.3-final-verification.md

## Exit Criteria

- [x] Radial menu no longer exposes construction.
- [x] Help/docs describe the bottom build bar.
- [x] Build and test commands pass or failures are documented.

## Verification

- `npx vitest run tests/client/hud/BuildBar.test.ts tests/client/graphics/RadialMenuElements.test.ts`
- `npm run build-dev`
