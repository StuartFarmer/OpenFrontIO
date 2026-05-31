# Directional Exploration and Attack

## Goal

Exploration and attack clicks should describe a movement vector, not just a target
tile. When the player clicks outside their territory, troops push from the closest
owned border toward the clicked point. This keeps growth connected to territory
while making troop movement read as an intentional wave instead of an even blob.

## Player Model

- A click on unowned terrain creates a wave.
- The wave origin is the owned border tile closest to the click.
- The wave target is the clicked tile.
- The vector from origin to target defines the preferred movement direction and
  approximate reach.
- The committed troop count is displayed on a temporary arrow from origin to
  target.

For the MVP, there is still one active wilderness exploration. A second click
reinforces and retargets that active exploration. Future multi-wave support
should store independent active waves so each wave keeps its own troops,
frontier, and priority vector.

## Simulation Intent

Each active exploration stores:

```ts
{
  originTile: TileRef;
  targetTile: TileRef;
  dx: number;
  dy: number;
  distance: number;
}
```

`dx` and `dy` are normalized. The intent is captured when the command is
accepted and does not drift as territory changes.

## Frontier Priority

For a candidate frontier tile `T`:

```ts
d = normalize(target - origin)
p = T - origin

forward = dot(p, d)
lateral = abs(cross(p, d))
distance = length(target - origin)
```

The existing wilderness priority remains in place, including terrain and
owned-neighbor weighting. Direction adds a soft priority term:

```ts
directionPenalty =
  lateral * lateralPenalty
  + max(0, -forward) * backwardPenalty
  + max(0, forward - distance) * overshootPenalty
  - forward * forwardBias
```

Lower priority is claimed first. This means tiles ahead of the click vector are
preferred, sideways tiles are delayed, tiles behind the origin are strongly
delayed, and tiles beyond the requested reach are allowed but de-prioritized.

The MVP keeps this as a soft bias. It should never prevent legal connected
growth; it only changes the order in which frontier tiles are selected.

## Visual MVP

When a wilderness command is accepted:

- Draw a temporary thin arrow from origin to target.
- Use a blue -> yellow -> red gradient on the arrow to indicate direction and
  increasing priority.
- Place a compact label near the arrow showing committed troops.
- The overlay should be non-interactive and expire automatically after a short
  duration.

## Border Heat Follow-Up

The persistent border heat gradient should be implemented in the WebGL border
stamp path. Border tiles can compute the same directional priority score in the
shader using a small fixed array of active wave uniforms.

Recommended gradient:

```css
linear-gradient(
  90deg,
  rgba(40, 123, 156, 1) 0%,
  rgba(255, 248, 107, 1) 50%,
  rgba(237, 86, 83, 1) 100%
)
```

Interpretation:

- Blue: low directional pressure.
- Yellow: moderate directional pressure.
- Red: strongest active expedition pressure.

For multi-wave support, the shader should evaluate up to a small fixed number
of active wave intents and color each owned border tile by the strongest local
pressure.
