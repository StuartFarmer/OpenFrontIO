# W3: Core Mechanics Coverage

**Status**: TODO
**Entry**: W2 is complete and generated pages can be integrated into the book.
**Exit**: Initial generated mechanics coverage exists for the highest-value core balance surfaces.
**Parallelization**: 3 mostly independent metadata tracks, then 1 join ticket. Avoid concurrent edits to `Config.ts`; tracks should prefer separate metadata files and coordinate any `Config` API changes through S3.4.
**Deliverables**: D3

## Tickets
- S3.1-units-structures-catalog.md
- S3.2-economy-resources-catalog.md
- S3.3-combat-diplomacy-catalog.md
- S3.4-core-catalog-join-validation.md

## Exit Criteria
- [ ] Generated docs cover units, costs, construction, upgrades, economy, combat, spawn, diplomacy, nukes, SAMs, and warships at useful first-pass depth.
- [ ] Existing gameplay behavior is preserved by focused tests around catalog-backed values.
- [ ] Formula-backed mechanics are documented with inputs, units, and example outputs where direct data extraction is not practical.
