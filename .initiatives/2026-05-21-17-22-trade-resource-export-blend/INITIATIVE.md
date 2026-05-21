# Initiative: Trade Resource Export Blend

## Stack
- Language: TypeScript
- Package manager: npm
- Test runner: Vitest
- Build: TypeScript `tsc --noEmit`, Vite
- UI: Lit/custom HUD components, Pixi rendering
- CI: GitHub Actions present in repo, local scripts in `package.json`

## Goal

Convert train and trade ship payouts from equal resource shadow-gold payloads into resource payloads blended by the exporting player's current stockpile proportions.

## Problem Statement

Trade still treats the old gold payout scalar as if it should become the same amount of Biomass, Fuels, and Metals. That means a 10,000 trade payout produces 30,000 total resources and ignores the exporting player's resource composition. The desired behavior is for the old scalar to remain the total trade value, then be split into resources according to the sender/exporter's current blend.

## Success Definition

Train and trade ship recipients receive resource payloads whose summed total equals the previous gold payout amount, with proportions derived from the exporting player. Internal trade uses the player's own blend. External trade uses the sender's blend for both sender and receiver. Existing trade value calculations, stats values, train stop penalties, and ship distance scaling remain stable.

## Non-Goals
- Do not rename `trainGold` or `tradeShipGold` in this pass.
- Do not change stats schemas or historical stat meanings.
- Do not redesign trade spawning, routing, capture, or diplomacy rules.
- Do not add resource-specific UI/log copy in this pass unless required by tests.
- Do not remove legacy gold compatibility helpers.

## Constraints
- `Player.resources()` returns a cloned stockpile, so blend calculations should use that public API.
- `Player.addResources(...)` can update compatibility gold unless explicitly disabled; the current trade paths rely on default behavior.
- Trade scalar values are still named `gold` in config and stats; changing that naming would create a broader migration.
- Existing uncommitted AI changes are present in `src/core/execution/nation/NationStructureBehavior.ts` and `tests/NationStructureBehavior.test.ts`; this initiative should not revert or mix with them except through normal tests.

## Assumptions
- For train stops, the exporter is `trainExecution.owner()`.
- For normal trade ships, the exporter is `srcPort.owner()`.
- For internal trade, the same exporter blend is used for the player's own payout.
- For captured ships, the cleanest default is to treat the cargo as exported by `origOwner`, then award that blended cargo to the captor. This should be confirmed before implementation if captured trade behavior is important for the playtest.
- If the exporter has no resources, the fallback split should be even across Biomass, Fuels, and Metals while preserving the exact total.

## Risk Posture

Low to medium. The change is small in surface area, but trade payouts are high-volume economy inputs and are covered by several focused tests. The primary risk is accidentally preserving the old 3x total-resource payout or computing the destination blend after mutating the source player's resources.

## Next Step
Run planning for this initiative.
