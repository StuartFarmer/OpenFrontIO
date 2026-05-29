# Causal Influence Architecture

This note records a future direction for OpenFront's strategic simulation layer:
use a Democracy-style causal influence graph for soft game dynamics while
retaining stock-flow systems for conserved quantities.

## Reference Model

The Democracy series stores much of its game logic in editable CSV files. The
model is often described as neural-network-like, but in practice it is a
designer-authored causal graph:

```text
source value -> expression using x -> target value
```

The Democracy 3 simulation data inspected locally has this broad shape:

- `policies.csv`: player-controlled policy nodes and their effects.
- `simulation.csv`: core national indicators such as GDP, education, health,
  crime, unemployment, environment, and poverty.
- `situations.csv`: threshold-triggered situations that activate when inputs
  cross start/stop trigger values.
- `pressuregroups.csv`: groups that react to voter-type approval and can create
  political pressure.
- `sliders.csv`: control metadata for policy ranges.
- `policygroups.csv`: UI grouping metadata.

Effect cells are simple expressions with an optional delay/inertia field:

```text
Target, expression, optional_delay
```

Examples from the inspected data:

```text
CarbonTax -> CO2Emissions: 0-(0.5*x),8
CarbonTax -> GDP: -0.25*(x^2),4
GDP -> Unemployment: 0.9-(0.7*x)
Pollution trigger input: Environment,1.0-(1.0*x)
```

This gives designers nonlinear effects, feedback loops, delayed responses, and
moddability without requiring every relationship to become a dedicated code
path.

## Fit For OpenFront

OpenFront already has a stock-flow layer under `src/core/systems`. It is the
right foundation for authoritative quantities:

- population/troops
- food, energy, and materials
- resource production and consumption
- storage capacity
- combat losses
- conquest transfer and destruction
- units, territory, and ownership

Those values should remain stock-flow or direct game state because they need
conservation, clamping, and clear mutation ownership.

A causal influence graph is a better fit for soft strategic pressures:

- morale
- war exhaustion
- logistics pressure
- unrest and rebellion risk
- productivity
- famine severity
- pollution/devastation
- migration pressure
- farming technology or efficiency
- diplomatic trust
- economic confidence
- combat readiness modifiers

These values do not need to be conserved like resources. They need readable
feedback loops and designer-tunable curves.

## Recommended Hybrid Model

Do not replace stock-flow wholesale. Add a `CausalInfluenceSystem` beside the
existing systems layer.

```text
authoritative game state
  -> normalized graph inputs
  -> causal influence graph
  -> pressure/modifier outputs
  -> stock-flow and gameplay systems
  -> authoritative mutations
```

Example connections:

```text
war.exhaustion       -> population.growthMultiplier
logistics.shortage   -> attack.speedMultiplier
famine.severity      -> population.famineDeaths
pollution            -> food.productionMultiplier
morale               -> combat effectiveness
productivity         -> resource.productionMultiplier
unrest               -> rebellion or sabotage risk
```

The causal graph should mostly output modifiers and pressures, not directly
mutate stocks. Stock-flow systems should continue to own stock deltas.

## Data Shape

A first data-driven version could use CSV or JSON. CSV is attractive for
modding and spreadsheet editing; JSON is easier to validate and evolve. A simple
CSV edge format would be:

```csv
source,target,expression,delay,clamp
carbon_tax,co2_emissions,0-(0.5*x),8,true
food_shortage,unrest,0.2+(0.7*x),4,true
war_exhaustion,morale,0-(0.6*x),6,true
```

Supporting node metadata could live separately:

```csv
id,label,default,min,max,kind
morale,Morale,0.6,0,1,pressure
war_exhaustion,War Exhaustion,0,0,1,pressure
productivity,Productivity,0.5,0,1,modifier
```

Situations can be represented as thresholded nodes:

```csv
id,label,input,start,stop,positive
famine,Famine,food.shortageRatio,0.6,0.35,false
rebellion,Risk of Rebellion,unrest,0.75,0.45,false
boom,Economic Boom,confidence,0.8,0.55,true
```

## Runtime Rules

The runtime should stay deterministic and cheap:

1. Read authoritative game inputs.
2. Normalize inputs into `0..1` graph values where practical.
3. Evaluate graph edges against previous-tick source values.
4. Sum target contributions.
5. Apply delay/inertia.
6. Clamp node values.
7. Emit outputs as named values for stock-flow and gameplay systems.
8. Store diagnostics for HUD and sandbox views.

Cycles should use previous-tick values rather than recursive solving. This keeps
feedback deterministic and avoids order-dependent multiplayer divergence.

## Why This Helps

Many strategy-game dynamics are easier to express as causal feedback than as
strict stock-flow equations:

```text
war -> exhaustion -> morale loss -> weaker fighting -> longer war
food shortage -> unrest -> productivity loss -> lower food production
pollution -> health loss -> productivity loss -> weaker economy
```

These loops create the same kind of emergent behavior we want from stock-flow,
but with much less code churn and much better tuning ergonomics.

The main boundary is conservation. If the player can store, spend, capture, or
destroy it, keep it as a stock. If the player should feel it as a pressure,
risk, preference, or modifier, put it in the causal graph.

## Implementation Path

1. Build a small in-memory causal graph runtime with hardcoded test data.
2. Add expression parsing for a safe subset: `x`, numbers, `+`, `-`, `*`, `/`,
   parentheses, and powers.
3. Add CSV or JSON loading with schema validation.
4. Feed a few graph outputs into existing systems as neutral-by-default
   modifiers.
5. Add sandbox diagnostics for node values, edge contributions, and delayed
   response curves.
6. Only then expose the format as a supported modding surface.

Good first candidate nodes:

- `war.exhaustion`
- `morale`
- `logistics.shortage`
- `famine.severity`
- `productivity`
- `unrest`

Good first modifier outputs:

- population growth multiplier
- resource production multiplier
- attack speed or combat effectiveness multiplier
- famine death pressure

## Open Questions

- CSV or JSON as the initial authoring format.
- Whether graph nodes are global, per-player, per-team, or mixed.
- How much of the graph should be visible to players in the HUD.
- Whether situation nodes should create events, modifiers, or both.
- How mod compatibility should work once node IDs become public API.
