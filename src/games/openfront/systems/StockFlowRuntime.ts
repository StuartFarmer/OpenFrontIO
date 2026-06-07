import {
  CompiledStockFlowModel,
  compileStockFlowModel,
} from "./StockFlowCompiler";
import {
  FlowContributionDiagnostic,
  StockFlowDiagnostics,
  StockUpdateDiagnostic,
} from "./StockFlowDiagnostics";
import {
  EvaluationContext,
  StockDefinition,
  StockFlowInputs,
  StockFlowModel,
  StockFlowParams,
  StockFlowScalar,
  StockFlowStockState,
} from "./StockFlowSystem";
import { ValueAddress } from "./ValueAddress";

/**
 * @internal Runtime for quarantined StockFlow compatibility models.
 * New graph-backed systems should run through `DynamicsGraphBinding`.
 */
export class StockFlowEvaluationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockFlowEvaluationError";
  }
}

export interface StockFlowStepInput {
  readonly stocks?: StockFlowStockState;
  readonly inputs?: StockFlowInputs;
  readonly params?: StockFlowParams;
  readonly tick?: number;
  readonly player?: unknown;
  readonly game?: unknown;
}

export interface StockFlowStepResult {
  readonly stocks: Record<ValueAddress, number>;
  readonly outputs: Record<ValueAddress, StockFlowScalar>;
  readonly flows: readonly FlowContributionDiagnostic[];
  readonly diagnostics: StockFlowDiagnostics;
}

export function runStockFlowStep(
  model: StockFlowModel | CompiledStockFlowModel,
  input: StockFlowStepInput = {},
): StockFlowStepResult {
  const compiled = isCompiledStockFlowModel(model)
    ? model
    : compileStockFlowModel(model);
  const values = new Map<ValueAddress, StockFlowScalar>();
  const stocks = initializeStocks(compiled, input, values);
  const params = collectParams(compiled, input.params);
  const ctx = createContext(values, params, input);
  const outputs: Record<ValueAddress, StockFlowScalar> = {};
  const flows: FlowContributionDiagnostic[] = [];

  for (const system of compiled.systems) {
    for (const [address, expression] of Object.entries(
      system.auxiliaries ?? {},
    ) as [ValueAddress, (ctx: EvaluationContext) => StockFlowScalar][]) {
      const value = expression(ctx);
      values.set(address, value);
    }

    for (const [address, expression] of Object.entries(
      system.outputs ?? {},
    ) as [ValueAddress, (ctx: EvaluationContext) => StockFlowScalar][]) {
      const value = expression(ctx);
      values.set(address, value);
      outputs[address] = value;
    }

    for (const [id, flow] of Object.entries(system.flows ?? {}) as [
      ValueAddress,
      { stock: ValueAddress; amount: (ctx: EvaluationContext) => number },
    ][]) {
      flows.push({
        id,
        stock: flow.stock,
        amount: flow.amount(ctx),
      });
    }
  }

  const stockDiagnostics = applyFlows(compiled, stocks, flows, values, ctx);

  return {
    stocks: { ...stocks },
    outputs,
    flows,
    diagnostics: {
      outputs,
      flows,
      stocks: stockDiagnostics,
    },
  };
}

function isCompiledStockFlowModel(
  model: StockFlowModel | CompiledStockFlowModel,
): model is CompiledStockFlowModel {
  return "stocks" in model && model.stocks instanceof Map;
}

function initializeStocks(
  compiled: CompiledStockFlowModel,
  input: StockFlowStepInput,
  values: Map<ValueAddress, StockFlowScalar>,
): Record<ValueAddress, number> {
  for (const [address, value] of Object.entries(input.inputs ?? {}) as [
    ValueAddress,
    StockFlowScalar,
  ][]) {
    values.set(address, value);
  }

  const stocks: Record<ValueAddress, number> = {};
  const initCtx = createContext(
    values,
    collectParams(compiled, input.params),
    input,
  );

  for (const [address, definition] of compiled.stocks) {
    const override = input.stocks?.[address];
    const value =
      override ?? evaluateNumberOrExpression(definition.initial, initCtx);
    stocks[address] = value;
    values.set(address, value);
  }

  return stocks;
}

function collectParams(
  compiled: CompiledStockFlowModel,
  overrides: StockFlowParams = {},
): StockFlowParams {
  const params: StockFlowParams = {};
  for (const system of compiled.systems) {
    for (const [id, definition] of Object.entries(system.parameters ?? {})) {
      params[id] = definition.value;
    }
  }
  return {
    ...params,
    ...overrides,
  };
}

function createContext(
  values: Map<ValueAddress, StockFlowScalar>,
  params: StockFlowParams,
  input: StockFlowStepInput,
): EvaluationContext {
  return {
    params,
    tick: input.tick ?? 0,
    player: input.player,
    game: input.game,
    getNumber: (address) => {
      const value = getValue(values, address);
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new StockFlowEvaluationError(
          `Expected finite number at "${address}".`,
        );
      }
      return value;
    },
    getBoolean: (address) => {
      const value = getValue(values, address);
      if (typeof value !== "boolean") {
        throw new StockFlowEvaluationError(`Expected boolean at "${address}".`);
      }
      return value;
    },
    getString: (address) => {
      const value = getValue(values, address);
      if (typeof value !== "string") {
        throw new StockFlowEvaluationError(`Expected string at "${address}".`);
      }
      return value;
    },
  };
}

function getValue(
  values: ReadonlyMap<ValueAddress, StockFlowScalar>,
  address: ValueAddress,
): StockFlowScalar {
  const value = values.get(address);
  if (value === undefined) {
    throw new StockFlowEvaluationError(`Missing value "${address}".`);
  }
  return value;
}

function applyFlows(
  compiled: CompiledStockFlowModel,
  stocks: Record<ValueAddress, number>,
  flows: readonly FlowContributionDiagnostic[],
  values: Map<ValueAddress, StockFlowScalar>,
  ctx: EvaluationContext,
): readonly StockUpdateDiagnostic[] {
  const deltas = new Map<ValueAddress, number>();
  for (const flow of flows) {
    deltas.set(flow.stock, (deltas.get(flow.stock) ?? 0) + flow.amount);
  }

  const diagnostics: StockUpdateDiagnostic[] = [];
  for (const [address, definition] of compiled.stocks) {
    const before = stocks[address] ?? 0;
    const delta = deltas.get(address) ?? 0;
    const unclampedAfter = before + delta;
    const after = clampStock(unclampedAfter, definition, ctx);
    stocks[address] = after;
    values.set(address, after);
    diagnostics.push({
      stock: address,
      before,
      delta,
      unclampedAfter,
      after,
      clamped: after !== unclampedAfter,
    });
  }

  return diagnostics;
}

function clampStock(
  value: number,
  definition: StockDefinition,
  ctx: EvaluationContext,
): number {
  let result = value;
  if (definition.min !== undefined) {
    result = Math.max(result, evaluateNumberOrExpression(definition.min, ctx));
  }
  if (definition.max !== undefined) {
    result = Math.min(result, evaluateNumberOrExpression(definition.max, ctx));
  }
  return result;
}

function evaluateNumberOrExpression(
  value: number | ((ctx: EvaluationContext) => number),
  ctx: EvaluationContext,
): number {
  const result = typeof value === "number" ? value : value(ctx);
  if (!Number.isFinite(result)) {
    throw new StockFlowEvaluationError("Stock-flow expression returned NaN.");
  }
  return result;
}
