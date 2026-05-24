# TASK-1.3: Compatibility Boundary

Status: done

## Goal

Prevent constants and helpers from remaining the accidental long-term API.

## Work

- Identify token files that should become internal.
- Identify helpers that can be removed after migration.
- Add short comments or docs marking compatibility-only exports.

## Done

- The migration path away from constants/helpers is explicit.

## Result

Compatibility boundary is documented in:

- `ARCHITECTURE.md`

Compatibility-only APIs during migration:

- `src/client/hud/ui/HudPrimitives.ts`
- `src/client/hud/ui/HudMolecules.ts`
- `src/client/hud/ui/HudComposites.ts`
- `src/client/hud/ui/HudControls.ts`
- `HUD_*` re-exports from `HudTheme.ts`

Allowed temporary usage:

- Existing live layers may continue to use `HUD_*` constants until their corresponding atom, molecule, or composite component exists.
- Existing render helpers may remain until their call sites are replaced by direct custom element tags.

Not allowed for new reusable components:

- New public `HUD_*` class constants as the primary API.
- New `renderHud*` helpers instead of custom elements.
- New arbitrary class properties that expose internal DOM styling.
