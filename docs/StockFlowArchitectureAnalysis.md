# Stock-Flow Architecture Analysis

This document analyzes the current OpenFront game loop and outlines a clean path
to a reusable stock-flow systems framework. The immediate motivation is
population and food, but the same architecture should support later mechanics
such as wartime consumption, farming technology, soil fertility, pollution,
morale, disease, logistics, or war exhaustion.

## Current State

### Tick Ownership

The authoritative simulation runs through `GameRunner` and `GameImpl`.

```text
Turn input
  -> Executor creates Execution objects
  -> GameImpl.executeNextTick()
  -> active executions tick
  -> new executions initialize
  -> player updates are diffed
  -> packed tile/unit/player updates are sent to client
```

Important files:

- `src/core/GameRunner.ts`
- `src/core/game/GameImpl.ts`
- `src/core/execution/ExecutionManager.ts`
- `src/core/game/Game.ts`

The key runtime interface is:

```ts
export interface Execution {
  isActive(): boolean;
  activeDuringSpawnPhase(): boolean;
  init(mg: Game, ticks: number): void;
  tick(ticks: number): void;
}
```

This is flexible and deterministic, but it means recurring economy behavior is
currently implemented as another execution rather than as an explicit systems
pipeline.

### Current Economy Loop

The main recurring player economy behavior lives in `PlayerExecution.tick()`.
Each active player:

1. Decays relations.
2. Handles captured/lost structures.
3. Checks death and cleanup.
4. Calculates population/troop delta from `Config.troopIncreaseRate(...)`.
5. Adds troops.
6. Calculates passive resources from `Config.resourceIncreaseRate(...)`.
7. Adds resources.
8. Handles alliance and embargo expiry.
9. Recomputes disconnected territory clusters when needed.

The current economy core is roughly:

```text
troopInc = config.troopIncreaseRate(player, game)
player.addTroops(troopInc)

resourcesFromWorkers = config.resourceIncreaseRate(game, player)
player.addResources(resourcesFromWorkers)
```

This is already stock-flow in spirit:

- Troops/population are a stock.
- Food/energy/materials are stocks.
- Troop growth is a flow.
- Passive resource production is a flow.
- Resource capacity is a cap.

But these are not represented as reusable stock-flow primitives yet.

### Current State Storage

Player state currently includes:

- `_troops`
- `_gold`
- `_resources`
- owned tiles
- units
- attacks
- alliances
- embargoes

Resources are represented as:

```ts
export const ResourceKinds = ["food", "energy", "materials"] as const;
export type ResourceStockpile = Record<ResourceKind, bigint>;
export type ResourceDelta = Partial<ResourceStockpile>;
```

This is a good foundation. The resource helpers already provide:

- zero stock creation
- deltas
- capacity clamping
- passive regen curves
- export blending

The main gap is that population/troops and future stocks are not handled through
the same general model.

### Current Update Surface

`PlayerImpl.toFullUpdate()` emits:

- `tilesOwned`
- `gold`
- `resources`
- `resourceCapacity`
- `effectiveTroopCapacity`
- `biomassSupportedTroopCapacity`
- `troopIncreaseRate`
- `troops`
- attacks, alliances, embargoes, traitor state, etc.

This means the client already has a pathway for stock values, capacities, and
rates. A stock-flow framework can extend this rather than inventing a new update
transport.

## Current Strengths

- The authoritative simulation is deterministic and centralized.
- The execution model already supports recurring systems.
- `ResourceStockpile` and `ResourceDelta` already exist.
- Player updates already include stock values and rates.
- The sandbox mechanics config gives us a safe place to tune parameters.
- The local/sandbox run path can test real gameplay, not a detached simulation.

## Current Friction

### Formulas Are Scattered

Population and resources are currently calculated through `Config` methods:

- `startManpower(...)`
- `maxTroops(...)`
- `biomassSupportedTroopCapacity(...)`
- `effectiveTroopCapacity(...)`
- `troopIncreaseRate(...)`
- `maxResources(...)`
- `resourceIncreaseRate(...)`

This makes tuning possible, but it does not expose a composable system graph.
Adding wartime food consumption, for example, would likely require threading a
new modifier through `Config`, `PlayerExecution`, HUD diagnostics, and sandbox
graphs manually.

### Stocks And Flows Are Not First-Class

The code has stock values and rate functions, but no shared concept of:

- stock identity
- stock unit
- capacity
- incoming flows
- outgoing flows
- modifiers
- clamps
- diagnostics
- ordering

Without those primitives, every new system repeats the same design work.

### Tick Ordering Is Implicit

The current player economy order is embedded in `PlayerExecution.tick()`. That is
fine for a small model, but stock-flow mechanics become much easier to reason
about when the ordering is explicit:

```text
produce
consume
derive pressure
apply births/deaths
clamp stocks
emit diagnostics
```

Ordering matters. Food should be produced before consumption. Consumption should
set food ratio before births/deaths. Deaths should happen after shortage is
known. These rules should be visible in code.

### Diagnostics Are Bespoke

The sandbox graphs currently duplicate some formula logic. That is acceptable
for early tuning, but the long-term target should be that systems expose their
own diagnostic outputs:

- current stock
- capacity
- produced this tick
- consumed this tick
- shortage ratio
- birth flow
- death flow
- modifiers

Then the sandbox can graph actual system outputs instead of re-implementing
system equations.

## Target Architecture

The target is a small deterministic stock-flow layer inside core simulation.
It should not replace `Execution`; it should give recurring economy executions a
clean way to express system logic.

Implementation note: the first version now exists under `src/core/systems`.
`PlayerExecution` delegates economy mutation through `Config.playerEconomyTick`,
which evaluates population, resource production, food, and war-pressure systems
with one game tick as one model step. Food/war mechanics default to neutral
values so current balance is preserved until tuned.

### Use System Dynamics As The Model Shape

There is an existing modeling tradition here: system dynamics. Vensim `.mdl`,
STELLA/XMILE-style models, and LunaSim all revolve around the same small set of
concepts:

- **Stocks / levels**: persistent accumulated state.
- **Flows / rates**: values integrated into or out of stocks.
- **Auxiliaries / variables**: derived expressions used by flows or other
  auxiliaries.
- **Parameters / constants**: tunable values.
- **Connectors / influences**: dependency edges.

That is the right abstraction. The game should not define primitives such as
`births` and `deaths` at the framework level. Those are model-specific flows.
The framework should only know how to evaluate stocks, flows, auxiliaries,
parameters, and dependencies once per game tick.

Vensim's useful pattern is:

```text
Stock = INTEG(inflows - outflows, initialValue)
flow = expression
auxiliary = expression
parameter = constant
```

For OpenFront, the equivalent should be a typed model spec rather than raw
Vensim text as the runtime source of truth:

```ts
interface StockFlowModel {
  id: string;
  variables: Record<string, ModelVariable>;
}

type ModelVariable =
  | StockVariable
  | FlowVariable
  | AuxiliaryVariable
  | ParameterVariable;

interface StockVariable {
  kind: "stock";
  initial: Expression;
  equation: Expression;
  unit?: string;
  nonNegative?: boolean;
  capacity?: Expression;
}

interface FlowVariable {
  kind: "flow";
  equation: Expression;
  unit?: string;
}

interface AuxiliaryVariable {
  kind: "auxiliary";
  equation: Expression;
  unit?: string;
}

interface ParameterVariable {
  kind: "parameter";
  value: number;
  unit?: string;
}
```

This gives us the benefits of `.mdl`-style modeling without making gameplay
depend on parsing a broad external format inside the simulation loop. Unlike
Vensim or LunaSim, OpenFront does not need model-level `INITIAL TIME`,
`FINAL TIME`, `SAVEPER`, selectable timestep, or selectable solver. One game
tick is one model step.

### Compose Small Systems Into A Nation Model

A useful model can be very small. For example, this is a per-nation
food/population system, not the whole game:

```ts
{
  stocks: {
    food: { initial: 0, min: 0 },
    population: { initial: 25_000, min: 0 },
  },
  parameters: {
    foodPerTile: 0.4,
    foodPerPerson: 0.001,
  },
  auxiliaries: {
    foodProduced: ({ inputs, params }) =>
      inputs.tilesOwned * params.foodPerTile,
    foodNeeded: ({ stocks, params }) =>
      stocks.population * params.foodPerPerson,
  },
  flows: {
    produceFood: {
      stock: "food",
      amount: ({ aux }) => aux.foodProduced,
    },
    consumeFood: {
      stock: "food",
      amount: ({ aux, stocks }) => -Math.min(stocks.food, aux.foodNeeded),
    },
  },
}
```

This says:

- `food` is a persistent stock owned by this nation model.
- `population` is a persistent stock owned by this nation model.
- `tilesOwned` is an external input read from the game world.
- `foodProduced` and `foodNeeded` are derived values.
- `produceFood` and `consumeFood` are flow contributions applied by the
  runtime.

The larger economy should be composed from smaller concept systems:

```text
NationSystems
  TerritorySystem
  FoodSystem
  PopulationSystem
  WarSystem
  CitySystem
```

These should be classes with common interfaces, but the classes should not
directly mutate each other's state. Systems interact through named stocks,
inputs, outputs, modifiers, and flow contributions.

```ts
type ValueAddress = `${string}.${string}`;

interface StockFlowSystem {
  readonly id: SystemId;
  readonly reads?: ValueAddress[];
  readonly stocks?: StockDefinitions;
  readonly parameters?: ParameterDefinitions;
  readonly auxiliaries?: AuxiliaryDefinitions;
  readonly outputs?: OutputDefinitions;
  readonly flows?: FlowDefinitions;
}

interface EvaluationContext {
  getNumber(address: ValueAddress): number;
  getBoolean(address: ValueAddress): boolean;
  getString(address: ValueAddress): string;
  player: Player;
  game: Game;
  tick: number;
}
```

Each system owns a concept boundary:

```ts
class FoodSystem implements StockFlowSystem {
  readonly id = "food";

  readonly reads = [
    "territory.tilesOwned",
    "population.current",
    "war.mobilizedPopulation",
  ];

  readonly stocks = {
    "food.stock": { initial: 0, min: 0 },
  };

  readonly parameters = {
    foodPerTile: { value: 0.4 },
    foodPerPerson: { value: 0.001 },
  };

  readonly outputs = {
    "food.produced": ({ getNumber, params }) =>
      getNumber("territory.tilesOwned") * params.foodPerTile,

    "food.needed": ({ getNumber, params }) =>
      getNumber("population.current") * params.foodPerPerson +
      getNumber("war.mobilizedPopulation") * params.foodPerMobilizedPerson,

    "food.shortageRatio": ({ getNumber }) => {
      const needed = getNumber("food.needed");
      const available = getNumber("food.stock") + getNumber("food.produced");
      return needed <= 0 ? 0 : Math.max(0, 1 - available / needed);
    },
  };

  readonly flows = {
    "food.produce": {
      stock: "food.stock",
      amount: ({ getNumber }) => getNumber("food.produced"),
    },

    "food.consume": {
      stock: "food.stock",
      amount: ({ getNumber }) =>
        -Math.min(
          getNumber("food.stock") + getNumber("food.produced"),
          getNumber("food.needed"),
        ),
    },
  };
}
```

The stock id is namespaced as `food.stock` so ownership is explicit. Other
systems may read that stock or contribute flows to it, but the runtime is the
only thing that applies mutations.

The composition target is:

```ts
const nationModel = composeSystems([
  new TerritorySystem(),
  new FoodSystem(),
  new PopulationSystem(),
  new WarSystem(),
  new CitySystem(),
]);
```

The important rule is:

```text
A stock has one owner.
Many systems may read it.
Many systems may contribute flows or modifiers to it.
Only the runtime applies the final summed stock delta.
```

For example, `PopulationSystem` owns the population stock, but other systems can
contribute to it:

```text
normal births       -> population.population
normal deaths       -> population.population
war casualties      -> population.population
starvation deaths   -> population.population
migration           -> population.population
```

`WarSystem` should not do this:

```ts
population.value -= casualties;
```

It should contribute a named flow:

```ts
readonly flows = {
  warDeaths: {
    stock: "population.population",
    amount: ({ getNumber }) => -getNumber("war.casualtyFlow"),
  },
};
```

The runtime then sums all flow contributions for the stock during the tick and
applies the final delta once.

### Addressable Outputs And Declared Reads

The framework does not need a shared output object. The cleaner boundary is:

```text
System-owned outputs:
  Each system publishes named outputs.

System dependencies:
  Each system declares the named outputs, stocks, and inputs it reads.

Runtime:
  Resolves dependency order.
  Evaluates systems.
  Provides read access to already-computed values.
  Applies stock deltas.
```

Common values should be addressable by name:

```text
territory.tilesOwned
war.mobilizedPopulation
war.casualtyFlow
food.stock
food.produced
food.needed
food.shortageRatio
population.current
population.capacity
cities.populationCapacityBonus
```

This gives systems an OOP boundary without hiding the dataflow. For example:

- `TerritorySystem` publishes `territory.tilesOwned`.
- `WarSystem` publishes `war.mobilizedPopulation`.
- `FoodSystem` declares reads for `territory.tilesOwned`,
  `population.current`, and `war.mobilizedPopulation`.
- `FoodSystem` publishes `food.needed` and `food.shortageRatio`.
- `PopulationSystem` declares reads for `territory.tilesOwned` and
  `food.shortageRatio`.

The class owns the formulas. The declared addresses make the dependency surface
visible. The runtime owns ordering and mutation.

For example:

```ts
class WarSystem implements StockFlowSystem {
  readonly id = "war";

  readonly outputs = {
    "war.mobilizedPopulation": ({ player }) =>
      player.outgoingAttacks().reduce((sum, attack) => {
        return sum + attack.troops();
      }, 0),
  };
}

class PopulationSystem implements StockFlowSystem {
  readonly id = "population";

  readonly reads = ["territory.tilesOwned", "food.shortageRatio"];

  readonly stocks = {
    "population.current": { initial: 25_000, min: 0 },
  };

  readonly outputs = {
    "population.capacity": ({ getNumber, params }) =>
      getNumber("territory.tilesOwned") * params.maxPopulationPerTile,
  };

  readonly flows = {
    "population.births": {
      stock: "population.current",
      amount: ({ getNumber, params }) => {
        const population = getNumber("population.current");
        const capacity = getNumber("population.capacity");
        const shortage = getNumber("food.shortageRatio");

        return (
          population *
          params.populationGrowthRate *
          Math.max(0, 1 - population / capacity) *
          Math.max(0, 1 - shortage)
        );
      },
    },
  };
}
```

### Core Concepts

#### Stock

A stock is persistent state.

Examples:

- population
- food
- energy
- materials
- soil fertility
- pollution
- war exhaustion

Suggested shape:

```ts
type StockId = "population" | "food" | "energy" | "materials";

interface StockState {
  id: StockId;
  value: number;
  capacity?: number;
}
```

For resources that must remain `bigint`, the stock layer can either support
numeric stocks and integer stocks separately, or keep `ResourceStockpile` as an
adapter until the compatibility layer is removed.

#### Flow / Rate

A flow changes a stock during a tick.

Examples:

- food production
- food consumption
- births
- deaths
- soil erosion
- pollution degradation

Suggested low-level result shape after evaluation:

```ts
interface FlowResult {
  id: string;
  target: StockId;
  amount: number;
  reason?: string;
}

interface FlowContext {
  tick: number;
  player: Player;
  game: Game;
  stocks: StockSnapshot;
  mechanics: MechanicsConfig;
}

type Flow = (ctx: FlowContext) => FlowResult;
```

This is not the authoring API. It is the compiled/evaluated result shape the
game can apply to player state.

#### Modifier

A modifier transforms a flow or derived variable.

Examples:

- wartime food consumption
- farming technology
- terrain yield
- famine birth penalty
- bot/nation multipliers

Suggested shape:

```ts
interface ModifierResult {
  id: string;
  multiplier: number;
  addend?: number;
}
```

Modifiers are important because many game mechanics are not new systems. They
are changes to existing flows.

#### Auxiliary / Derived Variable

An auxiliary is not stored directly but is needed by flows or other auxiliaries.

Examples:

- max population
- food needed
- food ratio
- famine pressure
- terrain food production
- active war pressure

Suggested shape:

```ts
interface DerivedValue {
  id: string;
  value: number;
  unit?: string;
}
```

#### System Class

A system class groups related stocks, flows, auxiliaries, parameters, and
outputs. It is the authoring boundary for one concept.

Examples:

- PopulationSystem
- FoodSystem
- ResourceProductionSystem
- WarConsumptionSystem
- SoilSystem

Suggested runtime shape:

```ts
interface StockFlowSystem {
  id: string;
  stocks?: StockDefinitions;
  parameters?: ParameterDefinitions;
  auxiliaries?: AuxiliaryDefinitions;
  outputs?: OutputDefinitions;
  flows?: FlowDefinitions;
}
```

The runtime compiles one or more systems into an executable model. Gameplay
phase ordering can still be explicit:

```ts
type StockFlowPhase =
  | "produce"
  | "consume"
  | "derive"
  | "births"
  | "deaths"
  | "clamp"
  | "diagnostics";
```

## Recommended Tick Pipeline

For the first food/population implementation:

```text
1. Start player economy tick
2. Read current stocks and world inputs
3. Evaluate parameters
4. Evaluate auxiliaries
5. Evaluate declared system outputs
6. Evaluate flow contributions
7. Sum flows by target stock
8. Apply stock deltas once
9. Clamp stocks
10. Emit diagnostics/update fields
11. End player economy tick
```

This maps directly to the user's simplified loop:

```text
new tick
produce food
feed people
leftover food remains
system adjusts
births
deaths
tick ends
```

## First Minimal System

### Stocks

```text
population
food
```

Population can initially remain backed by `_troops` for compatibility, but the
system should call it population internally. The UI can still decide whether to
present it as troops in combat surfaces.

### Derived Values

```text
tilesOwned
maxPopulation
foodProduced
foodNeeded
foodConsumed
foodRatio
faminePressure
births
deaths
```

### Flows

```text
foodProduction -> food
foodConsumption -> food
births -> population
deaths -> population
```

### Formula

```text
maxPopulation = tilesOwned * maxPopulationPerTile

foodProduced = tilesOwned * foodProducedPerTilePerTick * terrainModifier
foodNeeded = population * foodPerPersonPerTick

foodConsumed = min(food + foodProduced, foodNeeded)
foodRatio = foodNeeded <= 0 ? 1 : foodConsumed / foodNeeded

births =
  population
  * populationGrowthRate
  * max(0, 1 - population / maxPopulation)
  * foodBirthModifier(foodRatio)

deaths =
  population
  * (baseDeathRate + famineDeathRate * famineDeathModifier(foodRatio))
```

### State Application

```text
food = clamp(food + foodProduced - foodConsumed, 0, foodCapacity)
population = max(0, population + births - deaths)
```

## Why This Makes Wartime Food Consumption Easy

With the stock-flow model, wartime food consumption is just another modifier or
flow in the consume phase.

Simple version:

```text
warFoodNeeded = population * atWarFoodConsumptionMultiplier
foodNeeded = baseFoodNeeded + warFoodNeeded
```

Better version:

```text
mobilizedPopulation = outgoingAttackTroops + defendingCommittedTroops
warFoodNeeded = mobilizedPopulation * foodPerMobilizedPersonPerTick
foodNeeded = baseFoodNeeded + warFoodNeeded
```

This does not require a new famine system. It only changes food demand. The same
food ratio then naturally affects births and deaths.

## Proposed Code Structure

Start small and local. Do not build a generic engine before proving the first
system.

```text
src/core/systems/
  StockFlowModel.ts
  StockFlowCompiler.ts
  StockFlowRuntime.ts
  StockFlowSystem.ts
  ValueAddress.ts
  PlayerEconomyAdapter.ts
  StockFlowDiagnostics.ts
  models/
    FoodSystem.ts
    PopulationSystem.ts
    TerritorySystem.ts
    WarSystem.ts
    CitySystem.ts
    PopulationFoodModel.ts
```

### `StockFlowModel.ts`

Owns generic authoring types:

- model
- stock
- flow
- auxiliary
- parameter
- expression
- unit

### `StockFlowCompiler.ts`

Turns the authoring model into an executable plan:

- parses or accepts expression ASTs
- extracts dependencies
- topologically sorts auxiliaries and flows
- validates missing references
- validates cycles outside stock integration boundaries
- prepares deterministic evaluation order

### `StockFlowRuntime.ts`

Runs one model step:

- reads stock values
- evaluates parameters and auxiliaries
- evaluates declared system outputs
- evaluates flows
- sums flow contributions by target stock
- applies stock deltas for the current game tick once
- clamps non-negative stocks and capacities
- emits diagnostics

There is no separate solver choice in the first implementation. A game tick is
the integration step.

### `StockFlowSystem.ts`

Defines the common class interface for systems:

- id
- owned stocks
- parameters
- auxiliaries
- declared reads
- named outputs
- flow contributions

This is the authoring contract implemented by concept systems such as
`FoodSystem`, `PopulationSystem`, and `WarSystem`.

### `ValueAddress.ts`

Defines address types for readable and writable model values:

- stock addresses such as `food.stock`
- output addresses such as `food.shortageRatio`
- external input addresses such as `territory.tilesOwned`
- parameter addresses when needed

This is the typed bridge between small systems. It keeps cross-system
dependencies explicit without introducing a shared mutable output object.

### `models/PopulationFoodModel.ts`

Owns formulas:

- max population
- food production
- food consumption
- food ratio
- births flow
- deaths flow

This should be authored as a model spec, not a bespoke function collection. It
should be pure enough for tests and sandbox graphs.

### `PlayerEconomyAdapter.ts`

Bridges the generic model runtime to the game:

- maps `Player` state into model stocks and external inputs
- maps model outputs back onto `PlayerImpl`
- exposes diagnostics to `PlayerUpdate`
- preserves compatibility with existing troops/resources APIs while migration is
  incomplete

### `StockFlowDiagnostics.ts`

Defines serializable diagnostic data that can be included in player updates and
used by `/sandbox`.

## Integration Path

### Step 1: Define The Generic Model Spec

Create the general stock-flow model shape first:

- stock
- flow
- auxiliary
- parameter
- expression
- diagnostics

This is the layer that should resemble Vensim/LunaSim/XMILE conceptually.

### Step 2: Compile And Evaluate A Tiny Example

Before touching game mechanics, prove the runtime with tiny models:

```text
Money = INTEG(interest, 100)
interest = Money * interest_rate
interest_rate = 0.1
```

And:

```text
Workers = INTEG(-attrition, 100)
attrition = Workers / average_tenancy
average_tenancy = 10
```

These examples verify stock integration, dependency ordering, units metadata,
and one-step behavior.

### Step 3: Express Current Population Growth As A Model

Represent the current population behavior as a model spec while preserving the
existing `Config` API.

Goal:

```text
Config.troopIncreaseRate(...) delegates to a compiled model evaluation
```

This keeps behavior stable while creating reusable formula surfaces.

### Step 4: Add Diagnostics Without Changing Balance

Return named outputs from the model:

```ts
{
  maxPopulation,
  population,
  populationDelta,
  births,
  deaths,
  foodProduced,
  foodNeeded,
  foodConsumed,
  foodRatio,
}
```

Initially, some fields can be placeholders until food consumption is active.

### Step 5: Replace `PlayerExecution` Economy Lines

Current:

```ts
const troopInc = this.config.troopIncreaseRate(this.player, this.mg);
this.player.addTroops(troopInc);
const resourcesFromWorkers = this.config.resourceIncreaseRate(
  this.mg,
  this.player,
);
this.player.addResources(resourcesFromWorkers, undefined, {
  updateGold: false,
});
```

Target:

```ts
const result = this.playerEconomySystem.tick(this.mg, this.player, ticks);
result.apply();
```

Or less abstract for the first pass:

```ts
const result = evaluatePlayerEconomy(this.mg, this.player, ticks);
applyPlayerEconomyResult(this.player, result);
```

The second form is easier to test and harder to over-engineer.

### Step 6: Add Food Consumption

Once the extracted system matches current behavior, activate explicit food
consumption:

- food production adds to food stock
- food need consumes food stock
- food ratio modifies births/deaths

### Step 7: Extend Updates

Add optional player update fields:

```text
population
populationCapacity
populationBirthRate
populationDeathRate
foodProduced
foodNeeded
foodConsumed
foodRatio
faminePressure
```

Avoid sending every diagnostic every tick if payload size becomes an issue. The
same diffing mechanism can handle this if the fields are included in
`PlayerUpdate`.

### Step 8: Drive Sandbox Graphs From System Outputs

The sandbox should eventually call the compiled model runtime to build graphs.

That gives us one model source for:

- runtime
- tests
- sandbox graphs
- documentation examples

## Determinism Requirements

The system framework must stay deterministic:

- no `Date.now()`
- no random without `PseudoRandom`
- no iteration over unordered object keys when order affects results
- no floating-point branching that can diverge between environments for critical
  game state
- no async work in system evaluation

For population, `number` is probably acceptable because troops already use
numbers. For resources, `bigint` compatibility should remain until the existing
gold/resource bridge is intentionally removed.

## Testing Strategy

### Pure Formula Tests

Test `PopulationFoodSystem` without a game:

- food production from tiles
- food consumption and leftover stock
- birth/death outputs at full food
- birth/death outputs at food shortage
- cap behavior near max population
- zero population
- zero food
- zero capacity

### Integration Tests

Test through `PlayerExecution`:

- one tick changes population and food as expected
- food shortage increases deaths
- food surplus supports growth
- wartime consumption modifier increases food need
- stock capacity clamps food

### Sandbox Tests

Test that mechanics JSON changes:

- food produced per tile
- food consumed per person
- famine death multiplier
- wartime consumption multiplier

And that sandbox graphs can render with system outputs.

## Migration Risks

### Risk: Building Too Generic Too Early

A full systems engine can become abstract before it proves value. The first
implementation should be a small typed framework around the population-food
model, not a generic simulation platform.

### Risk: Breaking Combat Semantics

Troops are currently both population proxy and combat quantity. Splitting them
fully is a larger design decision. First pass should keep the existing combat
surface stable and treat current troops as the population stock internally.

### Risk: Hidden Complexity

Food, famine, technology, soil, and war consumption can produce complex outcomes.
Every stock-flow mechanic needs HUD visibility and sandbox graphs before it
becomes part of normal play.

### Risk: Payload Growth

More diagnostics can increase update size. Start with the fields needed for HUD
and sandbox, and rely on existing diffing.

## Recommended First Deliverable

Create a minimal generic system-dynamics runtime that can run two tiny
Vensim-style examples:

```text
Money = INTEG(interest, 100)
interest = Money * interest_rate
interest_rate = 0.1
```

```text
Workers = INTEG(-attrition, 100)
attrition = Workers / average_tenancy
average_tenancy = 10
```

Then express population and food as the first real game model, with these
outputs:

```ts
interface PopulationFoodTickResult {
  populationBefore: number;
  populationAfter: number;
  maxPopulation: number;
  births: number;
  deaths: number;
  populationDelta: number;

  foodBefore: number;
  foodProduced: number;
  foodNeeded: number;
  foodConsumed: number;
  foodAfter: number;
  foodCapacity: number;
  foodRatio: number;
  faminePressure: number;
}
```

Then add sandbox graphs for:

- population over time with food enabled
- food stockpile over time
- food ratio over time
- births and deaths over time
- food ratio to birth/death modifier curve

## End State

The desired architecture is:

```text
mechanics config
  -> system-dynamics model specs
  -> deterministic model compiler/runtime
  -> player economy adapter applies named flow results
  -> player update emits stocks/rates/diagnostics
  -> HUD and sandbox render the same system outputs
```

This gives us a clean path from simple population and food to richer mechanics
without turning each new idea into bespoke game-loop code.
