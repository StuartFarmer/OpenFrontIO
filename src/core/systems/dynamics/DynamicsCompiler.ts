import type {
  NumericExpression,
  StockFlowInputs,
  StockFlowModel,
  StockFlowSystem,
} from "../StockFlowSystem";
import type { ValueAddress } from "../ValueAddress";
import {
  dynamicsNodeAddress,
  type DynamicsEdge,
  type DynamicsNode,
  type DynamicsNodeId,
  type DynamicsSystemDefinition,
} from "./DynamicsSchema";

export class DynamicsCompileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DynamicsCompileError";
  }
}

export interface CompiledDynamicsSystem {
  readonly model: StockFlowModel;
  readonly valueAddresses: Readonly<Record<DynamicsNodeId, ValueAddress>>;
  readonly stockAddresses: Readonly<Record<DynamicsNodeId, ValueAddress>>;
  readonly inputAddresses: Readonly<Record<DynamicsNodeId, ValueAddress>>;
  readonly parameterAddresses: Readonly<Record<DynamicsNodeId, ValueAddress>>;
}

export function compileDynamicsSystem(
  system: DynamicsSystemDefinition,
): CompiledDynamicsSystem {
  validateUniqueNodeIds(system);
  validateEdgesReferenceKnownNodes(system);

  const nodesById = new Map(system.nodes.map((node) => [node.id, node]));
  const inputAddresses: Record<DynamicsNodeId, ValueAddress> = {};
  const parameterAddresses: Record<DynamicsNodeId, ValueAddress> = {};
  const valueAddresses: Record<DynamicsNodeId, ValueAddress> = {};
  const stockAddresses: Record<DynamicsNodeId, ValueAddress> = {};

  for (const node of system.nodes) {
    const address = nodeValueAddress(node);
    valueAddresses[node.id] = address;
    if (node.type === "stock") {
      stockAddresses[node.id] = address;
    } else if (node.type === "input") {
      inputAddresses[node.id] = address;
    } else if (node.type === "parameter") {
      parameterAddresses[node.id] = address;
    }
  }

  const orderedNodes = topologicalNodes(system);
  const stockDefinitions: StockFlowSystem["stocks"] = {};
  const outputs: StockFlowSystem["outputs"] = {};
  const flows: StockFlowSystem["flows"] = {};

  for (const node of orderedNodes) {
    switch (node.type) {
      case "input":
      case "parameter":
        outputs[nodeValueAddress(node)] = ({ getNumber }) =>
          getNumber(nodeValueAddress(node));
        break;
      case "math":
        outputs[nodeValueAddress(node)] = mathExpression(
          node,
          system,
          nodesById,
        );
        break;
      case "activation":
        outputs[nodeValueAddress(node)] = activationExpression(
          node,
          system,
          nodesById,
        );
        break;
      case "flow":
        outputs[nodeValueAddress(node)] = firstIncomingExpression(
          node,
          system,
          nodesById,
          "amount",
          0,
        );
        break;
      case "probe":
        outputs[nodeValueAddress(node)] = () => 0;
        break;
      case "stock":
        stockDefinitions[nodeValueAddress(node)] = {
          initial: node.config.initialValue,
          min: stockLimitExpression(node, system, nodesById, "min"),
          max: stockLimitExpression(node, system, nodesById, "max"),
          unit: node.config.unit,
        };
        break;
      default:
        assertNever(node);
    }
  }

  for (const node of system.nodes) {
    if (node.type !== "flow") {
      continue;
    }
    const targetStock = targetStockForFlow(node, system, nodesById);
    const sign = node.config.direction === "inflow" ? 1 : -1;
    flows[nodeValueAddress(node)] = {
      stock: nodeValueAddress(targetStock),
      amount: ({ getNumber }) => sign * getNumber(nodeValueAddress(node)),
      phase: node.config.direction === "inflow" ? "produce" : "consume",
      unit: node.config.unit,
    };
  }

  return {
    model: {
      id: system.id,
      externalInputs: [
        ...Object.values(inputAddresses),
        ...Object.values(parameterAddresses),
      ],
      systems: [
        {
          id: "dynamics",
          stocks: stockDefinitions,
          outputs,
          flows,
        },
      ],
    },
    valueAddresses,
    stockAddresses,
    inputAddresses,
    parameterAddresses,
  };
}

export function defaultDynamicsInputs(
  system: DynamicsSystemDefinition,
): StockFlowInputs {
  const inputs: StockFlowInputs = {};
  for (const node of system.nodes) {
    if (node.type === "input" || node.type === "parameter") {
      inputs[nodeValueAddress(node)] = node.config.value;
    }
  }
  return inputs;
}

function validateUniqueNodeIds(system: DynamicsSystemDefinition): void {
  const seen = new Set<DynamicsNodeId>();
  for (const node of system.nodes) {
    if (seen.has(node.id)) {
      throw new DynamicsCompileError(
        `Duplicate dynamics node id "${node.id}".`,
      );
    }
    seen.add(node.id);
  }
}

function validateEdgesReferenceKnownNodes(
  system: DynamicsSystemDefinition,
): void {
  const nodeIds = new Set(system.nodes.map((node) => node.id));
  for (const edge of system.edges) {
    if (!nodeIds.has(edge.source)) {
      throw new DynamicsCompileError(
        `Edge "${edge.id}" references missing source node "${edge.source}".`,
      );
    }
    if (!nodeIds.has(edge.target)) {
      throw new DynamicsCompileError(
        `Edge "${edge.id}" references missing target node "${edge.target}".`,
      );
    }
  }
}

function topologicalNodes(
  system: DynamicsSystemDefinition,
): readonly DynamicsNode[] {
  const byId = new Map(system.nodes.map((node) => [node.id, node]));
  const dependencies = new Map<DynamicsNodeId, Set<DynamicsNodeId>>();
  for (const node of system.nodes) {
    dependencies.set(node.id, new Set());
  }
  for (const edge of system.edges) {
    dependencies.get(edge.target)?.add(edge.source);
  }

  const ordered: DynamicsNode[] = [];
  const ready = system.nodes
    .filter((node) => dependencies.get(node.id)?.size === 0)
    .map((node) => node.id);

  while (ready.length > 0) {
    const nodeId = ready.shift()!;
    const node = byId.get(nodeId);
    if (node === undefined) {
      continue;
    }
    ordered.push(node);

    for (const edge of system.edges.filter((edge) => edge.source === nodeId)) {
      const targetDeps = dependencies.get(edge.target);
      targetDeps?.delete(nodeId);
      if (targetDeps?.size === 0) {
        ready.push(edge.target);
      }
    }
  }

  if (ordered.length !== system.nodes.length) {
    throw new DynamicsCompileError("Dynamics graph contains a cycle.");
  }

  return ordered;
}

function mathExpression(
  node: Extract<DynamicsNode, { type: "math" }>,
  system: DynamicsSystemDefinition,
  nodesById: ReadonlyMap<DynamicsNodeId, DynamicsNode>,
): NumericExpression {
  return ({ getNumber }) => {
    const inputs = incomingEdges(system, node.id).map((edge) =>
      getNumber(sourceAddress(edge, nodesById)),
    );
    const handle = (targetHandle: string, fallback: number) =>
      firstIncomingValue(system, node.id, targetHandle, nodesById, getNumber) ??
      fallback;
    switch (node.config.operation) {
      case "add":
        return inputs.reduce((sum, value) => sum + value, 0);
      case "subtract":
        return handle("a", 0) - handle("b", 0);
      case "multiply":
        return inputs.reduce((product, value) => product * value, 1);
      case "divide": {
        const divisor = handle("b", 1);
        return divisor === 0
          ? (node.config.fallback ?? 0)
          : handle("a", 0) / divisor;
      }
      case "power":
        return Math.pow(handle("a", 0), handle("b", 1));
      case "min":
        return inputs.length > 0
          ? Math.min(...inputs)
          : (node.config.fallback ?? 0);
      case "max":
        return inputs.length > 0
          ? Math.max(...inputs)
          : (node.config.fallback ?? 0);
      case "clamp":
        return Math.max(
          handle("min", Number.NEGATIVE_INFINITY),
          Math.min(handle("max", Number.POSITIVE_INFINITY), handle("value", 0)),
        );
      default:
        assertNever(node.config.operation);
    }
  };
}

function activationExpression(
  node: Extract<DynamicsNode, { type: "activation" }>,
  system: DynamicsSystemDefinition,
  nodesById: ReadonlyMap<DynamicsNodeId, DynamicsNode>,
): NumericExpression {
  return ({ getNumber }) => {
    const input =
      firstIncomingValue(system, node.id, "value", nodesById, getNumber) ?? 0;
    switch (node.config.function) {
      case "linear":
        return scaleUnit(input, node.config.min ?? 0, node.config.max ?? 1);
      case "logistic":
        return scaleUnit(
          normalizedLogistic01(input, node.config.k ?? 1),
          node.config.min ?? 0,
          node.config.max ?? 1,
        );
      case "power":
        return scaleUnit(
          Math.pow(clampUnit(input), node.config.exponent ?? 1),
          node.config.min ?? 0,
          node.config.max ?? 1,
        );
      case "step":
        return input >= (node.config.threshold ?? 0.5)
          ? (node.config.max ?? 1)
          : (node.config.min ?? 0);
      default:
        assertNever(node.config.function);
    }
  };
}

function firstIncomingExpression(
  node: DynamicsNode,
  system: DynamicsSystemDefinition,
  nodesById: ReadonlyMap<DynamicsNodeId, DynamicsNode>,
  targetHandle: string,
  fallback: number,
): NumericExpression {
  return ({ getNumber }) =>
    firstIncomingValue(system, node.id, targetHandle, nodesById, getNumber) ??
    firstIncomingValue(system, node.id, undefined, nodesById, getNumber) ??
    fallback;
}

function stockLimitExpression(
  node: Extract<DynamicsNode, { type: "stock" }>,
  system: DynamicsSystemDefinition,
  nodesById: ReadonlyMap<DynamicsNodeId, DynamicsNode>,
  limit: "min" | "max",
): number | NumericExpression | undefined {
  const configured = node.config[limit];
  const incomingLimit = incomingEdges(system, node.id).find(
    (edge) =>
      edge.targetHandle === limit ||
      (limit === "max" && edge.targetHandle === "capacity"),
  );
  if (incomingLimit === undefined) {
    return configured;
  }
  return ({ getNumber }) => getNumber(sourceAddress(incomingLimit, nodesById));
}

function targetStockForFlow(
  flow: Extract<DynamicsNode, { type: "flow" }>,
  system: DynamicsSystemDefinition,
  nodesById: ReadonlyMap<DynamicsNodeId, DynamicsNode>,
): Extract<DynamicsNode, { type: "stock" }> {
  const targetEdge = system.edges.find((edge) => {
    if (edge.source !== flow.id) {
      return false;
    }
    const target = nodesById.get(edge.target);
    return target?.type === "stock";
  });
  if (targetEdge === undefined) {
    throw new DynamicsCompileError(
      `Flow node "${flow.id}" is not connected to a stock node.`,
    );
  }
  return nodesById.get(targetEdge.target) as Extract<
    DynamicsNode,
    { type: "stock" }
  >;
}

function incomingEdges(
  system: DynamicsSystemDefinition,
  nodeId: DynamicsNodeId,
): readonly DynamicsEdge[] {
  return system.edges.filter((edge) => edge.target === nodeId);
}

function firstIncomingValue(
  system: DynamicsSystemDefinition,
  nodeId: DynamicsNodeId,
  targetHandle: string | undefined,
  nodesById: ReadonlyMap<DynamicsNodeId, DynamicsNode>,
  getNumber: (address: ValueAddress) => number,
): number | undefined {
  const edge = incomingEdges(system, nodeId).find(
    (edge) => targetHandle === undefined || edge.targetHandle === targetHandle,
  );
  return edge === undefined
    ? undefined
    : getNumber(sourceAddress(edge, nodesById));
}

function sourceAddress(
  edge: DynamicsEdge,
  nodesById: ReadonlyMap<DynamicsNodeId, DynamicsNode>,
): ValueAddress {
  const source = nodesById.get(edge.source);
  if (source === undefined) {
    throw new DynamicsCompileError(
      `Edge "${edge.id}" references missing source node "${edge.source}".`,
    );
  }
  if (source.type === "flow") {
    return nodeValueAddress(source);
  }
  return dynamicsNodeAddress(source.id, edge.sourceHandle) as ValueAddress;
}

function nodeValueAddress(node: DynamicsNode): ValueAddress {
  return dynamicsNodeAddress(
    node.id,
    node.type === "flow" ? "amount" : "value",
  ) as ValueAddress;
}

function scaleUnit(value: number, min: number, max: number): number {
  return min + (max - min) * clampUnit(value);
}

function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalizedLogistic01(input: number, k: number): number {
  const x = clampUnit(input);
  if (k === 0) {
    return x;
  }

  const low = logistic(0, k);
  const high = logistic(1, k);
  return (logistic(x, k) - low) / (high - low);
}

function logistic(input: number, k: number): number {
  return 1 / (1 + Math.exp(-k * (input - 0.5)));
}

function assertNever(value: never): never {
  throw new DynamicsCompileError(
    `Unsupported dynamics value "${String(value)}".`,
  );
}
