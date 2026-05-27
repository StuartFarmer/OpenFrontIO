# War Battle Systems Report

This document records the proposed troop and war-economy mechanics for the
stock-flow model and the standalone simulator at `/sandbox/war`.

The goal is not to replace the current combat system first. The current game
already has a useful border-grinding model:

1. An attacker commits troops.
2. Those troops leave the attacker's home troop stock.
3. The active attack stack grinds across defender border tiles.
4. Attacker losses come out of the active attack stack.
5. Defender losses come out of the defender's home troop stock.
6. Captured border tiles transfer to the attacker.

The missing layer is economic metabolism: food, energy, materials, supply
shortage, devastation, and conquest destruction.

## Current Combat Shape

Current land combat is tile-based border grinding.

- `AttackExecution` removes committed troops from the attacker and creates an
  active `Attack`.
- Existing opposing attacks between the same two players cancel each other out.
- Each tick, `attackTilesPerTick(...)` computes an abstract tile-pressure budget.
- For each captured tile, `attackLogic(...)` computes attacker troop loss,
  defender troop loss, and the tile cost used by the conquest loop.
- Defender troop loss is based mostly on defender troop density:

```text
defenderTroopLoss = defenderTroops / defenderTiles
```

- Conquest speed is based heavily on comparative force size:

```text
tilePressure ~= clamp((5 * attackTroops / defenderTroops) * 2, 0.01, 0.5)
                * borderWidth
                * 3
```

- Terrain modifies both losses and speed. Plains are easiest, mountains are
  slowest and most expensive.

This is already compatible with a mobilization model: active attacking soldiers
are explicit, while defenders are implicitly represented by troop density and
incoming attack pressure.

## Unified War-Economy Model

The proposed model keeps the current combat formulas as the base and adds a
stock-flow layer around them.

### Stocks

Each side has:

```text
troops
food
energy
materials
tiles
```

The defender also has:

```text
devastation
```

The battle has:

```text
activeAttackers
outcome
```

### Mobilization

When the attack starts:

```text
activeAttackers += committedTroops
attackerTroops -= committedTroops
```

Defenders are not moved into a separate permanent stack. Instead, the model
derives active defensive burden from incoming pressure:

```text
activeDefenders =
  min(
    defenderTroops,
    activeAttackers * defenseMobilizationResponse,
    defenderTroops * maxDefensiveMobilizationFraction
  )
```

This lets defenders pay economic upkeep without rewriting the current defender
troop-loss model.

Recommended defaults:

```text
defenseMobilizationResponse = 1.0
maxDefensiveMobilizationFraction = 0.60
```

### War Upkeep

War upkeep is paid per tick, per 1,000 active soldiers.

Default attacker coefficients:

```text
food      = 1.00
energy    = 0.50 * combatIntensity
materials = 0.80 * combatIntensity
```

Default defender coefficients:

```text
food      = 0.70
energy    = 0.20 * combatIntensity
materials = 0.50 * combatIntensity
```

The coefficients are multiplied by:

```text
warUpkeepScalePer1000Troops = 5
```

Actual cost:

```text
cost = activeTroops / 1000 * coefficient * warUpkeepScale
```

The default ratios make defense economically cheaper while keeping attack as
the only way to win territory.

### Combat Intensity

Combat intensity is derived from the same force-ratio shape already used by the
current attack model:

```text
combatIntensity =
  clamp(defenderTroops / max(activeAttackers * 5, 1), 0.20, 1.00)
```

This makes evenly contested or underpowered attacks resource-intensive, while
overwhelming attacks spend less energy/material per active soldier.

### Supply

Supply is the minimum affordability ratio across food, energy, and materials:

```text
supply =
  min(
    availableFood / requiredFood,
    availableEnergy / requiredEnergy,
    availableMaterials / requiredMaterials
  )
```

Then:

```text
supply = clamp(supply, minSupplyMultiplier, 1.0)
```

Default:

```text
minSupplyMultiplier = 0.25
```

Supply then modifies the current combat shape:

```text
tilePressure *= attackerSupply

attackerLosses *= defenderSupply * (1 + (1 - attackerSupply))
defenderLosses *= attackerSupply * (1 + (1 - defenderSupply))
```

Interpretation:

- An undersupplied attacker advances slower and dies faster.
- An undersupplied defender inflicts less damage and dies faster.
- The existing combat model remains the base behavior.

### Devastation

War damages defender productivity.

```text
devastation +=
  conqueredTileShare * conqueredTileDevastation
  + casualtyShare * casualtyDevastation
```

Defaults:

```text
conqueredTileDevastation = 0.35
casualtyDevastation = 0.10
maxDevastation = 0.80
```

Production is reduced by:

```text
production *= 1 - devastation
```

When there is no active fighting, devastation recovers:

```text
devastation -= devastationRecoveryPerTick
```

Default:

```text
devastationRecoveryPerTick = 0.00003
```

### Conquest Spoils

When a defender collapses, conquest is not a clean transfer. Resources are split
into captured, destroyed, and abandoned/remainder portions.

Defaults:

```text
Food:
  captured  = 20%
  destroyed = 50%
  remaining = 30%

Energy:
  captured  = 30%
  destroyed = 50%
  remaining = 20%

Materials:
  captured  = 40%
  destroyed = 30%
  remaining = 30%
```

Materials are most recoverable. Food and energy are easier to burn, spoil, or
lose in conquest.

## Tick Order

The simulator uses this order:

```text
1. Produce resources from tiles.
2. Derive active defender burden from attack pressure.
3. Compute combat intensity.
4. Compute attacker and defender upkeep.
5. Compute supply multipliers.
6. Pay available resources.
7. Compute tile pressure using current combat ratios.
8. Capture border tiles.
9. Apply troop losses.
10. Add devastation.
11. If defender collapses, split conquest resources.
12. End tick.
```

## Simulator

The standalone sandbox route is:

```text
/sandbox/war
```

It lets us tune:

- attacker and defender troops
- attacker and defender food, energy, and materials
- attacker and defender territory
- attack commitment
- terrain
- border width
- defensive mobilization response
- war upkeep coefficients
- production per tile
- devastation rates
- conquest capture/destruction ratios

It charts:

- home troops, active attackers, defender troops, defender tiles
- attacker and defender resource stocks
- supply, combat intensity, losses, tile capture rate, and devastation

This sandbox is intentionally separate from live combat. It is the calibration
surface for deciding which war-economy pieces should be connected to the real
game loop next.
