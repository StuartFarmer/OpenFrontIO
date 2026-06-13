/**
 * LocalTerritoryMaskPass — post-spawn focus mask.
 *
 * Once the local player has spawned, darkens tiles outside their territory.
 * The local player's owned tiles are discarded here and in TerritoryPass, so
 * the board inside the local border remains untinted.
 */

import type { RenderSettings } from "../RenderSettings";
import { createMapQuad, createProgram, shaderSrc } from "../utils/GlUtils";
import { TILE_DEFINES } from "../utils/TileCodec";

import maskFragSrc from "../shaders/local-territory-mask/local-territory-mask.frag.glsl?raw";
import overlayVertSrc from "../shaders/map-overlay/overlay.vert.glsl?raw";

export class LocalTerritoryMaskPass {
  private gl: WebGL2RenderingContext;
  private settings: RenderSettings["localTerritoryMask"];
  private mapW: number;
  private mapH: number;
  private tileTex: WebGLTexture;

  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private uCamera: WebGLUniformLocation;
  private uMapSize: WebGLUniformLocation;
  private uLocalPlayerID: WebGLUniformLocation;
  private uMaskColor: WebGLUniformLocation;
  private uMaskAlpha: WebGLUniformLocation;

  private localPlayerID = 0;
  private active = false;

  constructor(
    gl: WebGL2RenderingContext,
    mapW: number,
    mapH: number,
    tileTex: WebGLTexture,
    settings: RenderSettings["localTerritoryMask"],
  ) {
    this.gl = gl;
    this.mapW = mapW;
    this.mapH = mapH;
    this.tileTex = tileTex;
    this.settings = settings;

    this.program = createProgram(
      gl,
      overlayVertSrc,
      shaderSrc(maskFragSrc, TILE_DEFINES),
    );
    this.uCamera = gl.getUniformLocation(this.program, "uCamera")!;
    this.uMapSize = gl.getUniformLocation(this.program, "uMapSize")!;
    this.uLocalPlayerID = gl.getUniformLocation(
      this.program,
      "uLocalPlayerID",
    )!;
    this.uMaskColor = gl.getUniformLocation(this.program, "uMaskColor")!;
    this.uMaskAlpha = gl.getUniformLocation(this.program, "uMaskAlpha")!;

    gl.useProgram(this.program);
    gl.uniform1i(gl.getUniformLocation(this.program, "uTileTex"), 0);

    this.vao = createMapQuad(gl, mapW, mapH);
  }

  setLocalPlayerID(id: number): void {
    this.localPlayerID = id;
  }

  setActive(active: boolean): void {
    this.active = active;
  }

  draw(cameraMatrix: Float32Array): void {
    if (!this.active || this.localPlayerID === 0) return;

    const gl = this.gl;
    const s = this.settings;

    gl.useProgram(this.program);
    gl.uniformMatrix3fv(this.uCamera, false, cameraMatrix);
    gl.uniform2f(this.uMapSize, this.mapW, this.mapH);
    gl.uniform1ui(this.uLocalPlayerID, this.localPlayerID);
    gl.uniform3f(this.uMaskColor, s.colorR, s.colorG, s.colorB);
    gl.uniform1f(this.uMaskAlpha, s.alpha);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tileTex);

    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  dispose(): void {
    const gl = this.gl;
    gl.deleteProgram(this.program);
    gl.deleteVertexArray(this.vao);
  }
}
