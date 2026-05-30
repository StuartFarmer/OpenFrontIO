# Economy

Canonical baseline: `main@782702c1d6c8614f2c44590584b0b34c1016020d`.

The canonical economy has troops, gold, and three resource stocks: food, energy, and materials. Gold and resources are connected by helper functions, but they are not the same mechanic once capacities, costs, and trade are involved.

## Resource Stocks

`ResourceKinds` are declared as `food`, `energy`, and `materials` at `Resources.ts:1`. A resource stockpile is a record of those three bigint amounts (`Resources.ts:5`).

`resourcesFromGoldAmount(amount)` creates equal food, energy, and materials amounts from a single gold-like amount (`Resources.ts:23`). Many capacity and cost paths use this as a conversion helper.

## Starting Manpower

`Config.startManpower()` starts at `Config.ts:807`.

| Player type | Start troops |
| --- | ---: |
| Bot | 10,000 |
| Human | 25,000 |
| Human with infinite troops | 1,000,000 |
| Nation, Easy | 12,500 |
| Nation, Medium | 18,750 |
| Nation, Hard | 25,000 |
| Nation, Impossible | 31,250 |

## Troop Capacity

`Config.maxTroops()` starts at `Config.ts:828`.

Base capacity for non-infinite humans is:

```text
2 * (numTilesOwned^0.6 * 1000 + 50000)
+ completedCityLevelSum * cityTroopIncrease()
```

`cityTroopIncrease()` is 250,000 on canonical main.

Modifiers:

- Bots get one third of base capacity (`Config.ts:840`).
- Humans get base capacity (`Config.ts:844`).
- Nations get difficulty scaling: Easy 0.5, Medium 0.75, Hard 1, Impossible 1.25 (`Config.ts:848`).

## Resource Capacity

`Config.maxResources()` starts at `Config.ts:862`.

The resource-capacity path computes:

```text
siloLevels = sum(completed silo levels)
troopStyleTerritoryCapacity = 2 * (numTilesOwned^0.6 * 1000 + 50000)
baseCapacity =
  max(MIN_BASE_RESOURCE_CAPACITY, floor(troopStyleTerritoryCapacity / 3))
  + siloLevels * factoryResourceCapacityIncrease()
```

The result is passed through the same player-type/difficulty capacity multiplier and converted to equal food, energy, and materials (`Config.ts:877`).

## Biomass-Supported Troop Capacity

`biomassSupportedTroopCapacity()` starts at `Config.ts:882`. It computes a terrain resource production split, takes `food / totalWeight` as biomass share, and scales food resource capacity by that share over `BASELINE_BIOMASS_PRODUCTION_SHARE` (`Config.ts:889`).

`effectiveTroopCapacity()` is the lower of `maxTroops()` and biomass-supported troop capacity (`Config.ts:896`).

## Troop Growth

`Config.troopIncreaseRate()` starts at `Config.ts:903`.

The growth formula is logistic:

```text
toAdd = TROOP_LOGISTIC_GROWTH_RATE * troops * (1 - troops / max)
```

Source: `Config.ts:915`.

If max capacity is <= 0, the result is `-troops` (`Config.ts:911`). Bots multiply growth by 0.5 (`Config.ts:917`). Nations multiply growth by difficulty: Easy 0.9, Medium 0.95, Hard 1, Impossible 1.05 (`Config.ts:921`).

The final return value is clamped so troops do not grow beyond max in that tick (`Config.ts:940`).

## Resource Regeneration

`Config.resourceIncreaseRate()` starts at `Config.ts:943`. It:

1. Computes equal passive regen with `resourceRegenDelta()`, using `resourceRegenMultiplierFor(player) / 3`.
2. Sums the equal regen across food, energy, and materials.
3. Splits that total by terrain resource production weights.
4. Clamps the delta to remaining capacity.

The per-resource primitive is `resourceRegenAmount()` at `Resources.ts:103`:

```text
toAdd = 10 + current^0.73 / 4
toAdd *= 1 - current / max
toAdd *= multiplier
```

The return is capped to available capacity and floored to at least 1 if positive (`Resources.ts:118`).

## Terrain Production Split

`terrainResourceProductionSplit()` starts at `Config.ts:959`.

| Terrain | Food | Energy | Materials |
| --- | ---: | ---: | ---: |
| Plains | 1 | 2 | 1 |
| Highland | 2 | 1 | 1 |
| Mountain | 1 | 1 | 2 |

The split is based on owned tiles and ignores water/default terrain in this loop.

## Trade Exchange Primitive

`calculateTradeManifest()` starts at `ResourceTrade.ts:29`. For each resource kind, it computes:

```text
raw[kind] = min(surplus[kind], deficit[kind], headroom[kind])
```

Then it scales the raw manifest to the max payload (`ResourceTrade.ts:49`).

`calculateTradeExchange()` starts at `ResourceTrade.ts:52` and computes reciprocal manifests. It limits exchange total to the max payload and to both sides' available receivable totals (`ResourceTrade.ts:78`), then scales both directions to the same total (`ResourceTrade.ts:91`).

## Evidence Tests

- `tests/core/game/Resources.test.ts` covers resource primitives.
- `tests/core/game/ResourceTrade.test.ts` covers trade exchange math.
- Trade ship and train usage of this primitive is covered in W3.
