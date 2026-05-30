import type { GameView as OpenFrontGameView } from "../../../core/game/GameView";
import { WebGLFrameBuilder } from "../../WebGLFrameBuilder";
import type { FrameUploadTarget, UploadOptions } from "../frame/Upload";
import { uploadFrameData } from "../frame/Upload";
import type { GameView as WebGLGameView } from "../gl";
import type { FrameData } from "../types";

export type OpenFrontFrameUploadTarget = FrameUploadTarget;

export function uploadOpenFrontFrameData(
  view: OpenFrontFrameUploadTarget,
  frame: FrameData,
  opts?: UploadOptions,
): void {
  uploadFrameData(view, frame, opts);
}

/**
 * Explicit name for the current OpenFront-shaped WebGL bridge.
 *
 * This adapter intentionally keeps OpenFront FrameData, player cosmetics,
 * spawn overlays, terrain mutation forwarding, and full-frame upload dispatch
 * out of the base-map renderer contract.
 */
export class OpenFrontCompatibilityAdapter {
  private readonly builder: WebGLFrameBuilder;

  constructor(view: WebGLGameView) {
    this.builder = new WebGLFrameBuilder(view);
  }

  update(gameView: OpenFrontGameView): void {
    this.builder.update(gameView);
  }
}
