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

For a candidate frontier tile `T`:

```ts
d = normalize(target - origin);
p = T - origin;

forward = dot(p, d);
lateral = abs(cross(p, d));
distance = length(target - origin);
```

The existing wilderness priority remains in place, including terrain and
owned-neighbor weighting. Direction adds a soft priority term. Distance affects
focus through a bounded inverse-log curve, scaled by `wildernessVectorSharpness`,
so very distant clicks do not become unrealistically narrow:

```ts
focus = clamp(
  (1 - 1 / (1 + log1p(distance / 40))) * wildernessVectorSharpness,
  0,
  1,
);
```

That focus chooses the lateral penalty and forward bias used by:

```ts
directionPenalty =
  lateral * lateralPenalty +
  max(0, -forward) * backwardPenalty +
  max(0, forward - distance) * overshootPenalty -
  forward * forwardBias;
```

Lower priority is claimed first. This means tiles ahead of the click vector are
preferred, sideways tiles are delayed, tiles behind the origin are strongly
delayed, and tiles beyond the requested reach are allowed but de-prioritized.

The MVP keeps this as a soft bias. It should never prevent legal connected
growth; it only changes the order in which frontier tiles are selected.

## Visual MVP

When the pointer hovers over a valid unowned target:

- Color the current nation border in the WebGL border stamp pass.
- Use a linear visual focus based on click distance and
  `wildernessDirectionalPreviewDistance`; the preview does not use the
  simulation's inverse-log focus.
- Clear the preview when the pointer leaves the map, hovers an invalid target,
  or clicks to commit a wave.
- A committed wave does not keep border heat active in the MVP.

## Border Heat

The persistent heat gradient belongs on the nation's border, not on the arrow.
The WebGL border stamp shader colors owned border tiles from a preview heat map
computed by the game layer. Heat is based on each border tile's graph distance
from the peak front while walking around the owned perimeter, not by straight
line distance through the territory interior. This makes the back side of a
front the farthest border region even when it is spatially near the click. The
visual focus is:

```ts
visualFocus = clamp(
  (clickDistance / wildernessDirectionalPreviewDistance) *
    wildernessDirectionalPreviewSharpness,
  0,
  1,
);
```

This makes the closest launch front red when the click is focused, unrelated
border blue, and broad/equal pressure yellow. The simulation still refuses to
claim water tiles, so water can define intent without becoming a valid movement
surface.

Visual-only tuning:

- `wildernessDirectionalPreviewDistance`: click distance needed for full visual
  focus.
- `wildernessDirectionalPreviewSharpness`: multiplier for visual focus.
- `wildernessDirectionalPreviewContrast`: color gain away from yellow.
- `wildernessDirectionalPreviewFalloff`: perimeter-distance decay strength.

Gradient:

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
- Yellow: equal-priority baseline across border pixels.
- Red: strongest concentration at the likely launch border.

For multi-wave support, the shader should evaluate up to a small fixed number
of active wave intents and color each owned border tile by the strongest local
pressure.
