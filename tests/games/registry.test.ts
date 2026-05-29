import { describe, expect, test } from "vitest";
import { OPENFRONT_MODULE_ID } from "../../src/games/openfront/OpenFrontModule";
import {
  DEFAULT_GAME_MODULE_ID,
  getGameModule,
  listGameModules,
} from "../../src/games/registry";

describe("game module registry", () => {
  test("registry_defaults_to_openfront", () => {
    const module = getGameModule();

    expect(DEFAULT_GAME_MODULE_ID).toBe(OPENFRONT_MODULE_ID);
    expect(module.id).toBe(OPENFRONT_MODULE_ID);
  });

  test("registry_rejects_unknown_module", () => {
    expect(() => getGameModule("missing-module")).toThrow(
      "Unknown game module: missing-module",
    );
  });

  test("openfront_module_shape_test", () => {
    const module = getGameModule(OPENFRONT_MODULE_ID);

    expect(module.server?.createRunner).toEqual(expect.any(Function));
    expect(module.client?.mount).toEqual(expect.any(Function));
    expect(listGameModules().map((entry) => entry.id)).toContain(
      OPENFRONT_MODULE_ID,
    );
  });
});
