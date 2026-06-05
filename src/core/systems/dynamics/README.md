# Dynamics Systems

This package contains the Layer 1 system-dynamics builder used by the
Foundation dynamics page. It is intentionally game-agnostic: Foundation provides
templates and UI, while this package owns graph schema, compilation, and
simulation traces.

## Concepts

### System Definition

A `DynamicsSystemDefinition` is the saved model. It contains:

- `version`: schema version for future migrations.
- `id`, `name`, `description`: model metadata.
- `nodes`: typed graph nodes.
- `edges`: directed links between node handles.

Node `id` values are stable references used by edges, scenarios, persistence,
and simulation traces. Node `name` values are user-editable labels. Rename a
node by changing `name`; changing `id` is a migration because connected edges
and scenarios refer to it.

### Scenario

A `DynamicsScenario` is a set of values used to run a saved system. It does not
change the system graph. It can override:

- `inputValues`: values for external input nodes.
- `parameterValues`: tunable constants.
- `stockInitialValues`: starting stock levels.
- `tickCount`: how many discrete simulation steps to run.

This separation lets a single system be tested under many assumptions without
duplicating the graph.

### External Inputs

Input nodes are named editable values supplied from outside the model. In one
system `population` may be an external input. In another system, population can
be derived from `tilesOwned` or from a separate population stock. The graph does
not treat either choice as special; it only requires named nodes and explicit
edges.

## Node Catalog

- `input`: external editable value, such as `tilesOwned`.
- `parameter`: tunable constant, such as `yieldPerTile` or capacity.
- `math`: combines incoming values with `add`, `subtract`, `multiply`, `divide`,
  `power`, `min`, `max`, or `clamp`.
- `activation`: maps one incoming value through `linear`, `logistic`, `power`,
  or `step`. Logistic uses `min`, `max`, and `k`, with `k = 0` producing a
  linear curve over the 0..1 input range.
- `flow`: per-tick movement into or out of a stock. Its `direction` is either
  `inflow` or `outflow`.
- `stock`: accumulated state with an initial value and optional min/max clamps.
  Incoming `max` or `capacity` handles can drive capacity dynamically.
- `probe`: trace output for inspecting values. Stock probes can read `value`,
  `delta`, or `overflow`.

## Compilation

`compileDynamicsSystem(system)` turns a graph into the generic
`StockFlowModel`. Inputs and parameters become external input addresses.
Math, activation, flow, and probe nodes become runtime outputs. Stock nodes
become stock definitions, and flow nodes become signed stock-flow updates.

The compiler validates:

- duplicate node ids,
- edges pointing at missing nodes,
- graph cycles,
- flow nodes that are not connected to a stock.

`defaultDynamicsInputs(system)` extracts the configured input and parameter
values from the graph.

## Simulation

`runDynamicsSimulation(system, scenario)` compiles the system and runs it for
`scenario.tickCount` ticks. Each frame includes:

- `values`: numeric node outputs and probe values,
- `stocks`: stock values by node id,
- `flows`: flow amounts by flow node id,
- `stockDeltas`: per-tick stock changes by stock node id,
- `stockOverflows`: stock clipped by max capacity.

Overflow is diagnostic output only. It is useful for UI and balancing, but it
does not feed another downstream stock unless the graph explicitly models that.

## Simple Food Stock Template

`SIMPLE_FOOD_STOCK_TEMPLATE` is the first Foundation template. Its model is:

```txt
foodProduction = tilesOwned * yieldPerTile
foodDemand = population * foodPerPopulation
foodStock = clamp(foodStock + foodProduction - foodDemand, 0, foodStockCapacity)
```

The template is built from generic nodes:

- `tilesOwned` and `population` are input nodes.
- `yieldPerTile`, `foodPerPopulation`, and `foodStockCapacity` are parameters.
- `foodProduction` and `foodDemand` are multiply math nodes.
- `foodProductionFlow` is an inflow to `foodStock`.
- `foodDemandFlow` is an outflow from `foodStock`.
- `foodStockDelta` and `foodStockOverflow` are probes for inspection.

This keeps the current food model minimal while making it easy to add richer
production inputs later, such as crop reference, labor, weather, technology, or
logistic yield modifiers.

## Foundation UI

`/foundation/dynamics` is the visual builder and simulator. Lit owns the
Foundation page shell and persistence controls. React Flow owns the graph
editing surface. The bridge mounts React with `createRoot` because Lit is
hosting React in this direction.

For React projects consuming Foundation web components, use `@lit/react`
wrappers. `FoundationDynamicsPageReact.tsx` exposes such a wrapper for the
custom element so React callers can use idiomatic props and typed events.
