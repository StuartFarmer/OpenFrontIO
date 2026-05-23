# Economy Model

OpenFront uses stock-flow economic rules for resources and population pressure.
The current resource system tracks Biomass, Fuels, and Metals as stored stocks.
Troops are still the playable population proxy, but their growth is now constrained
by Biomass carrying capacity.

## Troop Growth

Troop growth uses a logistic population equation:

```text
dT/dt = rT(1 - T / K)
```

Where:

- `T` is current troops.
- `r` is the troop growth rate constant.
- `K` is the effective carrying capacity.

The effective carrying capacity is the lower of two limits:

```text
K = min(spatialTroopCapacity, biomassSupportedTroopCapacity)
```

`spatialTroopCapacity` is the existing land/city capacity from controlled area and
cities. `biomassSupportedTroopCapacity` is derived from the player's controlled
terrain resource blend. Terrain that produces a higher Biomass share supports a
larger sustainable population. Terrain with weaker Biomass production can still
support infrastructure and war, but the population/troop base will not grow past
what Biomass can sustain.

## Famine Pressure

When current troops exceed effective carrying capacity, the logistic equation
becomes negative:

```text
T > K -> dT/dt < 0
```

That creates famine pressure without a separate scripted famine mode. A population
that has grown beyond its Biomass support declines until it reaches the supported
equilibrium. This lets war, conquest, trade, and terrain mix affect military
strength indirectly through the economy.

## Design Intent

This is a controlled adaptation of ecological population modeling rather than raw
predator-prey oscillation. The goal is not automatic boom-bust cycles. The goal is
a readable economic RTS loop:

```text
terrain -> resource production -> Biomass support -> population/troops -> war/trade
```

Future work can split civilian population from troops, consume Biomass explicitly
per tick, expose Biomass coverage in the UI, and make trade/import blends alter
`biomassSupportedTroopCapacity` through actual delivered resources.
