# W4: Foundation Runtime Compiled Dynamics

**Status**: TODO
**Entry**: W3 completed; compiled dynamics graphs can simulate current editor systems.
**Exit**: Foundation food/population ticking is backed by compiled dynamics through a tested runtime adapter.
**Parallelization**: Sequential (1 owner) because runtime replacement must preserve parity before activation.
**Deliverables**: D4

## Tickets

- S4.1-foundation-economy-dynamics-definition.md
- S4.2-foundation-runtime-adapter.md
- S4.3-foundation-runtime-integration.md
- S4.4-remove-redundant-foundation-formulas.md

## Exit Criteria

- [ ] Foundation dynamics definition matches current food/troop formula behavior.
- [ ] Adapter parity tests pass before runtime integration.
- [ ] Runtime metrics come from the compiled dynamics path.
- [ ] Redundant old formula wrappers are removed or narrowed to compatibility shims.
