import { runStockFlowStep } from "../StockFlowRuntime";
import type { StockFlowInputs, StockFlowStockState } from "../StockFlowSystem";
import type { ValueAddress } from "../ValueAddress";
import {
  compileDynamicsSystem,
  defaultDynamicsInputs,
  type CompiledDynamicsSystem,
} from "./DynamicsCompiler";
import {
  dynamicsNodeAddress,
  type DynamicsNodeId,
  type DynamicsScenario,
  type DynamicsSystemDefinition,
} from "./DynamicsSchema";

export interface DynamicsTraceFrame {
  readonly tick: number;
  readonly values: Readonly<Record<string, number>>;
  readonly stocks: Readonly<Record<DynamicsNodeId, number>>;
  readonly flows: Readonly<Record<DynamicsNodeId, number>>;
  readonly stockDeltas: Readonly<Record<DynamicsNodeId, number>>;
  readonly stockOverflows: Readonly<Record<DynamicsNodeId, number>>;
}

export interface DynamicsSimulationResult {
  readonly compiled: CompiledDynamicsSystem;
  readonly frames: readonly DynamicsTraceFrame[];
  readonly finalStocks: Readonly<Record<DynamicsNodeId, number>>;
}

export function runDynamicsSimulation(
  system: DynamicsSystemDefinition,
  scenario: DynamicsScenario,
): DynamicsSimulationResult {
  const compiled = compileDynamicsSystem(system);
  let stocks = initialStocks(system, scenario, compiled);
  const frames: DynamicsTraceFrame[] = [];

  for (let tick = 1; tick <= scenario.tickCount; tick++) {
    const result = runStockFlowStep(compiled.model, {
      stocks,
      inputs: scenarioInputs(system, scenario),
      tick,
    });
    stocks = result.stocks;
    const currentStocks = stockValues(compiled, result.stocks);
    const currentStockDeltas = stockDeltas(compiled, result.diagnostics.stocks);
    const currentStockOverflows = stockOverflows(
      compiled,
      result.diagnostics.stocks,
    );
    frames.push({
      tick,
      values: {
        ...numericOutputs(result.outputs),
        ...probeValues(
          system,
          result.outputs,
          currentStocks,
          currentStockDeltas,
          currentStockOverflows,
        ),
      },
      stocks: currentStocks,
      flows: flowValues(system, result.flows),
      stockDeltas: currentStockDeltas,
      stockOverflows: currentStockOverflows,
    });
  }

  return {
    compiled,
    frames,
    finalStocks: stockValues(compiled, stocks),
  };
}

export function scenarioInputs(
  system: DynamicsSystemDefinition,
  scenario: DynamicsScenario,
): StockFlowInputs {
  const inputs = defaultDynamicsInputs(system);
  for (const [nodeId, value] of Object.entries(scenario.inputValues ?? {})) {
    inputs[dynamicsNodeAddress(nodeId, "value") as ValueAddress] = value;
  }
  for (const [nodeId, value] of Object.entries(
    scenario.parameterValues ?? {},
  )) {
    inputs[dynamicsNodeAddress(nodeId, "value") as ValueAddress] = value;
  }
  return inputs;
}

function initialStocks(
  system: DynamicsSystemDefinition,
  scenario: DynamicsScenario,
  compiled: CompiledDynamicsSystem,
): StockFlowStockState {
  const stocks: StockFlowStockState = {};
  for (const node of system.nodes) {
    if (node.type !== "stock") {
      continue;
    }
    stocks[compiled.stockAddresses[node.id]] =
      scenario.stockInitialValues?.[node.id] ?? node.config.initialValue;
  }
  return stocks;
}

function numericOutputs(
  outputs: Readonly<Record<ValueAddress, unknown>>,
): Record<string, number> {
  const values: Record<string, number> = {};
  for (const [address, value] of Object.entries(outputs)) {
    if (typeof value === "number") {
      values[address] = value;
    }
  }
  return values;
}

function stockValues(
  compiled: CompiledDynamicsSystem,
  stocks: Readonly<Partial<Record<ValueAddress, number>>>,
): Record<DynamicsNodeId, number> {
  const values: Record<DynamicsNodeId, number> = {};
  for (const [nodeId, address] of Object.entries(compiled.stockAddresses)) {
    values[nodeId] = stocks[address as ValueAddress] ?? 0;
  }
  return values;
}

function flowValues(
  system: DynamicsSystemDefinition,
  flows: readonly { readonly id: ValueAddress; readonly amount: number }[],
): Record<DynamicsNodeId, number> {
  const values: Record<DynamicsNodeId, number> = {};
  for (const node of system.nodes) {
    if (node.type !== "flow") {
      continue;
    }
    const flow = flows.find(
      (flow) => flow.id === dynamicsNodeAddress(node.id, "amount"),
    );
    values[node.id] = flow?.amount ?? 0;
  }
  return values;
}

function probeValues(
  system: DynamicsSystemDefinition,
  outputs: Readonly<Record<ValueAddress, unknown>>,
  stocks: Readonly<Record<DynamicsNodeId, number>>,
  stockDeltas: Readonly<Record<DynamicsNodeId, number>>,
  stockOverflows: Readonly<Record<DynamicsNodeId, number>>,
): Record<string, number> {
  const values: Record<string, number> = {};
  for (const probe of system.nodes) {
    if (probe.type !== "probe") {
      continue;
    }
    const edge = system.edges.find((edge) => edge.target === probe.id);
    if (edge === undefined) {
      values[dynamicsNodeAddress(probe.id, "value")] = 0;
      continue;
    }
    switch (edge.sourceHandle) {
      case "delta":
        values[dynamicsNodeAddress(probe.id, "value")] =
          stockDeltas[edge.source] ?? 0;
        break;
      case "overflow":
        values[dynamicsNodeAddress(probe.id, "value")] =
          stockOverflows[edge.source] ?? 0;
        break;
      case "value":
        values[dynamicsNodeAddress(probe.id, "value")] =
          stocks[edge.source] ??
          (typeof outputs[
            dynamicsNodeAddress(edge.source, "value") as ValueAddress
          ] === "number"
            ? (outputs[
                dynamicsNodeAddress(edge.source, "value") as ValueAddress
              ] as number)
            : 0);
        break;
      default:
        values[dynamicsNodeAddress(probe.id, "value")] =
          typeof outputs[
            dynamicsNodeAddress(edge.source, edge.sourceHandle) as ValueAddress
          ] === "number"
            ? (outputs[
                dynamicsNodeAddress(
                  edge.source,
                  edge.sourceHandle,
                ) as ValueAddress
              ] as number)
            : 0;
    }
  }
  return values;
}

function stockDeltas(
  compiled: CompiledDynamicsSystem,
  diagnostics: readonly {
    readonly stock: ValueAddress;
    readonly before: number;
    readonly after: number;
  }[],
): Record<DynamicsNodeId, number> {
  const values: Record<DynamicsNodeId, number> = {};
  for (const [nodeId, address] of Object.entries(compiled.stockAddresses)) {
    const diagnostic = diagnostics.find((item) => item.stock === address);
    values[nodeId] =
      diagnostic === undefined ? 0 : diagnostic.after - diagnostic.before;
  }
  return values;
}

function stockOverflows(
  compiled: CompiledDynamicsSystem,
  diagnostics: readonly {
    readonly stock: ValueAddress;
    readonly unclampedAfter: number;
    readonly after: number;
  }[],
): Record<DynamicsNodeId, number> {
  const values: Record<DynamicsNodeId, number> = {};
  for (const [nodeId, address] of Object.entries(compiled.stockAddresses)) {
    const diagnostic = diagnostics.find((item) => item.stock === address);
    values[nodeId] =
      diagnostic === undefined
        ? 0
        : Math.max(0, diagnostic.unclampedAfter - diagnostic.after);
  }
  return values;
}
