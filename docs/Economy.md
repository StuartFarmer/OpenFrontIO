# Economy Model

OpenFront now routes recurring population and resource behavior through a small
stock-flow systems layer. One game tick is one model step. Systems publish named
outputs, declare the values they read, contribute flows, and the runtime applies
the final stock deltas.

The first gameplay-facing systems are:

- `PopulationSystem`
- `ResourceProductionSystem`
- `FoodSystem`
- `WarSystem`

Troops are still the playable population proxy. The stock-flow layer calls the
internal stock `population.current`, but compatibility APIs such as
`maxTroops(...)` and `troopIncreaseRate(...)` remain available for combat, bots,
HUD, and tests.

## Population Growth

Population growth uses a logistic equation:

```text
dN/dt = rN(1 - N / K)
```

Where:

- `N` is current population/troops.
- `r` is the maximum per-capita growth rate.
- `K` is max population.

The current max population is land-based:

```text
K = tilesOwned * maxPopulationPerTile
```

Bot and nation difficulty multipliers still apply through the stock-flow adapter.
The old biomass-supported capacity field remains as a compatibility diagnostic,
but it is not the current effective population cap.

## Resource Production

Food, energy, and materials remain stored resource stocks. Passive production is
evaluated as stock-flow output and split by terrain weights:

```text
terrain -> production weights -> food / energy / materials deltas
```

Resource capacity is also model output. Existing behavior is preserved:
production is clamped to remaining capacity, but existing over-cap resources are
not forcibly reduced.

## Food Consumption

Food is now an explicit model pressure. The food system reads the existing food
resource stock, food production, current population, and war pressure:

```text
foodAvailable = currentFood + foodProduced
foodAllocatedToPopulation = foodAvailable * foodAllocationToPopulation
foodNeeded = basePopulationNeed + mobilizedWarNeed
foodConsumed = min(foodAllocatedToPopulation, foodNeeded)
foodShortageRatio = 1 - foodConsumed / foodNeeded
```

`foodAllocationToPopulation` is a 0-1 player/mechanics control for the share of
available food that can be eaten this tick. Unallocated food remains in the food
resource stock and can be reserved for building/spending. At the default value of
`1`, all available food can be consumed and legacy behavior is preserved.

Population now uses a configurable food constraint mode:

```text
dynamic-shortage:
  population targets land max population
  food shortage suppresses births and adds famine deaths

hard-min-cap:
  foodSupportedPopulation = foodProduced * foodAllocationToPopulation / foodPerPerson
  effectivePopulationCap = min(landMaxPopulation, foodSupportedPopulation)
  population targets effectivePopulationCap
```

The default mode is `hard-min-cap`, so food-supported population is a real cap in
the game rather than only a shortage pressure diagnostic.

The default food-consumption parameters are neutral, so existing balance does not
change until mechanics config values opt in.

## War Pressure

War does not mutate food directly. `WarSystem` publishes addressable outputs
such as:

```text
war.mobilizedPopulation
war.foodConsumptionMultiplier
```

`FoodSystem` reads those outputs and increases food need. This keeps the boundary
clean: war describes pressure, food computes demand, population responds to
shortage.

The richer battle-economy model is documented separately in
[War Battle Systems](WarBattleSystemsReport.md). It keeps the current
border-grinding combat shape, then layers food, energy, materials, supply
shortage, devastation, and conquest destruction around active attacks. The
standalone tuning route is `/sandbox/war`.

## Food Shortage And Population

`PopulationSystem` reads `food.shortageRatio`. Shortage can reduce birth growth
and add famine deaths:

```text
birthModifier = max(0, 1 - shortageRatio * foodShortageBirthPenalty)
famineDeaths = population * famineDeathRate * shortageRatio
populationDelta = logisticGrowth * birthModifier - famineDeaths
```

With default mechanics, food shortage has no effect because food consumption and
famine death defaults are neutral. Sandbox/dev mode can tune these values.

## Design Intent

The goal is not a broad external simulation engine. The goal is a deterministic
game-native stock-flow framework:

```text
new tick
produce resources
derive war pressure
feed population
derive shortage
apply population growth/death
apply stock deltas
tick ends
```

This creates a clean path for future systems such as farming technology, soil
fertility, pollution, morale, logistics, or disease without threading each new
mechanic through bespoke game-loop code.
