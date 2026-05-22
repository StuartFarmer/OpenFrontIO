# Analysis Report: Factory Station Silo Split

## Executive Summary
- Highest impact: Factory capacity and rail behavior are already cleanly identifiable, but they are wired through different subsystems.
- Second: Rail Station should become a real `UnitType` structure, not just the existing `TrainStation` helper class, because players must build, upgrade, count, render, and pay for it.
- Third: Silo should take the `Config.maxResources()` Factory-level capacity contribution, while existing Missile Silo must remain a separate nuke launcher unless intentionally removed from the whole game.
- Fourth: replacing SAM Launcher and Missile Silo in the build wheel is mostly a `buildTable`/sidebar/keybind presentation change, but those unit types remain in core menus/settings unless separately disabled.
- Fifth: the SVGs in `resources/icons/` are enough for build UI, but in-world structure rendering also needs an updated atlas PNG and structure render type mappings.

## Findings

### 1. Factory currently owns rail creation, nearby structure linking, and train spawning
- Evidence:
  - `src/core/execution/ConstructionExecution.ts` imports `FactoryExecution` and starts it when `UnitType.Factory` construction completes.
  - `src/core/execution/FactoryExecution.ts` creates a train station on the factory with `new TrainStationExecution(this.factory, true)` and creates stations on nearby City, Port, and Factory units.
  - `src/core/execution/TrainStationExecution.ts` spawns trains only when `spawnTrains` is true, and its spawn rate depends on `this.unit.owner().unitCount(UnitType.Factory)`.
  - `src/core/game/RailNetworkImpl.ts` only computes ghost rail paths for City and Port, requires a nearby Factory before showing paths, and connects nearby City, Factory, and Port stations.
  - `src/core/game/TrainStation.ts` treats City and Port as trade stations; Factory has a no-op train stop handler.
- Impact:
  - The rail role is not just one code path. It includes construction completion, station attachment, route preview, nearby connection eligibility, train spawning, and trade-stop classification.
  - A new Station unit must be added to rail-network type lists in several places, or it will render/build but not actually connect rail clusters.
  - The current Factory train-spawn formula will become misleading if Factory no longer represents rail infrastructure.
- Recommendation:
  - Add a buildable `UnitType.RailStation` or `UnitType.Station` structure and move Factory's `FactoryExecution.createStation()` responsibility into a dedicated station execution.
  - Replace Factory references in rail eligibility with Station where the behavior is "rail infrastructure exists nearby."
  - Decide explicitly whether Station also starts train spawning in this first step. For behavior preservation, move `spawnTrains: true` from Factory to Station and make train spawn rate count stations. For a stricter "only connect" interpretation, Station should connect rails only and a later Factory production design must supply train/resource output.
- Risk:
  - If train spawning is removed without a replacement, rail routes may exist but provide little or no economic benefit. That may be correct eventually, but it is a gameplay behavior change larger than "split Factory benefits."

### 2. Factory currently owns resource stockpile capacity through `Config.maxResources()`
- Evidence:
  - `src/core/configuration/Config.ts` calculates `factoryLevels` from completed `UnitType.Factory` units and adds `factoryLevels * factoryResourceCapacityIncrease()` to base resource capacity.
  - `tests/core/configuration/ResourceCapacity.test.ts` has tests named "completed Factory levels increase resource capacity" and "under-construction Factories do not increase resource capacity."
  - `src/client/hud/layers/ControlPanel.ts`, `src/client/hud/layers/Leaderboard.ts`, and `src/client/view/PlayerView.ts` consume `resourceCapacity` as player state rather than caring which structure produced it.
- Impact:
  - Silo can take the capacity role with a contained core change if the capacity calculation switches from Factory levels to Silo levels.
  - UI consumers of `resourceCapacity` should not need semantic changes because they already receive the computed capacity from player updates.
  - Existing tests should be renamed and retargeted to Silo to prove the split.
- Recommendation:
  - Add `UnitType.Silo` as a completed/upgradable structure and make `Config.maxResources()` sum completed Silo levels.
  - Keep the existing `factoryResourceCapacityIncrease()` value as a first-pass balance value, or rename it to `siloResourceCapacityIncrease()` once call sites are updated.
  - Update capacity tests to verify completed Silo levels increase capacity and under-construction Silos do not.
- Risk:
  - "Silo" and "Missile Silo" are visually and semantically close. Internal enum names, translation keys, and icons should avoid ambiguity.

### 3. Adding buildable structures touches the canonical unit model, not just HUD menus
- Evidence:
  - `src/core/game/Game.ts` defines `UnitType`, `Structures`, `BuildMenus`, `PlayerBuildable`, `UnitParamsMap`, and `PlayerBuildableUnitType`.
  - `src/core/game/PlayerImpl.ts` uses `Structures.types` for valid structure spacing and switches on unit type for spawning.
  - `src/core/execution/ConstructionExecution.ts` decides which unit types are structures and which execution starts after completion.
  - `src/core/configuration/Config.ts` owns structure costs, resource-cost splits, build durations, and disabled-unit checks through `unitInfo()` and `unitResourceCost()`.
  - `src/core/StatsSchemas.ts` maps countable "other units" to compact stats keys.
- Impact:
  - Station and Silo need to be first-class unit types to work with buildability, upgrades, stats, updates, rendering, and disabled-unit configuration.
  - Missing one of these model lists typically produces silent UI omissions or runtime assert paths.
- Recommendation:
  - Add Station and Silo to `UnitType`, `Structures`, `BuildMenus`, `UnitParamsMap`, construction spawning, stats schemas, config cost/resource cost, and any structure count displays.
  - For simplicity, keep both structures upgradable if they inherit current Factory-style benefits by level.
- Risk:
  - Adding enum values changes serialized unit strings and renderer type order. Replay/save compatibility should be considered if this project expects old replay data to load.

### 4. The build wheel is driven by `BuildMenu.buildTable`, with radial menu reuse
- Evidence:
  - `src/client/hud/layers/BuildMenu.ts` defines `buildTable` entries for Atom Bomb, MIRV, Hydrogen Bomb, Warship, Port, Missile Silo, SAM Launcher, Defense Post, City, and Factory.
  - `src/client/hud/layers/RadialMenuElements.ts` imports `flattenedBuildTable` and filters it into build/attack radial elements.
  - `BuildMenu.refresh()` calls `myPlayer().buildables(this.clickedTile, BuildMenus.types)` and filters out disabled unit types.
  - `src/client/hud/layers/UnitDisplay.ts` separately renders the bottom build strip and currently includes Missile Silo and SAM Launcher hotkeys.
  - `src/client/InputHandler.ts` and `src/core/game/UserSettings.ts` define hotkey mappings for Factory, Missile Silo, and SAM Launcher.
- Impact:
  - Adding Station and Silo to `buildTable` adds them to both the modal build menu and radial build wheel, provided they are also in `BuildMenus.types` and `player.buildables()` returns them.
  - Hiding SAM Launcher and Missile Silo from the wheel can be done by removing/replacing their `buildTable` entries, but the bottom build strip and keyboard shortcuts will still expose them unless also adjusted.
  - If the intent is "hide from player build UI" rather than "disable game mechanic," UI lists should change while core unit types remain available to AI/tests/settings as needed.
- Recommendation:
  - Replace the `UnitType.MissileSilo` and `UnitType.SAMLauncher` entries in `BuildMenu.buildTable` with `UnitType.RailStation` and `UnitType.Silo`.
  - Mirror the same replacement in `UnitDisplay` so the bottom build strip matches the radial wheel.
  - Add or repurpose keybinds: either put Station on the old Missile Silo key (`Digit5`) and Silo on the old SAM Launcher key (`Digit6`), or shift Factory/Port/Defense order in a later UX pass.
  - Leave `GameConfigSettings` disabled-unit controls for Missile Silo and SAM Launcher alone unless the goal is to remove them from lobby configuration too.
- Risk:
  - Hiding build entries but leaving hotkeys active would be confusing. The wheel, bottom strip, and keybind resolver should tell the same story.

### 5. Required images and formats split into DOM HUD SVGs and in-world structure atlas glyphs
- Evidence:
  - The new SVGs exist as `resources/icons/rail-icon.svg` and `resources/icons/silo-icon.svg`.
  - `src/server/PublicAssetManifest.ts` includes both `icons/**/*` and `images/**/*`, so `assetUrl("icons/rail-icon.svg")` and `assetUrl("icons/silo-icon.svg")` are valid public asset paths.
  - Build menu and sidebar icons are loaded directly with `assetUrl("images/...svg")`, for example `resources/images/CityIconWhite.svg`.
  - `src/client/render/gl/passes/StructurePass.ts` renders structures from a pre-built `resources/atlases/icon-atlas.png` and hard-codes a six-column `STRUCTURE_ORDER`.
  - `src/client/render/gl/passes/StructureLevelPass.ts` repeats the same structure order for level labels.
  - `src/client/render/types/UnitType.ts` defines renderer structure constants and `STRUCTURE_TYPES`.
  - The current `resources/atlases/icon-atlas.png` is not blank in this checkout; it is a `384 x 64` PNG containing six white structure glyphs in the renderer's order.
- Impact:
  - The SVG icons in `resources/icons/` can cover the build menu, radial wheel, bottom build strip, player info overlay, help modal, and other DOM-based UI.
  - Following the `CityIconWhite.svg` pattern is sufficient for DOM UI surfaces, but it will not automatically update the map badges because the WebGL structure renderer samples a PNG atlas by column.
  - Adding two structure types means the atlas grows from six columns to eight, and both `StructurePass` and `StructureLevelPass` need matching order updates.
- Recommendation:
  - Needed UI assets:
    - `resources/images/StationIconWhite.svg` or `resources/icons/rail-icon.svg`: white or currentColor-compatible rail/station symbol, square viewBox preferred, visually clear at 24-40px on dark UI.
    - `resources/images/SiloIconWhite.svg` or `resources/icons/silo-icon.svg`: white or currentColor-compatible storage silo symbol, square viewBox preferred, visually distinct from `images/MissileSiloIconWhite.svg`.
  - Needed in-world assets:
    - Update `resources/atlases/icon-atlas.png` to include Station and Silo columns in the exact order used by renderer `STRUCTURE_ORDER`.
    - Preferred atlas format: PNG, RGBA, same 64px cell height as the current `384 x 64` atlas. With eight structures, expect `512 x 64` if preserving 64px-wide cells.
    - If the atlas generation source is absent, either document the manual atlas composition process or add a small reproducible generator before changing the atlas.
    - Alternative: change `StructurePass` to generate the atlas at runtime from the same SVG files used by the DOM UI. That would make `CityIconWhite.svg`-style assets the true source, but it is a renderer change rather than a simple asset drop.
  - Optional DOM consistency:
    - Copy or alias the SVGs into `resources/images/StationIconWhite.svg` and `resources/images/SiloIconWhite.svg` only if the team wants structure icons kept with the existing build icons. Direct `icons/...` references are technically valid.
- Risk:
  - A mismatch between atlas column order and renderer structure order will show the wrong icon for structures in-game.

### 6. Translations, help text, stats, and nation AI reference Factory semantics directly
- Evidence:
  - `resources/lang/en.json` describes Factory as "Creates railroads and spawns trains."
  - `src/client/HelpModal.ts` has Factory, Missile Silo, and SAM Launcher help sections.
  - `src/client/JoinLobbyModal.ts` and `src/client/components/GameConfigSettings.ts` map unit types to translation keys for disabled-unit controls.
  - `src/core/execution/nation/NationStructureBehavior.ts` prioritizes Factory when resource capacity pressure is high and references Factory in rail placement heuristics.
  - `src/core/execution/nation/NationNukeBehavior.ts` considers Factory among structures for nuke targeting.
- Impact:
  - If gameplay changes but text remains Factory-centric, players will learn the wrong mechanic.
  - Nations/bots will keep building Factory for capacity unless their heuristics switch to Silo.
  - Rail-aware nation behavior will need Station awareness or it will underuse the new rail building.
- Recommendation:
  - Update English first for `unit_type.station`, `unit_type.silo`, `build_menu.desc.station`, `build_menu.desc.silo`, and revise Factory copy to avoid rail/capacity claims.
  - Add placeholders or English fallbacks for non-English locales according to the repo's localization convention.
  - Change nation capacity pressure from Factory to Silo and rail connection heuristics from Factory to Station.
- Risk:
  - Localization churn can be broad. The implementation should avoid blocking core correctness on perfect translations, but English must be accurate.

## Quick Wins
- Use existing `resources/icons/rail-icon.svg` and `resources/icons/silo-icon.svg` directly in `BuildMenu.buildTable` for the first UI pass.
- Replace Missile Silo and SAM Launcher entries in `BuildMenu.buildTable` with Station and Silo entries to update the radial build wheel and modal together.
- Mirror that replacement in `UnitDisplay` and the build keybind resolver so hidden units are not still exposed by sidebar or hotkey.
- Retarget the resource-capacity tests from Factory to Silo as the first core correctness check.
- Add Station/Silo translation keys in `resources/lang/en.json` before broader localization.

## Medium Changes
- Add Station and Silo as first-class `UnitType` structures across core unit groups, config, construction, stats, renderer type constants, and tests.
- Move Factory rail behavior into a Station execution and update rail-network eligibility lists from Factory to Station.
- Change `Config.maxResources()` to count completed Silo levels instead of Factory levels.
- Update nation AI structure priorities so resource-capacity pressure builds Silos and rail-connectivity goals build Stations.
- Update help modal and player info/build strip displays for the new structure set.

## High-Risk Decisions
- Whether Station should spawn trains in this first split. Behavior-preserving split says yes; the user's "only connect" wording suggests no. This choice changes the rail economy immediately.
- Whether to keep Missile Silo and SAM Launcher fully buildable through non-wheel UI. Hiding only the wheel is simpler, but hidden hotkeys/sidebar entries would be inconsistent.
- Whether to regenerate `icon-atlas.png` manually or add a reproducible atlas generator. Manual is faster but fragile; reproducible generation reduces future rendering mistakes.
- Whether Factory remains buildable during the transition with no immediate benefit. If it does, players may spend resources on a placeholder production building before production exists.

## Guardrails
- Keep existing Missile Silo and SAM Launcher simulation paths intact unless a separate removal decision is made.
- Do not use the existing `TrainStation` class as the player-facing unit name in code; it is a runtime rail-node object, not a buildable structure.
- Keep Station and Silo distinct from existing `UnitType.MissileSilo` in enum names, translation keys, stats keys, and icons.
- Update both DOM UI icons and WebGL atlas rendering; one without the other creates an incomplete feature.
- Preserve existing Factory behavior in tests before moving it, then assert Factory no longer contributes rail/capacity after the split.
