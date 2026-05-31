# Directional Front Rollback Notes

## Purpose

This note records the directional-front changes made after the perimeter-preview
prototype, so we can revert to the previous system without reconstructing it
from memory.

## Current System: Normal Front Share

The current implementation makes preview color and actual frontier priority use
the same one-dimensional distribution over the owned border/front, with an
additional persistent vector corridor for actual expansion priority.

Model:

```ts
x = perimeter distance from peak front;
mu = 0;
sigma = wildernessVectorSharpness;
weight = exp(-0.5 * (x / sigma) ** 2);
share = weight / sum(frontWeights);
```

Meaning:

- `x = 0` is the peak front: the owned border tile closest to the mouse/click.
- `wildernessVectorSharpness` is now a sigma scale.
- Lower sigma produces a sharper spearhead.
- Higher sigma spreads priority across a broader front.
- Preview heat is `share`, where `0` means 0% of troops and `1` means 100% of
  troops assigned to that front segment.
- Frontier priority uses `directionPenalty = -share * priorityScale`.

Main files:

- `src/games/foundation/domain/WildernessExploration.ts`
  - Added `directionalFrontWeight(frontDistance, sigmaScale)`.
  - Added front-share map construction from owned border perimeter distance.
  - Changed launch-front weighting to troop-share bias.
  - Restored forward-vector continuation by scoring every frontier candidate
    against the original ray:
    - forward progress lowers priority, so the wave keeps moving outward.
    - lateral drift raises priority according to the same sigma scale.
    - backward movement is strongly penalized.
- `src/games/foundation/client/FoundationPage.ts`
  - Preview heat map now normalizes front weights into per-border troop shares.
  - `Front sigma` is shown in `Combat -> Front Mechanics` with a log slider.
  - Removed the `Visuals` tab from the main Foundation sidebar.
- `src/client/render/gl/shaders/day-night/border-stamp.frag.glsl`
  - Updated to the five-stop gradient:

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

## What This Replaced

The immediately previous system used only the normalized front-share map for
simulation priority. That made the launch preview coherent, but expansion lost
direction after the old origin became interior. The fix was to keep the normal
front-share model for launch/preview, but restore a persistent vector corridor
for candidate frontier priority.

Before that, the previous system used a perimeter-distance preview but had
separate visual-only tuning knobs. Preview color and simulation priority did
not share the same scalar.

Previous visual model:

```ts
visualFocus = clamp(
  (clickDistance / wildernessDirectionalPreviewDistance) *
    wildernessDirectionalPreviewSharpness,
  0,
  1,
);

concentration = exp(
  -normalizedPerimeterDistance *
    (1 + visualFocus * wildernessDirectionalPreviewFalloff),
);

heat = clamp(
  0.5 + (concentration - 0.5) *
    visualFocus *
    wildernessDirectionalPreviewContrast,
  0,
  1,
);
```

Previous UI:

- Tabs included `World`, `River`, `Combat`, `Ecology`, `Visuals`.
- `Visuals -> Front Gradient` exposed:
  - `wildernessDirectionalPreviewDistance`
  - `wildernessDirectionalPreviewSharpness`
  - `wildernessDirectionalPreviewContrast`
  - `wildernessDirectionalPreviewFalloff`
- `Combat -> Front Mechanics` exposed `wildernessVectorSharpness` as a regular
  linear slider from `0` to `4`.

Previous domain parameters:

```ts
wildernessVectorSharpness: number;
wildernessDirectionalPreviewDistance: number;
wildernessDirectionalPreviewSharpness: number;
wildernessDirectionalPreviewContrast: number;
wildernessDirectionalPreviewFalloff: number;
```

Previous defaults:

```ts
wildernessVectorSharpness: 1,
wildernessDirectionalPreviewDistance: 32,
wildernessDirectionalPreviewSharpness: 1,
wildernessDirectionalPreviewContrast: 2.8,
wildernessDirectionalPreviewFalloff: 8,
```

Previous shader gradient was already sampled from a heat texture, but before
the latest change it used the three-stop heat palette:

```css
linear-gradient(
  90deg,
  rgba(40, 123, 156, 1) 0%,
  rgba(255, 248, 107, 1) 50%,
  rgba(237, 86, 83, 1) 100%
)
```

## Earlier System Also Replaced

Before the perimeter heat map, the shader computed heat from straight-line
distance in world space. That was the version where the back side of a country
could look close because the shader cut through the interior instead of walking
the border perimeter.

Earlier visual model:

```glsl
focus = inverseLogDistance(clickDistance) * wildernessVectorSharpness;
launchDistance = distance(worldPos, origin);
concentration = exp(-launchDistance / spreadRadius);
heat = clamp(0.5 + (concentration - 0.5) * contrast, 0.0, 1.0);
```

That version should generally stay retired because it violates the front-axis
definition.

## Rollback Plan To Previous Perimeter Preview

To revert only the latest normal-front-share change:

1. Restore `FoundationWildernessParameters` fields:
   - `wildernessDirectionalPreviewDistance`
   - `wildernessDirectionalPreviewSharpness`
   - `wildernessDirectionalPreviewContrast`
   - `wildernessDirectionalPreviewFalloff`
2. Restore their defaults and normalization.
3. Restore `Visuals` to `FoundationControlTab` and `FOUNDATION_CONTROL_TABS`.
4. Restore `Visuals -> Front Gradient` controls in `FoundationPage`.
5. Change `Combat -> Front Mechanics` from `logRangeInput("Front sigma", ...)`
   back to a regular `rangeInput("Vector sharpness", ..., 0, 4, 0.05, 2)`.
6. Restore `createDirectionalBorderHeatMap` to use:
   - `visualFocus`
   - `wildernessDirectionalPreviewContrast`
   - `wildernessDirectionalPreviewFalloff`
   - perimeter distance normalized by max connected perimeter distance
7. Restore or remove `directionalFrontWeight` depending on whether simulation
   should also be rolled back.
8. If restoring the prior visual palette, change
   `directionalPriorityColor` back to the three-stop blue/yellow/red palette.

To revert all the way to the pre-perimeter version, additionally remove the
heat-map upload path from `BorderStampPass` and put the heat calculation back
inside `border-stamp.frag.glsl`. That is not recommended unless explicitly
wanted.

## Validation Used After Latest Change

The latest normal-front-share change passed:

- `npx tsc --noEmit`
- focused Vitest suite: 5 files, 43 tests
- `npx vite build --mode development`
