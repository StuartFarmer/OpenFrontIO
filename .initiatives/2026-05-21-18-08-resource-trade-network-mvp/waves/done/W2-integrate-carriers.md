# W2: Integrate Carriers

**Status**: DONE
**Entry**: W1 helper is complete and tested.
**Exit**: Trains and ships transfer existing resources at delivery time.
**Parallelization**: Sequential (1 owner). Train and ship integrations share the manifest helper and trade test fixtures.
**Deliverables**: D2, D3

## Tickets
- S2.1-train-resource-exchange.md
- S2.2-ship-resource-exchange.md

## Exit Criteria
- [x] Train station tests pass.
- [x] Trade ship tests pass.
- [x] Empty delivery cases are covered.

## Working Notes
- Started execution.
- Completed with `npx vitest run tests/core/game/ResourceTrade.test.ts tests/core/game/TrainStation.test.ts tests/core/executions/TradeShipExecution.test.ts`.
