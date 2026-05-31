/**
 * BorderStampPass — territory borders + defense checkerboard + embers.
 *
 * Always draws at full brightness (after the optional night composite).
 * Reads pre-computed border flags, ember intensity, and defense proximity
 * from the BorderComputePass RGBA8 buffer.
 */

import type { DirectionalBorderIntentInput } from "../../types";
import type { RenderSettings } from "../RenderSettings";
import { getPaletteSize } from "../utils/ColorUtils";
import {
  createMapQuad,
  createProgram,
  createTexture2D,
  shaderSrc,
} from "../utils/GlUtils";
import { TILE_DEFINES } from "../utils/TileCodec";

import borderStampFragSrc from "../shaders/day-night/border-stamp.frag.glsl?raw";
import borderStampVertSrc from "../shaders/day-night/border-stamp.vert.glsl?raw";

export class BorderStampPass {
  private gl: WebGL2RenderingContext;
  private settings: RenderSettings;
  private mapW: number;
  private mapH: number;

  private program: WebGLProgram;
  private uCam: WebGLUniformLocation;
  private uMapSize: WebGLUniformLocation;
  private uHighlightBrighten: WebGLUniformLocation;
  private uDefenseCheckerDarken: WebGLUniformLocation;
  private uEmbargoTintRatio: WebGLUniformLocation;
  private uFriendlyTintRatio: WebGLUniformLocation;
  private uEmberColorDark: WebGLUniformLocation;
  private uEmberColorBright: WebGLUniformLocation;
  private uEmberStrengthUnowned: WebGLUniformLocation;
  private uAltView: WebGLUniformLocation;
  private uDirectionalBorderActive: WebGLUniformLocation;
  private uDirectionalBorderOwner: WebGLUniformLocation;
  private uDirectionalBorderHeatTex: WebGLUniformLocation;

  private vao: WebGLVertexArrayObject;
  private tileTex: WebGLTexture;
  private paletteTex: WebGLTexture;
  private borderTex: WebGLTexture;
  private directionalHeatTex: WebGLTexture;
  private affiliationTex: WebGLTexture | null = null;
  private altView = false;
  private directionalIntent: DirectionalBorderIntentInput | null = null;

  constructor(
    gl: WebGL2RenderingContext,
    mapW: number,
    mapH: number,
    tileTex: WebGLTexture,
    paletteTex: WebGLTexture,
    borderTex: WebGLTexture,
    settings: RenderSettings,
  ) {
    this.gl = gl;
    this.settings = settings;
    this.mapW = mapW;
    this.mapH = mapH;
    this.tileTex = tileTex;
    this.paletteTex = paletteTex;
    this.borderTex = borderTex;

    this.program = createProgram(
      gl,
      borderStampVertSrc,
      shaderSrc(borderStampFragSrc, {
        PALETTE_SIZE: getPaletteSize(),
        ...TILE_DEFINES,
      }),
    );
    this.uCam = gl.getUniformLocation(this.program, "uCamera")!;
    this.uMapSize = gl.getUniformLocation(this.program, "uMapSize")!;
    this.uHighlightBrighten = gl.getUniformLocation(
      this.program,
      "uHighlightBrighten",
    )!;
    this.uDefenseCheckerDarken = gl.getUniformLocation(
      this.program,
      "uDefenseCheckerDarken",
    )!;
    this.uEmbargoTintRatio = gl.getUniformLocation(
      this.program,
      "uEmbargoTintRatio",
    )!;
    this.uFriendlyTintRatio = gl.getUniformLocation(
      this.program,
      "uFriendlyTintRatio",
    )!;
    this.uEmberColorDark = gl.getUniformLocation(
      this.program,
      "uEmberColorDark",
    )!;
    this.uEmberColorBright = gl.getUniformLocation(
      this.program,
      "uEmberColorBright",
    )!;
    this.uEmberStrengthUnowned = gl.getUniformLocation(
      this.program,
      "uEmberStrengthUnowned",
    )!;
    this.uAltView = gl.getUniformLocation(this.program, "uAltView")!;
    this.uDirectionalBorderActive = gl.getUniformLocation(
      this.program,
      "uDirectionalBorderActive",
    )!;
    this.uDirectionalBorderOwner = gl.getUniformLocation(
      this.program,
      "uDirectionalBorderOwner",
    )!;
    this.uDirectionalBorderHeatTex = gl.getUniformLocation(
      this.program,
      "uDirectionalBorderHeatTex",
    )!;

    gl.useProgram(this.program);
    gl.uniform1i(gl.getUniformLocation(this.program, "uTileTex"), 0);
    gl.uniform1i(gl.getUniformLocation(this.program, "uPalette"), 1);
    gl.uniform1i(gl.getUniformLocation(this.program, "uBorderTex"), 2);
    gl.uniform1i(gl.getUniformLocation(this.program, "uAffiliation"), 3);
    gl.uniform1i(this.uDirectionalBorderHeatTex, 4);

    this.vao = createMapQuad(gl, mapW, mapH);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    this.directionalHeatTex = createTexture2D(gl, {
      width: mapW,
      height: mapH,
      internalFormat: gl.R8,
      format: gl.RED,
      type: gl.UNSIGNED_BYTE,
      data: new Uint8Array(mapW * mapH),
      filter: gl.NEAREST,
    });
  }

  setAltView(active: boolean): void {
    this.altView = active;
  }
  setAffiliationTex(tex: WebGLTexture): void {
    this.affiliationTex = tex;
  }
  setDirectionalIntent(intent: DirectionalBorderIntentInput | null): void {
    this.directionalIntent = intent;
    if (intent) {
      this.uploadDirectionalHeatMap(intent.heatMap);
    }
  }

  /** Draw borders + defense checkerboard + embers. Blending must be enabled. */
  draw(cameraMatrix: Float32Array): void {
    const gl = this.gl;
    const mo = this.settings.mapOverlay;

    gl.useProgram(this.program);
    gl.uniformMatrix3fv(this.uCam, false, cameraMatrix);
    gl.uniform2f(this.uMapSize, this.mapW, this.mapH);
    gl.uniform1f(this.uHighlightBrighten, mo.highlightBrighten);
    gl.uniform1f(this.uDefenseCheckerDarken, mo.defenseCheckerDarken);
    gl.uniform1f(this.uEmbargoTintRatio, mo.embargoTintRatio);
    gl.uniform1f(this.uFriendlyTintRatio, mo.friendlyTintRatio);
    gl.uniform3f(
      this.uEmberColorDark,
      mo.emberColorDarkR,
      mo.emberColorDarkG,
      mo.emberColorDarkB,
    );
    gl.uniform3f(
      this.uEmberColorBright,
      mo.emberColorBrightR,
      mo.emberColorBrightG,
      mo.emberColorBrightB,
    );
    gl.uniform1f(this.uEmberStrengthUnowned, mo.emberStrengthUnowned);
    gl.uniform1i(this.uAltView, this.altView ? 1 : 0);
    this.uploadDirectionalIntent();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tileTex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.paletteTex);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.borderTex);
    if (this.affiliationTex) {
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, this.affiliationTex);
    }
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, this.directionalHeatTex);

    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private uploadDirectionalHeatMap(heatMap: Uint8Array): void {
    if (heatMap.length !== this.mapW * this.mapH) {
      return;
    }

    const gl = this.gl;
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, this.directionalHeatTex);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      this.mapW,
      this.mapH,
      gl.RED,
      gl.UNSIGNED_BYTE,
      heatMap,
    );
  }

  private uploadDirectionalIntent(): void {
    const gl = this.gl;
    const intent = this.directionalIntent;
    if (
      !intent ||
      intent.distance <= 0 ||
      intent.sharpness <= 0 ||
      intent.heatMap.length !== this.mapW * this.mapH ||
      !Number.isFinite(intent.directionX) ||
      !Number.isFinite(intent.directionY)
    ) {
      gl.uniform1i(this.uDirectionalBorderActive, 0);
      return;
    }

    gl.uniform1i(this.uDirectionalBorderActive, 1);
    gl.uniform1ui(this.uDirectionalBorderOwner, intent.ownerId);
  }

  dispose(): void {
    const gl = this.gl;
    gl.deleteProgram(this.program);
    gl.deleteVertexArray(this.vao);
    gl.deleteTexture(this.directionalHeatTex);
  }
}
