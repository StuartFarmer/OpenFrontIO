import { afterEach, describe, expect, it } from "vitest";
import {
  DYNAMICS_SYSTEM_SCHEMA_VERSION,
  SIMPLE_FOOD_STOCK_TEMPLATE,
} from "../../../../src/core/systems/dynamics";
import { FOUNDATION_TUNING_STORAGE_KEY } from "../../../../src/games/foundation/client/FoundationTuningSettings";
import {
  deleteFoundationDynamicsSystem,
  duplicateFoundationDynamicsSystem,
  EMPTY_FOUNDATION_DYNAMICS_LIBRARY,
  exportFoundationDynamicsLibrary,
  FOUNDATION_DYNAMICS_STORAGE_KEY,
  loadFoundationDynamicsLibrary,
  parseFoundationDynamicsLibrary,
  saveFoundationDynamicsLibrary,
  upsertFoundationDynamicsScenario,
  upsertFoundationDynamicsSystem,
} from "../../../../src/games/foundation/dynamics";

describe("Foundation dynamics persistence", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("round trips systems and scenarios through localStorage", () => {
    const library = upsertFoundationDynamicsScenario(
      upsertFoundationDynamicsSystem(
        EMPTY_FOUNDATION_DYNAMICS_LIBRARY,
        SIMPLE_FOOD_STOCK_TEMPLATE.system,
      ),
      SIMPLE_FOOD_STOCK_TEMPLATE.scenario,
    );

    saveFoundationDynamicsLibrary(library);
    const loaded = loadFoundationDynamicsLibrary();

    expect(loaded.systems).toHaveLength(1);
    expect(loaded.systems[0].id).toBe("simple-food-stock");
    expect(loaded.scenarios).toHaveLength(1);
    expect(loaded.scenarios[0].systemId).toBe("simple-food-stock");
    expect(
      window.localStorage.getItem(FOUNDATION_DYNAMICS_STORAGE_KEY),
    ).toBeTruthy();
    expect(
      window.localStorage.getItem(FOUNDATION_TUNING_STORAGE_KEY),
    ).toBeNull();
  });

  it("duplicates a system and its scenarios without reusing ids", () => {
    const library = upsertFoundationDynamicsScenario(
      upsertFoundationDynamicsSystem(
        EMPTY_FOUNDATION_DYNAMICS_LIBRARY,
        SIMPLE_FOOD_STOCK_TEMPLATE.system,
      ),
      SIMPLE_FOOD_STOCK_TEMPLATE.scenario,
    );

    const duplicated = duplicateFoundationDynamicsSystem(
      library,
      "simple-food-stock",
    );

    expect(duplicated.systems.map((system) => system.id).sort()).toEqual([
      "simple-food-stock",
      "simple-food-stock-copy",
    ]);
    expect(duplicated.scenarios).toHaveLength(2);
    expect(
      duplicated.scenarios.find(
        (scenario) => scenario.systemId === "simple-food-stock-copy",
      )?.id,
    ).toBe("simple-food-stock-baseline-copy");
  });

  it("deletes a system and its scenarios", () => {
    const library = upsertFoundationDynamicsScenario(
      upsertFoundationDynamicsSystem(
        EMPTY_FOUNDATION_DYNAMICS_LIBRARY,
        SIMPLE_FOOD_STOCK_TEMPLATE.system,
      ),
      SIMPLE_FOOD_STOCK_TEMPLATE.scenario,
    );

    const next = deleteFoundationDynamicsSystem(library, "simple-food-stock");

    expect(next.systems).toEqual([]);
    expect(next.scenarios).toEqual([]);
  });

  it("exports and imports versioned JSON", () => {
    const library = upsertFoundationDynamicsSystem(
      EMPTY_FOUNDATION_DYNAMICS_LIBRARY,
      SIMPLE_FOOD_STOCK_TEMPLATE.system,
    );

    const imported = parseFoundationDynamicsLibrary(
      exportFoundationDynamicsLibrary(library),
    );

    expect(imported.systems[0].version).toBe(DYNAMICS_SYSTEM_SCHEMA_VERSION);
  });

  it("rejects unsupported import versions", () => {
    expect(() =>
      parseFoundationDynamicsLibrary(
        JSON.stringify({ version: 999, systems: [], scenarios: [] }),
      ),
    ).toThrow('Unsupported dynamics library version "999".');
  });
});
