import { describe, expect, test } from "vitest";
import {
  StockFlowCompileError,
  compileStockFlowModel,
} from "../../../src/core/systems/StockFlowCompiler";
import { runStockFlowStep } from "../../../src/core/systems/StockFlowRuntime";
import type { StockFlowModel } from "../../../src/core/systems/StockFlowSystem";

describe("stock-flow runtime", () => {
  test("applies multiple flow contributions to one stock once per tick", () => {
    const model: StockFlowModel = {
      id: "food",
      systems: [
        {
          id: "food",
          stocks: {
            "food.stock": { initial: 10, min: 0 },
          },
          outputs: {
            "food.produced": () => 5,
            "food.consumed": () => 3,
          },
          flows: {
            "food.produce": {
              stock: "food.stock",
              amount: ({ getNumber }) => getNumber("food.produced"),
            },
            "food.consume": {
              stock: "food.stock",
              amount: ({ getNumber }) => -getNumber("food.consumed"),
            },
          },
        },
      ],
    };

    const result = runStockFlowStep(model);

    expect(result.stocks["food.stock"]).toBe(12);
    expect(result.diagnostics.stocks).toEqual([
      {
        stock: "food.stock",
        before: 10,
        delta: 2,
        unclampedAfter: 12,
        after: 12,
        clamped: false,
      },
    ]);
  });

  test("clamps stock updates and reports diagnostics", () => {
    const result = runStockFlowStep({
      id: "clamp",
      systems: [
        {
          id: "food",
          stocks: {
            "food.stock": { initial: 1, min: 0, max: 10 },
          },
          flows: {
            "food.consume": {
              stock: "food.stock",
              amount: () => -5,
            },
          },
        },
      ],
    });

    expect(result.stocks["food.stock"]).toBe(0);
    expect(result.diagnostics.stocks[0]).toMatchObject({
      before: 1,
      delta: -5,
      unclampedAfter: -4,
      after: 0,
      clamped: true,
    });
  });

  test("uses input stock overrides for subsequent ticks", () => {
    const model: StockFlowModel = {
      id: "counter",
      systems: [
        {
          id: "counter",
          stocks: {
            "counter.value": { initial: 0 },
          },
          flows: {
            "counter.increment": {
              stock: "counter.value",
              amount: () => 1,
            },
          },
        },
      ],
    };

    const first = runStockFlowStep(model);
    const second = runStockFlowStep(model, { stocks: first.stocks });

    expect(first.stocks["counter.value"]).toBe(1);
    expect(second.stocks["counter.value"]).toBe(2);
  });

  test("allows external inputs to satisfy declared reads", () => {
    const result = runStockFlowStep(
      {
        id: "food",
        externalInputs: ["territory.tilesOwned"],
        systems: [
          {
            id: "food",
            reads: ["territory.tilesOwned"],
            stocks: {
              "food.stock": { initial: 0 },
            },
            flows: {
              "food.produce": {
                stock: "food.stock",
                amount: ({ getNumber }) =>
                  getNumber("territory.tilesOwned") * 2,
              },
            },
          },
        ],
      },
      { inputs: { "territory.tilesOwned": 50 } },
    );

    expect(result.stocks["food.stock"]).toBe(100);
  });

  test("rejects duplicate stock ownership", () => {
    expect(() =>
      compileStockFlowModel({
        id: "duplicate-stock",
        systems: [
          { id: "a", stocks: { "food.stock": { initial: 0 } } },
          { id: "b", stocks: { "food.stock": { initial: 1 } } },
        ],
      }),
    ).toThrow(StockFlowCompileError);
  });

  test("rejects duplicate output addresses", () => {
    expect(() =>
      compileStockFlowModel({
        id: "duplicate-output",
        systems: [
          { id: "a", outputs: { "food.needed": () => 1 } },
          { id: "b", outputs: { "food.needed": () => 2 } },
        ],
      }),
    ).toThrow(StockFlowCompileError);
  });

  test("rejects flows that target unknown stocks", () => {
    expect(() =>
      compileStockFlowModel({
        id: "bad-flow",
        systems: [
          {
            id: "food",
            outputs: { "food.produced": () => 1 },
            flows: {
              "food.produce": {
                stock: "food.stock",
                amount: ({ getNumber }) => getNumber("food.produced"),
              },
            },
          },
        ],
      }),
    ).toThrow(StockFlowCompileError);
  });

  test("diagnostics are serializable", () => {
    const result = runStockFlowStep({
      id: "serializable",
      systems: [
        {
          id: "food",
          stocks: {
            "food.stock": { initial: 0 },
          },
          outputs: {
            "food.produced": () => 1,
          },
          flows: {
            "food.produce": {
              stock: "food.stock",
              amount: ({ getNumber }) => getNumber("food.produced"),
            },
          },
        },
      ],
    });

    expect(JSON.parse(JSON.stringify(result.diagnostics))).toEqual(
      result.diagnostics,
    );
  });
});
