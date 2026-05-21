# Plan: Resource Trade Network MVP

**Stack**: TypeScript, npm, Vitest, Vite, Lit/custom HUD, Pixi/WebGL renderer
**Created**: 2026-05-21 18:19

## Summary
- Deliverables: 4
- Waves: 3
- Tickets: 4

## Execution Order
1. W1: Manifest Math
2. W2: Integrate Carriers
3. W3: Regression

## Links
- `INITIATIVE.md`
- `REPORT.md`
- `deliverables/DELIVERABLES.md`
- `waves/todo/`
- `tasks/todo/`

## Implementation Spine

1. Add pure delivery-time manifest calculation.
2. Replace train delivery minting with reciprocal resource exchange.
3. Replace ship delivery minting with reciprocal exchange and captured one-way transfer.
4. Validate focused trade/resource behavior and type safety.

## MVP Boundaries

- Keep train/ship spawning and random route selection unchanged.
- Treat existing trade scalar values as max payload sizes only.
- Allow empty deliveries silently.
- Do not add route capacity, fuel cost, market prices, cargo reservation, or target-blend UI in this pass.
