import {
  StockDefinition,
  StockFlowModel,
  StockFlowSystem,
} from "./StockFlowSystem";
import { assertValueAddress, ValueAddress } from "./ValueAddress";

/**
 * @internal Compiler for quarantined StockFlow compatibility models.
 * New graph-authored systems should use `DynamicsCompiler`.
 */
export class StockFlowCompileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockFlowCompileError";
  }
}

export interface CompiledStockFlowModel {
  readonly id: string;
  readonly systems: readonly StockFlowSystem[];
  readonly externalInputs: ReadonlySet<ValueAddress>;
  readonly stocks: ReadonlyMap<ValueAddress, StockDefinition>;
}

interface Producer {
  readonly systemId: string;
  readonly kind: "stock" | "auxiliary" | "output";
}

export function compileStockFlowModel(
  model: StockFlowModel,
): CompiledStockFlowModel {
  const externalInputs = new Set(model.externalInputs ?? []);
  for (const address of externalInputs) {
    assertValueAddress(address);
  }

  const stocks = new Map<ValueAddress, StockDefinition>();
  const producers = new Map<ValueAddress, Producer>();
  const outputProducers = new Map<ValueAddress, string>();

  for (const system of model.systems) {
    validateSystemId(system);
    collectStocks(system, stocks, producers);
    collectValueProducers(system, producers, outputProducers);
  }

  validateReads(model.systems, producers, externalInputs);
  validateFlows(model.systems, stocks);

  return {
    id: model.id,
    systems: sortSystems(model.systems, producers, externalInputs),
    externalInputs,
    stocks,
  };
}

function validateSystemId(system: StockFlowSystem): void {
  if (system.id.trim().length === 0) {
    throw new StockFlowCompileError(
      "Stock-flow systems require a non-empty id.",
    );
  }
}

function collectStocks(
  system: StockFlowSystem,
  stocks: Map<ValueAddress, StockDefinition>,
  producers: Map<ValueAddress, Producer>,
): void {
  for (const [address, stock] of Object.entries(system.stocks ?? {}) as [
    ValueAddress,
    StockDefinition,
  ][]) {
    assertValueAddress(address);
    if (stocks.has(address)) {
      throw new StockFlowCompileError(
        `Duplicate stock ownership for "${address}".`,
      );
    }
    if (producers.has(address)) {
      throw duplicateProducerError(address);
    }
    stocks.set(address, stock);
    producers.set(address, { systemId: system.id, kind: "stock" });
  }
}

function collectValueProducers(
  system: StockFlowSystem,
  producers: Map<ValueAddress, Producer>,
  outputProducers: Map<ValueAddress, string>,
): void {
  const auxiliaries = Object.keys(system.auxiliaries ?? {}) as ValueAddress[];
  for (const address of auxiliaries) {
    assertValueAddress(address);
    if (producers.has(address)) {
      throw duplicateProducerError(address);
    }
    producers.set(address, { systemId: system.id, kind: "auxiliary" });
  }

  const outputs = Object.keys(system.outputs ?? {}) as ValueAddress[];
  for (const address of outputs) {
    assertValueAddress(address);
    if (outputProducers.has(address)) {
      throw new StockFlowCompileError(`Duplicate output address "${address}".`);
    }
    if (producers.has(address)) {
      throw duplicateProducerError(address);
    }
    outputProducers.set(address, system.id);
    producers.set(address, { systemId: system.id, kind: "output" });
  }
}

function validateReads(
  systems: readonly StockFlowSystem[],
  producers: ReadonlyMap<ValueAddress, Producer>,
  externalInputs: ReadonlySet<ValueAddress>,
): void {
  for (const system of systems) {
    for (const address of system.reads ?? []) {
      assertValueAddress(address);
      if (!producers.has(address) && !externalInputs.has(address)) {
        throw new StockFlowCompileError(
          `System "${system.id}" declares missing read "${address}".`,
        );
      }
    }
  }
}

function validateFlows(
  systems: readonly StockFlowSystem[],
  stocks: ReadonlyMap<ValueAddress, StockDefinition>,
): void {
  const flowIds = new Set<ValueAddress>();
  for (const system of systems) {
    for (const [flowId, flow] of Object.entries(system.flows ?? {}) as [
      ValueAddress,
      { stock: ValueAddress },
    ][]) {
      assertValueAddress(flowId);
      assertValueAddress(flow.stock);
      if (flowIds.has(flowId)) {
        throw new StockFlowCompileError(`Duplicate flow address "${flowId}".`);
      }
      flowIds.add(flowId);
      if (!stocks.has(flow.stock)) {
        throw new StockFlowCompileError(
          `Flow "${flowId}" targets unknown stock "${flow.stock}".`,
        );
      }
    }
  }
}

function sortSystems(
  systems: readonly StockFlowSystem[],
  producers: ReadonlyMap<ValueAddress, Producer>,
  externalInputs: ReadonlySet<ValueAddress>,
): readonly StockFlowSystem[] {
  const remaining = new Map(systems.map((system) => [system.id, system]));
  const sorted: StockFlowSystem[] = [];
  const completed = new Set<string>();

  while (remaining.size > 0) {
    let progressed = false;

    for (const [systemId, system] of [...remaining]) {
      if (
        systemReadsAreAvailable(system, producers, externalInputs, completed)
      ) {
        sorted.push(system);
        completed.add(systemId);
        remaining.delete(systemId);
        progressed = true;
      }
    }

    if (!progressed) {
      throw new StockFlowCompileError(
        `Unable to resolve stock-flow system order: ${[
          ...remaining.keys(),
        ].join(", ")}.`,
      );
    }
  }

  return sorted;
}

function systemReadsAreAvailable(
  system: StockFlowSystem,
  producers: ReadonlyMap<ValueAddress, Producer>,
  externalInputs: ReadonlySet<ValueAddress>,
  completed: ReadonlySet<string>,
): boolean {
  for (const address of system.reads ?? []) {
    if (externalInputs.has(address)) {
      continue;
    }
    const producer = producers.get(address);
    if (producer === undefined) {
      return false;
    }
    if (producer.kind === "stock" || producer.systemId === system.id) {
      continue;
    }
    if (!completed.has(producer.systemId)) {
      return false;
    }
  }
  return true;
}

function duplicateProducerError(address: ValueAddress): StockFlowCompileError {
  return new StockFlowCompileError(
    `Duplicate value producer for "${address}".`,
  );
}
