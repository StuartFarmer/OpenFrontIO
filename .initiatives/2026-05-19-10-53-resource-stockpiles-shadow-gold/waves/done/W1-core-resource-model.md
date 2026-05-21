# W1: Core Resource Model

**Status**: DONE
**Entry**: Initiative analysis is complete, and the feature branch has been created from the intended base.
**Exit**: Core resource types, helpers, player APIs, and compatibility wrappers exist with focused unit coverage.
**Parallelization**: Sequential (1 owner). `Game.ts` and `PlayerImpl.ts` are shared hotspots, so parallel edits would create avoidable conflicts.
**Deliverables**: D1, partial D4

## Tickets
- S1.1-resource-types-and-helpers.md
- S1.2-player-resource-api.md
- S1.3-core-resource-model-tests.md

## Exit Criteria
- [x] Resource types and conversion helper exist in core.
- [x] `Player` and `PlayerImpl` expose resource APIs.
- [x] Existing `gold()` / `addGold()` / `removeGold()` behavior remains compatible.
- [x] Focused core tests cover initialization, add, remove, and compatibility behavior.

## Completion Notes
- Implemented core resource types/helpers in `src/core/game/Resources.ts`.
- Added resource APIs and compatibility wrappers to `Player` / `PlayerImpl`.
- Added focused resource and construction compatibility tests.
- Validation passed with targeted Vitest runs and `npx tsc --noEmit`.
