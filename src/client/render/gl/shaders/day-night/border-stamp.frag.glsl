#version 300 es
precision highp float;
precision highp usampler2D;

uniform usampler2D uTileTex;
uniform sampler2D uPalette;
uniform sampler2D uBorderTex;     // RGBA8 — border flags from BorderComputePass
uniform sampler2D uAffiliation;   // 256×2 RGBA8 — affiliation colors (row 0 = border)
uniform vec2 uMapSize;
uniform int uAltView;
uniform float uHighlightBrighten;
uniform float uDefenseCheckerDarken;
uniform float uEmbargoTintRatio;
uniform float uFriendlyTintRatio;
uniform vec3 uEmberColorDark;
uniform vec3 uEmberColorBright;
uniform float uEmberStrengthUnowned;
uniform int uDirectionalBorderActive;
uniform uint uDirectionalBorderOwner;
uniform vec2 uDirectionalBorderOrigin;
uniform vec2 uDirectionalBorderDirection;
uniform float uDirectionalBorderDistance;
uniform float uDirectionalBorderSharpness;

in vec2 vWorldPos;
out vec4 fragColor;

float vectorSharpnessFocus(float distance, float sharpness) {
  if (distance <= 0.0 || sharpness <= 0.0) return 0.0;
  float inverseLogDistance = 1.0 - 1.0 / (1.0 + log(1.0 + distance / 40.0));
  return clamp(inverseLogDistance * sharpness, 0.0, 1.0);
}

vec3 directionalPriorityColor(float heat) {
  vec3 cold = vec3(40.0, 123.0, 156.0) / 255.0;
  vec3 mid = vec3(255.0, 248.0, 107.0) / 255.0;
  vec3 hot = vec3(237.0, 86.0, 83.0) / 255.0;
  if (heat < 0.5) return mix(cold, mid, heat * 2.0);
  return mix(mid, hot, (heat - 0.5) * 2.0);
}

float directionalBorderHeat(vec2 worldPos) {
  vec2 target =
    uDirectionalBorderOrigin +
    normalize(uDirectionalBorderDirection) * uDirectionalBorderDistance;
  float focus = vectorSharpnessFocus(
    uDirectionalBorderDistance,
    uDirectionalBorderSharpness
  );
  float falloffWidth = max(
    1.5,
    uDirectionalBorderDistance / (1.0 + focus * 10.0)
  );
  float extraDistance = max(
    0.0,
    distance(worldPos, target) - uDirectionalBorderDistance
  );
  float concentration = exp(-extraDistance / falloffWidth);

  // Yellow is the equal-priority baseline. Higher focus turns the same
  // distance field into sharper red/blue concentration bands.
  return clamp(mix(0.5, concentration, focus), 0.0, 1.0);
}

void main() {
  ivec2 tc = ivec2(floor(vWorldPos));
  if (tc.x < 0 || tc.y < 0 || tc.x >= int(uMapSize.x) || tc.y >= int(uMapSize.y)) discard;

  uint raw = texelFetch(uTileTex, tc, 0).r;
  uint owner = raw & uint(OWNER_MASK);

  // Read pre-computed border flags from BorderComputePass
  vec4 borderData = texelFetch(uBorderTex, tc, 0);
  float borderType = borderData.r;      // 0=interior, ~0.5=normal, ~1.0=highlight
  float emberIntensity = borderData.g;   // 0–1 flicker value
  bool defense = borderData.b > 0.5;    // defense post proximity
  float relation = borderData.a;        // 0.0=neutral, ~0.5=friendly, ~1.0=embargo

  bool isBorder = borderType > 0.25;
  bool isHighlightBorder = borderType > 0.75;

  // --- Border stamp: full-brightness border color ---
  if (isBorder && owner != 0u) {
    vec3 bc;
    if (uAltView != 0) {
      // Alt-view: pure affiliation color from palette row 0
      bc = texelFetch(uAffiliation, ivec2(int(owner), 0), 0).rgb;
    } else {
      float u = (float(owner) + 0.5) / float(PALETTE_SIZE);
      bc = texture(uPalette, vec2(u, 0.75)).rgb;
      if (uDirectionalBorderActive != 0 && owner == uDirectionalBorderOwner) {
        float heat = directionalBorderHeat(vec2(tc) + vec2(0.5));
        bc = directionalPriorityColor(heat);
      }
      if (isHighlightBorder) {
        bc = mix(bc, vec3(1.0), uHighlightBrighten);
      }
      // Relationship tint (applied BEFORE defense checkerboard, matching game)
      if (relation > 0.75) {
        bc = mix(bc, vec3(1.0, 0.0, 0.0), uEmbargoTintRatio);
      } else if (relation > 0.25) {
        bc = mix(bc, vec3(0.0, 1.0, 0.0), uFriendlyTintRatio);
      }
      // Defense bonus: checkerboard darken (applied AFTER tint, matching game)
      if (defense) {
        bool checker = ((tc.x + tc.y) & 1) == 1;
        if (checker) bc *= uDefenseCheckerDarken;
      }
    }
    fragColor = vec4(bc, 1.0);
    return;
  }

  // --- Ember stamp: full-brightness ember on fallout tiles ---
  if (emberIntensity > 0.0) {
    float h = fract(sin(float(tc.x) * 12.9898 + float(tc.y) * 78.233) * 43758.5453);
    vec3 ember = mix(uEmberColorDark, uEmberColorBright, h) * emberIntensity * uEmberStrengthUnowned;
    float a = max(ember.r, max(ember.g, ember.b));
    if (a > 0.01) {
      fragColor = vec4(ember, 1.0);
      return;
    }
  }

  discard;
}
