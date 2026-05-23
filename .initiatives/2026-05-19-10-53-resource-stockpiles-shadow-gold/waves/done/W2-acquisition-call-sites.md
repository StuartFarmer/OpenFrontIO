# W2: Acquisition Call Sites

**Status**: DONE
**Entry**: W1 is complete and resource APIs are available.
**Exit**: Central gold acquisition paths use resource payloads while preserving existing gold-shaped stats/events.
**Parallelization**: 2 parallel tracks after S2.1: Track A = S2.2 trade/train, Track B = S2.3 conquest/donation, then S2.4 audit.
**Deliverables**: D2, partial D4

## Tickets
- S2.1-passive-income-resource-payload.md
- S2.2-trade-and-train-resource-payloads.md
- S2.3-conquest-and-donation-resource-payloads.md
- S2.4-acquisition-compatibility-audit.md

## Exit Criteria
- [x] Worker/passive income uses `addResources(resourcesFromGoldAmount(...))`.
- [x] Trade and train rewards use resource payloads.
- [x] Conquest and donation compatibility paths use resource payloads.
- [x] Remaining direct `addGold()` calls are intentionally compatibility-only or test setup.

## Completion Notes
- Migrated the core current gold acquisition sources to resource payloads.
- Kept gold-shaped config, events, stats, and donation intent names for compatibility.
- Validated with targeted economy tests and `npx tsc --noEmit`.
