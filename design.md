# Resource Economy Design

## Goal

Add a three-resource economy that makes territory composition matter beyond troop movement and capture speed. Gold should no longer be the direct universal build currency. Instead, players acquire Food, Energy, and Materials from controlled terrain, and buildings, units, weapons, upgrades, and trade convert those resources into strategic choices.

The mechanic should preserve OpenFront's fast territorial loop: capturing land remains the primary action, and resource differences should amplify map control decisions without turning the game into a slow base-management RTS.

## Resource Types

The first version uses three stockpiled resources:

- Food: represents agriculture, population support, supply, and biological logistics.
- Energy: represents oil, petrochemicals, electricity, fuel, and high-energy production.
- Materials: represents ore, stone, industrial feedstock, metals, and construction inputs.

Gold becomes an indirect value layer rather than the primary cost paid by every action. Possible roles for gold:

- Market currency generated from surplus resources.
- Trade settlement currency from ports and captured trade ships.
- Score/economic display derived from total resource value.
- Optional fallback for old systems during migration.

## Terrain Production

Each land terrain type produces all three resources, but with one dominant resource. This mirrors the existing terrain design where terrain already changes combat/capture behavior.

| Terrain | Food | Energy | Materials | Theme |
| --- | ---: | ---: | ---: | --- |
| Plains | High | Low | Medium | wheat, farms, population centers |
| Highland | Medium | Medium | Medium | mixed economy, flexible but unspecialized |
| Mountain | Low | Medium | High | ore, stone, rare minerals |
| Desert-like terrain | Low | High | Low | petrochemicals, solar, fuel |

Current code has `Plains`, `Highland`, `Mountain`, `Lake`, and `Ocean`. If desert should be first-class, it should become a `TerrainType` instead of being inferred from map color or elevation. If not, the first pass can map highlands or selected biome metadata to an Energy-biased profile.

Water should not directly produce the three land resources in v1. Ports and trade ships can convert water access into trade income or resource exchange instead.

## Production Model

Resource income should be deterministic and tick-based, like gold and troops are today.

Suggested model:

```text
resourceIncomePerTick(player, resource) =
  sum(owned land tiles by terrain profile)
  * map scale modifier
  * structures modifier
  * game mode modifier
```

Use per-terrain weights rather than per-tile random deposits for the first implementation. That keeps behavior understandable and avoids adding hidden map-data complexity before the mechanic is proven.

Example profile weights:

```ts
Plains:   { food: 1.30, energy: 0.55, materials: 0.80 }
Highland: { food: 0.95, energy: 0.95, materials: 0.95 }
Mountain: { food: 0.45, energy: 0.80, materials: 1.45 }
Desert:   { food: 0.35, energy: 1.60, materials: 0.55 }
```

The exact numbers should be balanced after AI games can run with the mechanic enabled.

## Costs

Replace single `Gold` costs with a `ResourceCost` object:

```ts
type ResourceKind = "food" | "energy" | "materials";

type ResourceAmount = bigint;

type ResourceStockpile = Record<ResourceKind, ResourceAmount>;

type ResourceCost = Partial<ResourceStockpile>;
```

Costs should communicate the fantasy of each item:

| Item | Food | Energy | Materials | Notes |
| --- | ---: | ---: | ---: | --- |
| City | High | Low | Medium | people, administration, construction |
| Factory | Medium | High | High | industrial base |
| Port | Medium | Medium | High | infrastructure and logistics |
| Defense Post | Low | Low | Medium | fortification-heavy |
| SAM Launcher | Low | High | High | electronics, missiles, hardware |
| Missile Silo | Low | High | High | hardened infrastructure |
| Warship | Medium | High | High | crew, fuel, steel |
| Atom Bomb | None | High | High | energy and materials only |
| Hydrogen Bomb | None | Very High | High | energy-dominant strategic weapon |
| MIRV | None | Very High | Very High | advanced materials and energy |
| Train/Rail | Medium | Medium | High | logistics network |

Construction should fail if any required resource is missing. Partial payment should not happen unless we intentionally add queued construction later.

## Gold Transition

Do this in stages to avoid rewriting every UI and balance path at once:

1. Introduce resource stockpiles while keeping current gold costs.
2. Add resource income from terrain and display it in debug/dev UI.
3. Add `resourceCost` beside existing `cost` in `UnitInfo`.
4. Gate construction on resource cost, but preserve gold cost as a compatibility fallback.
5. Convert unit/building costs one class at a time.
6. Decide whether gold remains as trade currency, score, or market exchange.

This lets the feature be playtested before removing existing gold assumptions.

## Systems Impact

Core model:

- Add resource stockpile fields to `Player`.
- Add resource add/remove helpers equivalent to `addGold` and `removeGold`.
- Add resource state to game updates so clients can render it.
- Add a resource income execution or integrate income into existing per-tick player economy.

Configuration:

- Extend `UnitInfo` with `resourceCost`.
- Add terrain-to-resource profile config.
- Add map/game modifiers for resource rate.
- Keep host cheats such as infinite gold/starting gold mirrored as resource cheats during development.

Construction:

- `ConstructionExecution` should validate and charge resource costs before placing a structure.
- Nuke, warship, train, and other non-structure build paths need the same cost gate.
- Upgrade costs need resource equivalents.

UI:

- Control panel should show Food, Energy, Materials, and rates.
- Build menu should show mixed costs compactly.
- Disabled build states should explain which resource is missing.
- Donation/trade UI eventually needs resource selection or market conversion.

Stats/replays:

- Resource changes must be deterministic and included in game state updates.
- Replays must serialize resource stockpiles and resource-related intents.
- Stats should track resource spent/earned separately from old gold where useful.

## AI Behavior

Nations are the primary AI target. Simple bots currently expand and attack, but do not strategically build; they should not drive this mechanic.

AI needs three new concepts:

- Affordability: can it pay all resources for a chosen build.
- Need: which resource bottleneck blocks its next desired action.
- Territory preference: whether to expand toward terrain that fixes the bottleneck.

Initial AI behavior can be simple:

1. Keep existing nation build order.
2. Convert each desired build to a resource cost.
3. If missing resources, delay building and continue expanding.
4. Bias expansion target scoring toward terrain that produces the missing resource.
5. For high-tier weapons, make nations save specifically for Energy and Materials.

Later AI behavior can add:

- Resource-aware trade through ports.
- Market conversion when one resource is heavily overstocked.
- Strategic denial: attack neighbors controlling the resource terrain the nation lacks.
- Difficulty scaling: harder nations identify bottlenecks earlier and use trade/market more efficiently.

## Terrain Strategy

The mechanic should create recognizable strategic map incentives:

- Plains-heavy players can sustain growth and cities but may lack Energy for advanced weapons.
- Mountain-heavy players can build infrastructure and weapons but may lack Food for cities and armies.
- Desert/Energy-heavy players can reach nukes or advanced units faster but may need trade or conquest for Food and Materials.
- Mixed terrain remains viable but less explosive.

This should make expansion direction matter. A player choosing between two fronts should be able to think, "I need mountains for Materials" or "I need plains before I can grow cities."

## Open Questions

- Should Food affect troop growth directly, or only construction costs?
- Should Energy affect attack/naval movement, or only high-tech builds?
- Should Materials affect repair/upgrade speed, or only build costs?
- Should gold remain visible to players, or be replaced entirely by resource value?
- Should resources be donated independently in team games?
- Should ports enable market conversion, resource trade, or both?
- Do maps need a true `Desert` terrain type, or is Energy production attached to biome metadata?

## Suggested First Prototype

Prototype behind a config flag:

```ts
resourcesEnabled: true
```

Minimal prototype scope:

- Add `Food`, `Energy`, and `Materials` stockpiles to players.
- Generate income from `Plains`, `Highland`, and `Mountain`.
- Add resource costs for `City`, `Factory`, `Port`, `MissileSilo`, `SAMLauncher`, and nukes.
- Show stockpiles and rates in a temporary dev HUD.
- Make nations save and pay resources when building.
- Leave gold in place for trade, legacy UI, and fallback balance.

Success criteria:

- Players can understand why they are blocked from building.
- Terrain composition visibly changes build strategy.
- Nations still build coherent economies without stalling permanently.
- Existing single-player AI demo games remain useful for playtesting.
