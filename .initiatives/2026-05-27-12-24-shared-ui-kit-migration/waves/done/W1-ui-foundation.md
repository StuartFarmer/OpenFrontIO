# W1. Shared UI Foundation

## Goal

Create the shared app UI primitive layer and compatibility path that every later migration can rely on.

## Tickets

- `S1.1-ui-primitives.md`
- `S1.2-compatibility-wrappers.md`
- `S1.3-ui-kit-docs.md`
- `S1.4-primitive-validation.md`

## Dependencies

None.

## Order

1. Complete `S1.1`.
2. Complete `S1.2` and `S1.3` in parallel if desired.
3. Complete `S1.4` after the primitive and wrapper API exists.

## Done Criteria

- Shared primitives are available from `src/client/components/ui`.
- Existing wrappers have a defined compatibility strategy.
- Later tickets can migrate call sites without inventing new visual or structural patterns.

## Completion Notes

- Added shared `ui-*` primitives in `src/client/components/ui/UiComponents.ts`.
- Added `src/client/components/ui/index.ts` as the shared export path.
- Adapted `<o-button>`, `<o-modal>` close control, `actionButton`, and `modalHeader` toward shared primitives while preserving public usage.
- Documented the app-wide `ui-*` versus gameplay-specific `hud-*` boundary.
- Added `tests/client/components/UiComponents.test.ts`.

## Validation

- `npx tsc --noEmit`
- `npx vitest run tests/client/components/UiComponents.test.ts`
- `npx vitest run tests/client/hud/HudCatalog.test.ts tests/client/components/UiComponents.test.ts`
- `git diff --check`
