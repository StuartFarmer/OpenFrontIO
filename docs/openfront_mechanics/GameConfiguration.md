# Game Configuration

Canonical baseline: `main@782702c1d6c8614f2c44590584b0b34c1016020d`.

The canonical configuration schema lives in `src/core/Schemas.ts`. Runtime code receives a `GameConfig` and reads it through `Config`, execution classes, and UI helpers.

## GameConfig Schema

`GameConfigSchema` starts at `Schemas.ts:217`.

| Field | Source | Type and bounds | Mechanics effect |
| --- | --- | --- | --- |
| `gameMap` | `Schemas.ts:218` | `GameMapType` | Selects map manifest and terrain binaries. |
| `difficulty` | `Schemas.ts:219` | `Difficulty` | Scales nation manpower, capacity, growth, and AI choices. |
| `donateGold`, `donateTroops` | `Schemas.ts:220` | boolean | Enables donation mechanics to humans. |
| `gameType` | `Schemas.ts:222` | `GameType` | Affects spawn phase behavior; singleplayer ends spawn phase on human spawn. |
| `gameMode` | `Schemas.ts:223` | `GameMode` | Controls FFA versus team winner logic. |
| `rankedType` | `Schemas.ts:224` | optional `RankedType` | 1v1 ranked winner handling. |
| `gameMapSize` | `Schemas.ts:225` | `Compact` or `Normal` | Chooses normal or compact terrain bins. |
| `publicGameModifiers` | `Schemas.ts:226` | optional object | Public lobby-facing modifier summary. |
| `nations` | `Schemas.ts:242` | integer 1..400, `default`, or `disabled` | Controls nation creation. |
| `bots` | `Schemas.ts:248` | integer 0..400 | Controls bot count. |
| `infiniteGold`, `infiniteTroops`, `instantBuild` | `Schemas.ts:249` | boolean | Global sandbox/host mechanics. |
| `disableNavMesh` | `Schemas.ts:252` | optional boolean | Disables navigation mesh/path behavior. |
| `disableAlliances` | `Schemas.ts:253` | optional nullable boolean | Disables alliances. |
| `waterNukes` | `Schemas.ts:254` | optional nullable boolean | Changes nuke blast tile mutation from fallout to water conversion. |
| `randomSpawn` | `Schemas.ts:255` | boolean | Changes spawn selection and spawn phase duration. |
| `maxPlayers` | `Schemas.ts:256` | optional number | Lobby/server cap. |
| `maxTimerValue` | `Schemas.ts:257` | optional nullable integer 1..120 minutes | Time-limit win trigger. |
| `spawnImmunityDuration` | `Schemas.ts:258` | optional nullable integer >= 0 ticks | Player spawn immunity duration. |
| `disabledUnits` | `Schemas.ts:259` | optional `UnitType[]` | Prevents specific units from being built or used. |
| `playerTeams` | `Schemas.ts:260` | number or `Duos`/`Trios`/`Quads`/`Humans Vs Nations` | Team assignment setup. |
| `goldMultiplier` | `Schemas.ts:261` | optional nullable number 0.1..1000 | Multiplies generated gold. |
| `startingGold` | `Schemas.ts:262` | optional nullable integer 0..1,000,000,000 | Initial human gold/resources. |
| `hostCheats` | `Schemas.ts:263` | optional object | Lobby creator-only infinite gold/troops, gold multiplier, and starting gold. |

## Public Modifiers

`publicGameModifiers` at `Schemas.ts:226` mirrors player-facing options. It can advertise compact map, random spawn, crowded setup, hard nations, starting gold, gold multiplier, disabled alliances/ports/nukes/SAMs, peace time, and water nukes (`Schemas.ts:228` through `Schemas.ts:239`).

Treat this object as a display/metadata surface. The authoritative runtime values still live in the top-level `GameConfig` fields and `Config` methods.

## Player Intent Schemas

Intent schemas start at `Schemas.ts:325`.

| Intent | Source | Payload |
| --- | --- | --- |
| `allianceExtension` | `Schemas.ts:325` | recipient player id. |
| `attack` | `Schemas.ts:330` | nullable target id and nullable nonnegative troop amount. |
| `spawn` | `Schemas.ts:336` | tile ref. |
| `boat` | `Schemas.ts:341` | nonnegative troops and destination tile. |
| `allianceRequest` | `Schemas.ts:347` | recipient id. |
| `allianceReject` | `Schemas.ts:352` | requestor id. |
| `breakAlliance` | `Schemas.ts:357` | recipient id. |
| `targetPlayer` | `Schemas.ts:362` | target id. |
| `emoji` | `Schemas.ts:367` | recipient id or `AllPlayers`, plus emoji index. |
| `embargo` | `Schemas.ts:373` | target id and `start` or `stop`. |
| `embargo_all` | `Schemas.ts:379` | `start` or `stop`. |
| `donate_gold` | `Schemas.ts:384` | recipient id and nullable nonnegative gold amount. |
| `donate_troops` | `Schemas.ts:390` | recipient id and nullable nonnegative troop amount. |
| `build_unit` | `Schemas.ts:396` | unit type, tile ref, optional rocket direction. |
| `upgrade_structure` | `Schemas.ts:403` | unit type and unit id. |
| `cancel_attack` | `Schemas.ts:409` | attack cancellation payload starts here. |

## Implementation Notes

- Tick units are used for spawn immunity and many cooldowns. One tick is treated as 100 ms in comments such as `warshipShellLifetime()`.
- Some UI controls duplicate or derive schema bounds. The final guide should record both the schema boundary and the UI entry point.
- Host cheats are not equivalent to global config flags: `Config` applies some host cheats only when `player.isLobbyCreator()` is true.
