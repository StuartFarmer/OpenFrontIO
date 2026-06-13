# W1: Farmland Core And Render

**Status**: DOING
**Entry**: W0 model/intent decisions are complete.
**Exit**: Farmland can be built through core rules and appears as a 1x1 map visual with hover preview support.
**Parallelization**: 2 tracks after S1.1: Track A = S1.2 core tests, Track B = S1.3 rendering/preview
**Deliverables**: D1, D2

## Tickets

- S1.1-farmland-unit-plumbing.md
- S1.2-farmland-validation-tests.md
- S1.3-farmland-render-preview.md

## Exit Criteria

- [x] Farmland compiles through unit/config/update paths.
- [x] Core tests cover placement eligibility, duplicate rejection, and resource/cost behavior.
- [x] Renderer displays built farmland and preview without regressing existing structure ghosts.

## Working Notes

- S1.1 completed core plumbing and typecheck.
- S1.2 validation coverage was added with the core plumbing.
- S1.3 added renderer structure metadata and build verification.
