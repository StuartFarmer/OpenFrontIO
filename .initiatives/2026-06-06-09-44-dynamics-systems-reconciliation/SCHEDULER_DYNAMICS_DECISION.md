# Scheduler And Dynamics Decision

## Decision

Use this architecture for reconciled systems:

```text
GameSystemScheduler
  -> runs ordered game systems
      -> some systems run compiled dynamics graphs
      -> some systems run imperative gameplay code
```

## Why

The dynamics editor is the right authoring surface for stock-flow style mechanics: food, population, resource production, capacity, demand, surplus, starvation pressure, and similar numeric feedback loops.

The game also has discrete procedural behavior that is a poor fit for a single graph: command validation, attacks, tile conquest, projectile lifecycle, AI decisions, unit construction, update emission, and legacy execution ordering. Those systems need explicit ordered code paths with direct access to game services.

`GameSystemScheduler` is therefore the outer runtime. A scheduled system may run a compiled dynamics graph when its behavior is numeric and declarative. A scheduled system remains imperative when it owns commands, entities, map mutation, or emitted updates.

## Guardrails

- Keep the current Foundation dynamics save/simulate flow as the base.
- Keep React Flow as editor/view state, not runtime state.
- Compile dynamics graphs into reusable runtime structures before gameplay consumes them.
- Use typed adapters to read game state and apply graph outputs.
- Do not restore the deleted historical compiler module.
- Do not force attacks, projectiles, AI, or update emission into dynamics graphs.
