/**
 * ConquestPopupPass — MSDF-rendered floating text popups.
 *
 * Renders two kinds of popups using the same MSDF atlas as NamePass:
 * - Conquest popups: "+ 500" gold text at conquered player locations (static position, fade only)
 * - Bonus popups: "+ 45K" income text at port tiles (rises upward + fades)
 */

import type { ResourceKind } from "../../../../core/game/Resources";
import type { BonusEvent, ConquestFx } from "../../types";
import type { RenderSettings } from "../RenderSettings";
import { createProgram } from "../utils/GlUtils";
import type { GlyphTables } from "./name-pass/AtlasData";
import { buildGlyphTables, parseAtlasData } from "./name-pass/AtlasData";
import { buildGlyphMetricsTex } from "./name-pass/DataTextures";
import { CHAR_RANGE, MAX_CHARS } from "./name-pass/Types";

import { assetUrl } from "src/core/AssetUrls";
import fragSrc from "../shaders/conquest-popup/conquest-popup.frag.glsl?raw";
import vertSrc from "../shaders/conquest-popup/conquest-popup.vert.glsl?raw";

const atlasUrl = assetUrl("atlases/msdf-atlas.png");

const resourceIconUrls: Record<ResourceKind, string> = {
  food: assetUrl("icons/biomass-icon.svg"),
  energy: assetUrl("icons/fuel-icon.svg"),
  materials: assetUrl("icons/metal-icon.svg"),
};

const resourceIconIndex: Record<ResourceKind, number> = {
  food: 0,
  energy: 1,
  materials: 2,
};

const iconVertSrc = `#version 300 es
precision highp float;

layout(location = 0) in vec2 aPos;
layout(location = 1) in vec4 aInst;
layout(location = 2) in vec4 aStyle;
layout(location = 3) in vec2 aScaleSize;

uniform mat3 uCamera;
uniform float uFontSize;
uniform float uBase;
uniform float uZoom;
uniform float uMinScreenScale;

out vec2 vUV;
flat out float vAlpha;
flat out vec3 vColor;
flat out int vIconIndex;

void main() {
  float worldX = aInst.x;
  float worldY = aInst.y;
  float cursorX = aInst.z;
  int iconIndex = int(aInst.w);

  if (aStyle.x <= 0.0) {
    gl_Position = vec4(0.0);
    vUV = vec2(0.0);
    vAlpha = 0.0;
    vColor = vec3(1.0);
    vIconIndex = 0;
    return;
  }

  float effectiveScale = max(aScaleSize.x, uMinScreenScale / uZoom);
  float worldScale = effectiveScale / uFontSize;
  float iconSize = aScaleSize.y;

  vec2 center = vec2(worldX + 0.5, worldY + 0.5);
  float baselineY = -uBase * 0.5;
  vec2 iconCenter =
    vec2(cursorX + iconSize * 0.5, baselineY + iconSize * 0.42) *
    worldScale;
  vec2 iconSizeWorld = vec2(iconSize) * worldScale;
  vec2 worldPos = center + iconCenter + (aPos - vec2(0.5)) * iconSizeWorld;

  vec3 clip = uCamera * vec3(worldPos, 1.0);
  gl_Position = vec4(clip.xy, 0.0, 1.0);
  vUV = aPos;
  vAlpha = aStyle.x;
  vColor = aStyle.yzw;
  vIconIndex = iconIndex;
}
`;

const iconFragSrc = `#version 300 es
precision highp float;

uniform sampler2D uIcon0;
uniform sampler2D uIcon1;
uniform sampler2D uIcon2;

in vec2 vUV;
flat in float vAlpha;
flat in vec3 vColor;
flat in int vIconIndex;
out vec4 fragColor;

float sampleIconAlpha(vec2 uv) {
  if (vIconIndex == 0) {
    return texture(uIcon0, uv).a;
  } else if (vIconIndex == 1) {
    return texture(uIcon1, uv).a;
  }
  return texture(uIcon2, uv).a;
}

vec2 iconTexel() {
  if (vIconIndex == 0) {
    return 1.0 / vec2(textureSize(uIcon0, 0));
  } else if (vIconIndex == 1) {
    return 1.0 / vec2(textureSize(uIcon1, 0));
  }
  return 1.0 / vec2(textureSize(uIcon2, 0));
}

void main() {
  if (vAlpha <= 0.0) discard;

  float fillAlpha = sampleIconAlpha(vUV);
  vec2 d = iconTexel() * 1.15;
  float outlineAlpha = fillAlpha;
  outlineAlpha = max(outlineAlpha, sampleIconAlpha(vUV + vec2( d.x, 0.0)));
  outlineAlpha = max(outlineAlpha, sampleIconAlpha(vUV + vec2(-d.x, 0.0)));
  outlineAlpha = max(outlineAlpha, sampleIconAlpha(vUV + vec2(0.0,  d.y)));
  outlineAlpha = max(outlineAlpha, sampleIconAlpha(vUV + vec2(0.0, -d.y)));
  outlineAlpha = max(outlineAlpha, sampleIconAlpha(vUV + vec2( d.x,  d.y)));
  outlineAlpha = max(outlineAlpha, sampleIconAlpha(vUV + vec2(-d.x,  d.y)));
  outlineAlpha = max(outlineAlpha, sampleIconAlpha(vUV + vec2( d.x, -d.y)));
  outlineAlpha = max(outlineAlpha, sampleIconAlpha(vUV + vec2(-d.x, -d.y)));

  if (outlineAlpha <= 0.01) discard;
  vec3 color = mix(vec3(0.0), vColor, fillAlpha);
  fragColor = vec4(color, outlineAlpha * vAlpha);
}
`;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// worldX, worldY, cursorX, charCode, alpha, colorR, colorG, colorB, scale, outlineWidth
const FLOATS_PER_INSTANCE = 10;
const BYTES_PER_INSTANCE = FLOATS_PER_INSTANCE * 4;
const ICON_FLOATS_PER_INSTANCE = 10;
const ICON_BYTES_PER_INSTANCE = ICON_FLOATS_PER_INSTANCE * 4;
const CONQUEST_LIFETIME_MS = 2500;
/** Nominal game tick rate — 100ms per tick. */
const MS_PER_TICK = 100;
/** Tiles below conquered name location (matches upstream DynamicUILayer). */
const CONQUEST_Y_OFFSET = 8;
/** World-space font size for conquest popups. */
const CONQUEST_SCALE = 6;
const CONQUEST_OUTLINE_WIDTH = 2.0;
const RESOURCE_ICON_FONT_SIZE = 46;

// ---------------------------------------------------------------------------
// Active popup tracking
// ---------------------------------------------------------------------------

type PopupPart =
  | { type: "text"; text: string }
  | { type: "icon"; kind: ResourceKind };

interface ActivePopup {
  x: number;
  y: number;
  parts: PopupPart[];
  startMs: number;
  lifetimeMs: number;
  riseSpeed: number; // world units per second (0 = no rise)
  colorR: number;
  colorG: number;
  colorB: number;
  scale: number;
  outlineWidth: number;
}

function formatGold(gold: number): string {
  if (gold >= 1_000_000) return (gold / 1_000_000).toFixed(1) + "M";
  if (gold >= 1_000) return (gold / 1_000).toFixed(1) + "K";
  return gold.toString();
}

function hasResourcePayload(resources?: {
  food: number;
  energy: number;
  materials: number;
}): boolean {
  return (
    resources !== undefined &&
    (resources.food !== 0 ||
      resources.energy !== 0 ||
      resources.materials !== 0)
  );
}

function resourceParts(resources: {
  food: number;
  energy: number;
  materials: number;
}): PopupPart[] {
  return [
    { type: "icon", kind: "food" },
    { type: "text", text: ` ${formatGold(resources.food)} / ` },
    { type: "icon", kind: "energy" },
    { type: "text", text: ` ${formatGold(resources.energy)} / ` },
    { type: "icon", kind: "materials" },
    { type: "text", text: ` ${formatGold(resources.materials)}` },
  ];
}

function formatConquestParts(evt: ConquestFx): PopupPart[] | null {
  const resources = evt.resources;
  const hasResources = hasResourcePayload(resources);
  const hasGold = evt.gold !== 0;

  if (!hasGold && !hasResources) return null;

  const parts: PopupPart[] = [{ type: "text", text: "+ " }];
  if (hasGold) {
    parts.push({ type: "text", text: `${formatGold(evt.gold)}g` });
  }
  if (hasResources && resources !== undefined) {
    if (hasGold) parts.push({ type: "text", text: " / " });
    parts.push(...resourceParts(resources));
  }
  return parts;
}

function formatBonusParts(evt: BonusEvent): PopupPart[] | null {
  const resources = evt.resources;
  if (hasResourcePayload(resources) && resources !== undefined) {
    return [{ type: "text", text: "+ " }, ...resourceParts(resources)];
  }
  if (evt.gold === 0) return null;

  const sign = evt.gold >= 0 ? "+" : "-";
  return [{ type: "text", text: sign + " " + formatGold(Math.abs(evt.gold)) }];
}

// ---------------------------------------------------------------------------
// ConquestPopupPass
// ---------------------------------------------------------------------------

export class ConquestPopupPass {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private iconProgram: WebGLProgram;
  private maxInstances = 512;
  private maxIconInstances = 256;

  // Uniform locations
  private uCamera: WebGLUniformLocation;
  private uZoom: WebGLUniformLocation;
  private uMinScreenScale: WebGLUniformLocation;
  private uDistRange: WebGLUniformLocation;

  private vao: WebGLVertexArrayObject;
  private instanceBuf: WebGLBuffer;
  private instanceData: Float32Array;
  private instanceCount = 0;

  private iconVao: WebGLVertexArrayObject;
  private iconInstanceBuf: WebGLBuffer;
  private iconInstanceData: Float32Array;
  private iconInstanceCount = 0;
  private iconTextures: Array<WebGLTexture | null> = [null, null, null];
  private iconsReady = false;

  private uIconCamera: WebGLUniformLocation;
  private uIconZoom: WebGLUniformLocation;
  private uIconMinScreenScale: WebGLUniformLocation;

  private glyphMetricsTex: WebGLTexture;
  private atlasTex: WebGLTexture | null = null;
  private atlasReady = false;

  // CPU-side glyph tables for layoutString
  private glyph: GlyphTables;
  private kernTable: Int8Array;

  private distanceRange: number;
  private fontSize: number;
  private atlasScaleH: number;
  private base: number;

  // Active popups (both conquest and bonus, unified)
  private active: ActivePopup[] = [];

  // Settings reference
  private settings: RenderSettings;

  // Map width for tile→x/y conversion
  private mapW = 0;

  // Pluggable time source (same pattern as FxPass)
  private timeFn: () => number = () => performance.now();
  private now(): number {
    return this.timeFn();
  }

  constructor(gl: WebGL2RenderingContext, settings: RenderSettings) {
    this.gl = gl;
    this.settings = settings;

    // Parse atlas data (shared with NamePass/StructureLevelPass)
    const atlas = parseAtlasData();
    this.glyph = buildGlyphTables(atlas.chars);
    this.kernTable = new Int8Array(CHAR_RANGE * CHAR_RANGE);
    this.distanceRange = atlas.distanceRange;
    this.fontSize = atlas.fontSize;
    this.atlasScaleH = atlas.scaleH;
    this.base = atlas.base;

    // Compile shaders
    this.program = createProgram(gl, vertSrc, fragSrc);

    // Texture unit bindings
    gl.useProgram(this.program);
    gl.uniform1i(gl.getUniformLocation(this.program, "uAtlas"), 0);
    gl.uniform1i(gl.getUniformLocation(this.program, "uGlyphMetrics"), 1);

    // Static uniforms
    gl.uniform1f(
      gl.getUniformLocation(this.program, "uFontSize")!,
      this.fontSize,
    );
    gl.uniform1f(
      gl.getUniformLocation(this.program, "uAtlasScaleH")!,
      this.atlasScaleH,
    );
    gl.uniform1f(gl.getUniformLocation(this.program, "uBase")!, this.base);

    // Dynamic uniform locations
    this.uCamera = gl.getUniformLocation(this.program, "uCamera")!;
    this.uZoom = gl.getUniformLocation(this.program, "uZoom")!;
    this.uMinScreenScale = gl.getUniformLocation(
      this.program,
      "uMinScreenScale",
    )!;
    this.uDistRange = gl.getUniformLocation(this.program, "uDistRange")!;

    this.iconProgram = createProgram(gl, iconVertSrc, iconFragSrc);
    gl.useProgram(this.iconProgram);
    gl.uniform1i(gl.getUniformLocation(this.iconProgram, "uIcon0"), 0);
    gl.uniform1i(gl.getUniformLocation(this.iconProgram, "uIcon1"), 1);
    gl.uniform1i(gl.getUniformLocation(this.iconProgram, "uIcon2"), 2);
    gl.uniform1f(
      gl.getUniformLocation(this.iconProgram, "uFontSize")!,
      this.fontSize,
    );
    gl.uniform1f(gl.getUniformLocation(this.iconProgram, "uBase")!, this.base);
    this.uIconCamera = gl.getUniformLocation(this.iconProgram, "uCamera")!;
    this.uIconZoom = gl.getUniformLocation(this.iconProgram, "uZoom")!;
    this.uIconMinScreenScale = gl.getUniformLocation(
      this.iconProgram,
      "uMinScreenScale",
    )!;

    this.loadResourceIcons();

    // Glyph metrics data texture
    this.glyphMetricsTex = buildGlyphMetricsTex(gl, atlas);

    // Start async MSDF atlas load
    this.loadAtlas();

    // Instance buffer
    this.instanceData = new Float32Array(
      this.maxInstances * FLOATS_PER_INSTANCE,
    );
    this.instanceBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      this.instanceData.byteLength,
      gl.DYNAMIC_DRAW,
    );

    // VAO
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);

    // Attribute 0: unit quad [0,1]²
    const quadBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // Per-instance attributes from instance buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuf);
    // Attribute 1: vec4 (worldX, worldY, cursorX, charCode) at offset 0
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, BYTES_PER_INSTANCE, 0);
    gl.vertexAttribDivisor(1, 1);
    // Attribute 2: vec4 (alpha, colorR, colorG, colorB) at offset 16
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, BYTES_PER_INSTANCE, 16);
    gl.vertexAttribDivisor(2, 1);
    // Attribute 3: vec2 (scale, outlineWidth) at offset 32
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 2, gl.FLOAT, false, BYTES_PER_INSTANCE, 32);
    gl.vertexAttribDivisor(3, 1);

    this.iconInstanceData = new Float32Array(
      this.maxIconInstances * ICON_FLOATS_PER_INSTANCE,
    );
    this.iconInstanceBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.iconInstanceBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      this.iconInstanceData.byteLength,
      gl.DYNAMIC_DRAW,
    );

    this.iconVao = gl.createVertexArray()!;
    gl.bindVertexArray(this.iconVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.iconInstanceBuf);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, ICON_BYTES_PER_INSTANCE, 0);
    gl.vertexAttribDivisor(1, 1);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, ICON_BYTES_PER_INSTANCE, 16);
    gl.vertexAttribDivisor(2, 1);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 2, gl.FLOAT, false, ICON_BYTES_PER_INSTANCE, 32);
    gl.vertexAttribDivisor(3, 1);

    gl.bindVertexArray(null);
  }

  private loadAtlas(): void {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const gl = this.gl;
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      this.atlasTex = tex;
      this.atlasReady = true;
    };
    img.src = atlasUrl;
  }

  private loadResourceIcons(): void {
    const entries = (["food", "energy", "materials"] as ResourceKind[]).map(
      (kind) => [resourceIconIndex[kind], resourceIconUrls[kind]] as const,
    );

    for (const [index, url] of entries) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const gl = this.gl;
        const tex = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          img,
        );
        this.iconTextures[index] = tex;
        this.iconsReady = this.iconTextures.every((t) => t !== null);
      };
      img.src = url;
    }
  }

  setMapWidth(w: number): void {
    this.mapW = w;
  }

  // -------------------------------------------------------------------------
  // Event input
  // -------------------------------------------------------------------------

  applyConquestEvents(events: ConquestFx[]): void {
    const now = this.now();
    for (const evt of events) {
      const startMs = now - (evt.tickAge ?? 0) * MS_PER_TICK;
      if (now - startMs >= CONQUEST_LIFETIME_MS) continue;
      const parts = formatConquestParts(evt);
      if (parts === null) continue;
      this.active.push({
        x: evt.x,
        y: evt.y + CONQUEST_Y_OFFSET,
        parts,
        startMs,
        lifetimeMs: CONQUEST_LIFETIME_MS,
        riseSpeed: 0,
        colorR: 1,
        colorG: 1,
        colorB: 1,
        scale: CONQUEST_SCALE,
        outlineWidth: CONQUEST_OUTLINE_WIDTH,
      });
    }
  }

  applyBonusEvents(events: BonusEvent[]): void {
    if (this.mapW === 0) return;
    const now = this.now();
    const s = this.settings.bonusPopup;
    for (const evt of events) {
      const parts = formatBonusParts(evt);
      if (parts === null) continue;
      const x = evt.tile % this.mapW;
      const y = Math.floor(evt.tile / this.mapW);
      this.active.push({
        x,
        y: y + s.yOffset,
        parts,
        startMs: now,
        lifetimeMs: s.lifetimeMs,
        riseSpeed: s.riseSpeed,
        colorR: s.colorR,
        colorG: s.colorG,
        colorB: s.colorB,
        scale: s.scale,
        outlineWidth: s.outlineWidth,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Tick — cull expired, rebuild instance buffer
  // -------------------------------------------------------------------------

  tick(): void {
    if (this.active.length === 0) return;
    const now = this.now();

    // Remove expired popups (swap-remove)
    for (let i = this.active.length - 1; i >= 0; i--) {
      if (now - this.active[i].startMs >= this.active[i].lifetimeMs) {
        this.active[i] = this.active[this.active.length - 1];
        this.active.pop();
      }
    }

    this.rebuildInstances(now);
  }

  private rebuildInstances(now: number): void {
    let textCount = 0;
    let iconCount = 0;

    for (const popup of this.active) {
      const elapsed = now - popup.startMs;
      const alpha = Math.max(0, 1 - elapsed / popup.lifetimeMs);
      if (alpha <= 0) continue;

      // Rise animation: move upward over time
      const riseY =
        popup.riseSpeed > 0
          ? popup.y - (elapsed / 1000) * popup.riseSpeed
          : popup.y;

      const totalWidth = this.partsAdvance(popup.parts);
      let cursor = 0;

      for (const part of popup.parts) {
        if (part.type === "text") {
          textCount = this.appendTextInstances(
            part.text,
            popup,
            riseY,
            alpha,
            cursor,
            totalWidth,
            textCount,
          );
          cursor += this.textAdvance(part.text);
        } else {
          if (iconCount >= this.maxIconInstances) {
            this.growIconBuffer();
          }
          const off = iconCount * ICON_FLOATS_PER_INSTANCE;
          this.iconInstanceData[off + 0] = popup.x;
          this.iconInstanceData[off + 1] = riseY;
          this.iconInstanceData[off + 2] = cursor - totalWidth * 0.5;
          this.iconInstanceData[off + 3] = resourceIconIndex[part.kind];
          this.iconInstanceData[off + 4] = alpha;
          this.iconInstanceData[off + 5] = popup.colorR;
          this.iconInstanceData[off + 6] = popup.colorG;
          this.iconInstanceData[off + 7] = popup.colorB;
          this.iconInstanceData[off + 8] = popup.scale;
          this.iconInstanceData[off + 9] = RESOURCE_ICON_FONT_SIZE;
          iconCount++;
          cursor += RESOURCE_ICON_FONT_SIZE;
        }
      }
    }

    this.instanceCount = textCount;
    this.iconInstanceCount = iconCount;
  }

  private partsAdvance(parts: PopupPart[]): number {
    return parts.reduce((sum, part) => {
      return (
        sum +
        (part.type === "text"
          ? this.textAdvance(part.text)
          : RESOURCE_ICON_FONT_SIZE)
      );
    }, 0);
  }

  private textAdvance(text: string): number {
    const len = Math.min(text.length, MAX_CHARS);
    let cumulative = 0;
    let prevCode = 0;
    for (let i = 0; i < len; i++) {
      const code = text.charCodeAt(i);
      let adv = this.glyph.advance[code] ?? 0;
      if (i > 0) {
        adv += this.kernTable[prevCode * CHAR_RANGE + code] ?? 0;
      }
      cumulative += adv;
      prevCode = code;
    }
    return cumulative;
  }

  private appendTextInstances(
    text: string,
    popup: ActivePopup,
    riseY: number,
    alpha: number,
    cursorStart: number,
    totalWidth: number,
    count: number,
  ): number {
    const len = Math.min(text.length, MAX_CHARS);
    let cumulative = 0;
    let prevCode = 0;

    for (let i = 0; i < len; i++) {
      const code = text.charCodeAt(i);
      if (code === 0) continue;
      if (count >= this.maxInstances) {
        this.growBuffer();
      }

      const off = count * FLOATS_PER_INSTANCE;
      this.instanceData[off + 0] = popup.x;
      this.instanceData[off + 1] = riseY;
      this.instanceData[off + 2] = cursorStart + cumulative - totalWidth * 0.5;
      this.instanceData[off + 3] = code;
      this.instanceData[off + 4] = alpha;
      this.instanceData[off + 5] = popup.colorR;
      this.instanceData[off + 6] = popup.colorG;
      this.instanceData[off + 7] = popup.colorB;
      this.instanceData[off + 8] = popup.scale;
      this.instanceData[off + 9] = popup.outlineWidth;
      count++;

      let adv = this.glyph.advance[code] ?? 0;
      if (i > 0) {
        adv += this.kernTable[prevCode * CHAR_RANGE + code] ?? 0;
      }
      cumulative += adv;
      prevCode = code;
    }

    return count;
  }

  private growBuffer(): void {
    this.maxInstances *= 2;
    const newData = new Float32Array(this.maxInstances * FLOATS_PER_INSTANCE);
    newData.set(this.instanceData);
    this.instanceData = newData;
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      this.instanceData.byteLength,
      gl.DYNAMIC_DRAW,
    );
  }

  private growIconBuffer(): void {
    this.maxIconInstances *= 2;
    const newData = new Float32Array(
      this.maxIconInstances * ICON_FLOATS_PER_INSTANCE,
    );
    newData.set(this.iconInstanceData);
    this.iconInstanceData = newData;
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.iconInstanceBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      this.iconInstanceData.byteLength,
      gl.DYNAMIC_DRAW,
    );
  }

  // -------------------------------------------------------------------------
  // Draw
  // -------------------------------------------------------------------------

  draw(cameraMatrix: Float32Array, zoom: number): void {
    if (zoom < this.settings.bonusPopup.cullZoom) return;
    if (this.instanceCount === 0 && this.iconInstanceCount === 0) return;

    const gl = this.gl;

    if (this.atlasReady && this.instanceCount > 0) {
      gl.useProgram(this.program);
      gl.uniformMatrix3fv(this.uCamera, false, cameraMatrix);
      gl.uniform1f(this.uZoom, zoom);
      gl.uniform1f(
        this.uMinScreenScale,
        this.settings.bonusPopup.minScreenScale,
      );
      gl.uniform1f(this.uDistRange, this.distanceRange);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.atlasTex!);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.glyphMetricsTex);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuf);
      gl.bufferSubData(
        gl.ARRAY_BUFFER,
        0,
        this.instanceData,
        0,
        this.instanceCount * FLOATS_PER_INSTANCE,
      );

      gl.bindVertexArray(this.vao);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.instanceCount);
    }

    if (this.iconsReady && this.iconInstanceCount > 0) {
      gl.useProgram(this.iconProgram);
      gl.uniformMatrix3fv(this.uIconCamera, false, cameraMatrix);
      gl.uniform1f(this.uIconZoom, zoom);
      gl.uniform1f(
        this.uIconMinScreenScale,
        this.settings.bonusPopup.minScreenScale,
      );

      for (let i = 0; i < this.iconTextures.length; i++) {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, this.iconTextures[i]);
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, this.iconInstanceBuf);
      gl.bufferSubData(
        gl.ARRAY_BUFFER,
        0,
        this.iconInstanceData,
        0,
        this.iconInstanceCount * ICON_FLOATS_PER_INSTANCE,
      );

      gl.bindVertexArray(this.iconVao);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.iconInstanceCount);
    }
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  /** Override the time source. Default: performance.now (wall clock). */
  setTimeFn(fn: () => number): void {
    this.timeFn = fn;
  }

  clear(): void {
    this.active.length = 0;
    this.instanceCount = 0;
    this.iconInstanceCount = 0;
  }

  dispose(): void {
    const gl = this.gl;
    gl.deleteProgram(this.program);
    gl.deleteProgram(this.iconProgram);
    gl.deleteBuffer(this.instanceBuf);
    gl.deleteBuffer(this.iconInstanceBuf);
    gl.deleteVertexArray(this.vao);
    gl.deleteVertexArray(this.iconVao);
    gl.deleteTexture(this.glyphMetricsTex);
    if (this.atlasTex) gl.deleteTexture(this.atlasTex);
    for (const tex of this.iconTextures) {
      if (tex) gl.deleteTexture(tex);
    }
  }
}
