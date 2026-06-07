import { describe, expect, test } from "vitest";
import { runStockFlowStep } from "../../../src/games/openfront/systems/StockFlowRuntime";
import type { StockFlowModel } from "../../../src/games/openfront/systems/StockFlowSystem";

describe("stock-flow system dynamics examples", () => {
  test("Money = INTEG(interest, 100)", () => {
    const model: StockFlowModel = {
      id: "money",
      systems: [
        {
          id: "money",
          stocks: {
            "money.amount": { initial: 100 },
          },
          parameters: {
            interestRate: { value: 0.1 },
          },
          outputs: {
            "money.interest": ({ getNumber, params }) =>
              getNumber("money.amount") * params.interestRate,
          },
          flows: {
            "money.interestFlow": {
              stock: "money.amount",
              amount: ({ getNumber }) => getNumber("money.interest"),
            },
          },
        },
      ],
    };

    const first = runStockFlowStep(model);
    const second = runStockFlowStep(model, { stocks: first.stocks });

    expect(first.stocks["money.amount"]).toBe(110);
    expect(second.stocks["money.amount"]).toBe(121);
  });

  test("Workers = INTEG(-attrition, 100)", () => {
    const model: StockFlowModel = {
      id: "workers",
      systems: [
        {
          id: "workforce",
          stocks: {
            "workers.count": { initial: 100, min: 0 },
          },
          parameters: {
            averageTenancy: { value: 10 },
          },
          outputs: {
            "workers.attrition": ({ getNumber, params }) =>
              getNumber("workers.count") / params.averageTenancy,
          },
          flows: {
            "workers.attritionFlow": {
              stock: "workers.count",
              amount: ({ getNumber }) => -getNumber("workers.attrition"),
            },
          },
        },
      ],
    };

    const first = runStockFlowStep(model);
    const second = runStockFlowStep(model, { stocks: first.stocks });

    expect(first.stocks["workers.count"]).toBe(90);
    expect(second.stocks["workers.count"]).toBe(81);
  });
});
