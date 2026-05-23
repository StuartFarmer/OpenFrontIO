# Deliverables

## D1: First-Class Station And Silo Units
**Outcome**: `RailStation` and `Silo` exist as buildable structure unit types across the deterministic model, construction pipeline, config costs, stats, renderer unit constants, and buildability queries.
**Demo**:
`npm run build-dev`
**Acceptance Checks**:
- [ ] `UnitType.RailStation` and `UnitType.Silo` are represented in structure/buildable type groups and unit params.
- [ ] Construction can create both structures and respects disabled-unit config, cost, spacing, and upgrade behavior.
- [ ] Existing Missile Silo and SAM Launcher remain valid simulation unit types.
**Dependencies**: None
**Notes**: Use `RailStation` internally to avoid confusion with the runtime `TrainStation` class; display copy can say "Station" or "Rail Station".

## D2: Factory Benefits Split Into Station And Silo
**Outcome**: Factories no longer provide rail connectivity/train-station behavior or stockpile capacity. Rail Stations own rail connection behavior. Silos own stockpile capacity.
**Demo**:
`npx vitest run tests/core/configuration/ResourceCapacity.test.ts tests/core/game/RailNetwork.test.ts tests/core/game/TrainStation.test.ts`
**Acceptance Checks**:
- [ ] Completed Silo levels increase resource stockpile capacity; under-construction Silos do not.
- [ ] Factory levels no longer increase stockpile capacity.
- [ ] Rail Station creates rail-node behavior previously attached to Factory.
- [ ] Factory construction no longer creates train stations or rail connections.
**Dependencies**: D1
**Notes**: The train-spawning decision must be explicit. For this plan, preserve current economy by moving train spawning from Factory to Rail Station unless implementation direction changes before execution.

## D3: Player Build UI Replaces SAM/Missile Entries With Station/Silo
**Outcome**: The build menu, radial build wheel, bottom build strip, hotkeys, counts, tooltips, and English strings expose Station and Silo while hiding SAM Launcher and Missile Silo from the ordinary player build UI.
**Demo**:
`npx vitest run tests/client/graphics/RadialMenuElements.test.ts tests/InputHandler.test.ts tests/client/controllers/BuildPreviewController.test.ts`
**Acceptance Checks**:
- [ ] `BuildMenu.buildTable` includes Station and Silo and no longer includes SAM Launcher or Missile Silo.
- [ ] `UnitDisplay` and build keybind resolution match the same visible build set.
- [ ] Existing `resources/icons/rail-icon.svg` and `resources/icons/silo-icon.svg` or image aliases are used for DOM UI icons.
- [ ] English translation keys describe Station, Silo, and the revised Factory role accurately.
**Dependencies**: D1
**Notes**: Hiding from UI does not remove SAM Launcher or Missile Silo simulation behavior.

## D4: Map Badges Render Correctly
**Outcome**: Station and Silo render as the same kind of circular map badges as existing structures, with correct icon glyphs and level labels.
**Demo**:
`npm run build-dev`
**Acceptance Checks**:
- [ ] Renderer structure constants include Station and Silo.
- [ ] `StructurePass` and `StructureLevelPass` agree on the same structure order.
- [ ] The in-world icon source is updated by either extending `resources/atlases/icon-atlas.png` or generating/loading the structure atlas from SVGs.
- [ ] Existing structure icons still map to their previous unit types.
**Dependencies**: D1
**Notes**: Current atlas is `384 x 64` with six glyphs. An eight-structure fixed-cell atlas is expected to be `512 x 64` if preserving 64px cells.

## D5: AI, Help, And Regression Coverage
**Outcome**: Nation/bot heuristics, help text, disabled-unit labels, and tests reflect the split without regressing nuke/SAM behavior.
**Demo**:
`npm run test`
**Acceptance Checks**:
- [ ] Nation resource-capacity pressure builds Silos rather than Factories.
- [ ] Rail-aware nation placement considers Rail Stations.
- [ ] Help/config UI copy no longer claims Factory creates rails or storage.
- [ ] Targeted and full test commands pass.
**Dependencies**: D1, D2, D3, D4
**Notes**: Non-English translations can fall back to English/project convention in the first implementation pass if the repo does not require full localization updates.
