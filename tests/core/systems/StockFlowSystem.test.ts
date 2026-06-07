import { describe, expect, test } from "vitest";
import {
  StockFlowCompileError,
  compileStockFlowModel,
} from "../../../src/games/openfront/systems/StockFlowCompiler";
import type {
  StockFlowModel,
  StockFlowSystem,
} from "../../../src/games/openfront/systems/StockFlowSystem";
import {
  StockFlowAddressError,
  assertValueAddress,
  isValueAddress,
} from "../../../src/games/openfront/systems/ValueAddress";

describe("stock-flow system contracts", () => {
  test("validates value addresses", () => {
    expect(isValueAddress("food.stock")).toBe(true);
    expect(isValueAddress("resource.capacity.food")).toBe(true);
    expect(isValueAddress("food")).toBe(false);
    expect(isValueAddress("food..stock")).toBe(false);
    expect(() => assertValueAddress("food")).toThrow(StockFlowAddressError);
  });

  test("allows systems to declare stocks, reads, outputs, and flows", () => {
    const territory: StockFlowSystem = {
      id: "territory",
      outputs: {
        "territory.tilesOwned": () => 100,
      },
    };
    const food: StockFlowSystem = {
      id: "food",
      reads: ["territory.tilesOwned"],
      stocks: {
        "food.stock": { initial: 0, min: 0 },
      },
      outputs: {
        "food.produced": ({ getNumber }) =>
          getNumber("territory.tilesOwned") * 2,
      },
      flows: {
        "food.produce": {
          stock: "food.stock",
          amount: ({ getNumber }) => getNumber("food.produced"),
        },
      },
    };
    const model: StockFlowModel = {
      id: "contract",
      systems: [food, territory],
    };

    const compiled = compileStockFlowModel(model);

    expect(compiled.systems.map((system) => system.id)).toEqual([
      "territory",
      "food",
    ]);
    expect(compiled.stocks.has("food.stock")).toBe(true);
  });

  test("rejects invalid addresses in declarations", () => {
    expect(() =>
      compileStockFlowModel({
        id: "bad-address",
        systems: [
          {
            id: "food",
            stocks: {
              food: { initial: 0 },
            } as never,
          },
        ],
      }),
    ).toThrow(StockFlowAddressError);
  });

  test("rejects missing declared reads", () => {
    expect(() =>
      compileStockFlowModel({
        id: "missing-read",
        systems: [
          {
            id: "food",
            reads: ["territory.tilesOwned"],
          },
        ],
      }),
    ).toThrow(StockFlowCompileError);
  });
});
