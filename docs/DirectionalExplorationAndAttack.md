# Directional Exploration and Attack

## Goal

Exploration and attack clicks should describe a movement vector, not just a target
tile. When the player clicks outside their territory, troops push from the closest
owned border toward the clicked point. This keeps growth connected to territory
while making troop movement read as an intentional wave instead of an even blob.

## Player Model

- A click on unowned terrain or water creates a wave.
- The wave origin is the owned border tile closest to the click.
- The wave target is the clicked tile.
- The vector from origin to target defines the preferred movement direction and
  approximate reach.
- Hovering over unowned terrain previews the border priority colors that would
  result from that click.

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

For a candidate frontier tile `T`, the directional component is derived from
the owned border tile that feeds that candidate. The x-axis is the graph
distance around the owned front from the peak front, where the peak front is the
border tile closest to the mouse/click.

```ts
x = perimeterDistanceFromPeakFront;
mu = 0;
sigma = wildernessVectorSharpness;
```

The existing wilderness priority remains in place, including terrain and
owned-neighbor weighting. Direction adds a soft priority term based on a normal
distribution over the current front:

```ts
weight(x) = exp(-0.5 * (x / sigma) ** 2);
share(x) = weight(x) / sum(frontWeights);
```

Lower priority is claimed first, so the share becomes a negative priority bias:

```ts
directionPenalty = -share(x) * priorityScale;
```

This means the preview and actual expansion priority use the same troop-share
distribution. `wildernessVectorSharpness` is the only directional sharpness
knob. It is a sigma scale: lower values concentrate troops near the peak front;
higher values spread troops across the front.

## Visual MVP

When the pointer hovers over a valid unowned target:

- Color the current nation border in the WebGL border stamp pass.
- Use the same normalized normal distribution as frontier priority.
- Clear the preview when the pointer leaves the map, hovers an invalid target,
  or clicks to commit a wave.
- A committed wave does not keep border heat active in the MVP.

## Border Heat

The persistent heat gradient belongs on the nation's border, not on the arrow.
The WebGL border stamp shader colors owned border tiles from a preview heat map
computed by the game layer. Heat is based on each border tile's graph distance
from the peak front while walking around the owned perimeter, not by straight
line distance through the territory interior. This makes the back side of a
front the farthest border region even when it is spatially near the click.

```ts
heat = share(x);
```

This means `0` is no troops assigned to that front segment and `1` is all
troops assigned to that front segment. The simulation still refuses to claim
water tiles, so water can define intent without becoming a valid movement
surface.

Gradient:

```css
linear-gradient(
  90deg,
  rgba(25, 26, 92, 1) 0%,
  rgba(40, 123, 156, 1) 25%,
  rgba(255, 248, 107, 1) 50%,
  rgba(237, 86, 83, 1) 75%,
  rgba(255, 255, 255, 1) 100%
)
```

Interpretation:

- Deep blue: 0% of troops.
- Cool blue: 25% of troops.
- Yellow: 50% of troops.
- Red: 75% of troops.
- White: 100% of troops.

For multi-wave support, the shader should evaluate up to a small fixed number
of active wave intents and color each owned border tile by the strongest local
pressure.
