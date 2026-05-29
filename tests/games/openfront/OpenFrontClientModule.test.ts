import { describe, expect, test } from "vitest";
import {
  OpenFrontClientModule,
  removeExistingGameSurfaces,
} from "../../../src/games/openfront/client/OpenFrontClientModule";

describe("OpenFrontClientModule", () => {
  test("openfront_client_module_mounts_current_runner", () => {
    expect(OpenFrontClientModule.mount).toEqual(expect.any(Function));
  });

  test("remove_existing_game_surfaces_removes_openfront_runtime_elements", () => {
    document.body.innerHTML = `
      <canvas id="webgl-debug-canvas"></canvas>
      <div id="game-input-overlay"></div>
      <div id="other-client-element"></div>
    `;

    removeExistingGameSurfaces();

    expect(document.querySelector("#webgl-debug-canvas")).toBeNull();
    expect(document.querySelector("#game-input-overlay")).toBeNull();
    expect(document.querySelector("#other-client-element")).not.toBeNull();
  });
});
