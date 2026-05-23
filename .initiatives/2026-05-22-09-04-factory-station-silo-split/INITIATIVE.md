# Initiative: Factory Station Silo Split

## Stack
- Language: TypeScript for client, deterministic core simulation, worker messages, and server; Go for `map-generator`
- Package manager: npm with root `package.json`; Go modules under `map-generator`
- Test runner: Vitest via `npm run test`
- Build: Vite plus `tsc --noEmit` through `npm run build-dev` and `npm run build-prod`
- UI: Lit HUD components, radial-menu/build-menu UI, Tailwind-style utility classes, WebGL structure rendering
- CI: GitHub Actions are present in the repo and the package scripts expose build, test, lint, and format checks

## Goal

Analyze the first step for splitting the current Factory benefits into two new buildable structures:

- Rail Stations: own the rail-network connection role currently attached to factories.
- Silos: own the resource stockpile capacity role currently attached to factories.

Factories should stop carrying those two benefits so they can later become a separate production-capability building.

## Problem Statement

Factories currently mix unrelated economic responsibilities. In core simulation, completed Factory levels increase resource stockpile capacity. In execution, Factory construction creates train stations, connects nearby structures into rail clusters, and starts train spawning through the existing train-station execution path. The UI also treats Factory as one buildable structure in the build modal, radial build wheel, sidebar build strip, player info overlay, translations, keybinds, stats, and renderer structure atlas.

Adding Rail Station and Silo is therefore not only an enum addition. It requires a coordinated change across deterministic unit typing, construction execution, resource-capacity calculation, rail-network eligibility, buildability, UI assets, in-world atlas rendering, translations, keybinds, stats, bot/nation heuristics, and tests.

## Success Definition

The analysis identifies the code-owned places where Factory rail behavior and Factory resource capacity live, explains how the two new structures should be represented, lists the required art assets and formats, and documents how the new structures enter the build wheel while SAM Launcher and Missile Silo can be hidden from that wheel for simplicity.

## Non-Goals
- Do not implement the two new units in this analysis step.
- Do not redesign Factory production mechanics yet.
- Do not remove SAM Launcher or Missile Silo from simulation, nukes, settings, AI, or stats; only analyze hiding/replacing their build-wheel entries.
- Do not rebalance costs, cooldowns, train yields, or production beyond what is needed to separate Factory responsibilities.

## Constraints
- Preserve deterministic core behavior and worker-safe TypeScript.
- Treat existing worktree changes as user work and avoid touching unrelated files.
- Keep buildable structure changes compatible with `BuildMenus`, `PlayerBuildableUnitType`, and worker `buildables()` requests.
- UI icons loaded through `assetUrl()` must live under public resource paths included by `PublicAssetManifest`.
- DOM build UI icons can follow the existing `resources/images/*Icon*.svg` pattern, but in-world WebGL structure badges currently sample `resources/atlases/icon-atlas.png`; adding structures is not solved by only adding SVG files unless the renderer is changed to load SVGs directly.

## Assumptions
- The new storage building should be named/displayed as "Silo" while existing `UnitType.MissileSilo` remains the nuclear launch structure internally.
- The new rail building should be named/displayed as "Rail Station" or "Station"; "Rail Station" is clearer because there is already a `TrainStation` runtime class.
- For a behavior-preserving first split, Rail Station should inherit the current Factory rail-network role. Whether it should also spawn trains is a design decision because the user described stations as "only connect" while current Factory rail behavior also spawns trains.
- The SVGs already added under `resources/icons/rail-icon.svg` and `resources/icons/silo-icon.svg` can be used for HUD/build-wheel icons if their visual style works at 40px and on dark backgrounds. If the team wants to mirror `CityIconWhite.svg`, they can be copied or aliased into `resources/images/StationIconWhite.svg` and `resources/images/SiloIconWhite.svg`.

## Risk Posture

Moderate-high. The conceptual split is simple, but Factory is referenced by capacity, rail routing, construction, AI, HUD, renderer, stats, translations, keybinds, and tests. The riskiest parts are preserving rail connectivity semantics and updating the WebGL structure atlas without breaking existing structure rendering.

## Next Step
Run planning for this initiative.
