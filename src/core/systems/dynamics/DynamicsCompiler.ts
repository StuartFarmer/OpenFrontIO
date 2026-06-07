import {
  validateDynamicsSystemDefinition,
  type DynamicsEdgeDefinition,
  type DynamicsInputNodeDefinition,
  type DynamicsNodeDefinition,
  type DynamicsOperatorNodeDefinition,
  type DynamicsSavedSystem,
  type DynamicsSinkNodeDefinition,
} from "./DynamicsSchema";

export class DynamicsCompileError extends Error {
  readonly diagnostics: readonly string[];

  constructor(diagnostics: readonly string[]) {
    super(diagnostics.join("\n"));
    this.name = "DynamicsCompileError";
    this.diagnostics = diagnostics;
  }
}

export type DynamicsExpression = (
  scope: Readonly<Record<string, number>>,
) => number;

export interface CompiledDynamicsSystem {
  readonly id: string;
  readonly name: string;
  readonly inputs: readonly DynamicsInputNodeDefinition[];
  readonly operators: readonly CompiledDynamicsOperator[];
  readonly sinks: readonly CompiledDynamicsSink[];
  readonly edges: readonly DynamicsEdgeDefinition[];
  readonly nodeNameById: ReadonlyMap<string, string>;
  readonly incomingByTarget: ReadonlyMap<
    string,
    readonly DynamicsEdgeDefinition[]
  >;
}

export interface CompiledDynamicsOperator {
  readonly id: string;
  readonly name: string;
  readonly expression: string;
  readonly evaluate: DynamicsExpression;
}

export interface CompiledDynamicsSink {
  readonly id: string;
  readonly name: string;
  readonly expression: string;
  readonly evaluate: DynamicsExpression;
}

export function compileDynamicsSystem(
  system: DynamicsSavedSystem,
): CompiledDynamicsSystem {
  const diagnostics = [
    ...validateDynamicsSystemDefinition(system.definition),
    ...validateScenarioDefaults(system),
  ];
  const nodesById = new Map(
    system.definition.nodes.map((node) => [node.id, node]),
  );
  const incomingByTarget = collectIncomingEdges(system.definition.edges);

  diagnostics.push(
    ...validateEdgesAttachToComputableTargets(),
    ...validateOperatorOrder(system.definition.nodes, system.definition.edges),
    ...validateExpressions(system.definition.nodes),
  );

  if (diagnostics.length > 0) {
    throw new DynamicsCompileError(diagnostics);
  }

  const operators = topologicalOperators(
    system.definition.nodes,
    system.definition.edges,
  ).map((node) => ({
    id: node.id,
    name: node.name,
    expression: node.expression,
    evaluate: compileExpression(node.expression),
  }));

  return {
    id: system.definition.id,
    name: system.definition.name,
    inputs: system.definition.nodes.filter(
      (node): node is DynamicsInputNodeDefinition => node.primitive === "input",
    ),
    operators,
    sinks: system.definition.nodes
      .filter(
        (node): node is DynamicsSinkNodeDefinition => node.primitive === "sink",
      )
      .map((node) => ({
        id: node.id,
        name: node.name,
        expression: node.expression,
        evaluate: compileExpression(node.expression),
      })),
    edges: system.definition.edges.map((edge) => ({ ...edge })),
    nodeNameById: new Map(
      system.definition.nodes.map((node) => [node.id, node.name]),
    ),
    incomingByTarget,
  };

  function validateEdgesAttachToComputableTargets(): readonly string[] {
    const localDiagnostics: string[] = [];
    for (const edge of system.definition.edges) {
      const target = nodesById.get(edge.target);
      if (target?.primitive === "input") {
        localDiagnostics.push(
          `Dynamics edge "${edge.id}" targets input node "${edge.target}".`,
        );
      }
    }
    return localDiagnostics;
  }
}

export function evaluateCompiledDynamicsExpression(
  expression: DynamicsExpression,
  scope: Readonly<Record<string, number>>,
): number {
  const value = expression(scope);
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new DynamicsCompileError([
      "Dynamics expression returned a non-finite value.",
    ]);
  }
  return value;
}

function collectIncomingEdges(
  edges: readonly DynamicsEdgeDefinition[],
): ReadonlyMap<string, readonly DynamicsEdgeDefinition[]> {
  const incoming = new Map<string, DynamicsEdgeDefinition[]>();
  for (const edge of edges) {
    incoming.set(edge.target, [...(incoming.get(edge.target) ?? []), edge]);
  }
  return incoming;
}

function validateScenarioDefaults(
  system: DynamicsSavedSystem,
): readonly string[] {
  const diagnostics: string[] = [];
  for (const [nodeId, value] of Object.entries(
    system.scenario.inputValues ?? {},
  )) {
    if (!Number.isFinite(value)) {
      diagnostics.push(`Input "${nodeId}" has a non-finite default value.`);
    }
  }
  for (const [nodeId, value] of Object.entries(
    system.scenario.sinkInitialStates ?? {},
  )) {
    if (!Number.isFinite(value)) {
      diagnostics.push(`Sink "${nodeId}" has a non-finite initial state.`);
    }
  }
  return diagnostics;
}

function validateOperatorOrder(
  nodes: readonly DynamicsNodeDefinition[],
  edges: readonly DynamicsEdgeDefinition[],
): readonly string[] {
  try {
    topologicalOperators(nodes, edges);
    return [];
  } catch (error) {
    return [
      error instanceof Error
        ? error.message
        : "Dynamics graph contains an operator cycle.",
    ];
  }
}

function topologicalOperators(
  nodes: readonly DynamicsNodeDefinition[],
  edges: readonly DynamicsEdgeDefinition[],
): readonly DynamicsOperatorNodeDefinition[] {
  const operatorById = new Map(
    nodes
      .filter(
        (node): node is DynamicsOperatorNodeDefinition =>
          node.primitive === "operator",
      )
      .map((node) => [node.id, node]),
  );
  const dependencies = new Map<string, Set<string>>();
  for (const id of operatorById.keys()) {
    dependencies.set(id, new Set());
  }
  for (const edge of edges) {
    if (operatorById.has(edge.target) && operatorById.has(edge.source)) {
      dependencies.get(edge.target)?.add(edge.source);
    }
  }

  const ordered: DynamicsOperatorNodeDefinition[] = [];
  const ready = [...operatorById.keys()].filter(
    (id) => dependencies.get(id)?.size === 0,
  );
  while (ready.length > 0) {
    const id = ready.shift()!;
    const node = operatorById.get(id);
    if (node === undefined) {
      continue;
    }
    ordered.push(node);
    for (const edge of edges.filter((edge) => edge.source === id)) {
      if (!operatorById.has(edge.target)) {
        continue;
      }
      const targetDependencies = dependencies.get(edge.target);
      targetDependencies?.delete(id);
      if (targetDependencies?.size === 0) {
        ready.push(edge.target);
      }
    }
  }

  if (ordered.length !== operatorById.size) {
    throw new Error("Dynamics graph contains an operator cycle.");
  }
  return ordered;
}

function validateExpressions(
  nodes: readonly DynamicsNodeDefinition[],
): readonly string[] {
  const diagnostics: string[] = [];
  for (const node of nodes) {
    if (node.primitive !== "operator" && node.primitive !== "sink") {
      continue;
    }
    try {
      compileExpression(node.expression);
    } catch {
      diagnostics.push(`Node "${node.id}" has an invalid expression.`);
    }
  }
  return diagnostics;
}

function compileExpression(expression: string): DynamicsExpression {
  const body = expression.includes("return")
    ? expression
    : `return (${expression});`;
  // User-authored local model expressions are intentionally JavaScript.
  const fn = new Function(
    "scope",
    "clamp",
    "min",
    "max",
    "Math",
    `
    with (scope) {
      ${body}
    }
  `,
  );
  return (scope) => {
    const value = fn(scope, clamp, Math.min, Math.max, Math);
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new DynamicsCompileError([
        "Dynamics expression returned a non-finite value.",
      ]);
    }
    return value;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
