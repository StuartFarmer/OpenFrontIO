export const DYNAMICS_SCHEMA_VERSION = 2;

export type DynamicsPrimitive = "input" | "operator" | "sink";
export type DynamicsInputKind = "read" | "constant" | "user";

export const DYNAMICS_SOURCE_HANDLE = "out";
export const DYNAMICS_TARGET_HANDLE = "in";

export interface DynamicsPoint {
  readonly x: number;
  readonly y: number;
}

export interface DynamicsEdgeDefinition {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly label?: string;
}

interface DynamicsBaseNodeDefinition {
  readonly id: string;
  readonly primitive: DynamicsPrimitive;
  readonly name: string;
}

export interface DynamicsInputNodeDefinition extends DynamicsBaseNodeDefinition {
  readonly primitive: "input";
  readonly inputKind: DynamicsInputKind;
  readonly readSinkId?: string;
}

export interface DynamicsOperatorNodeDefinition extends DynamicsBaseNodeDefinition {
  readonly primitive: "operator";
  readonly expression: string;
}

export interface DynamicsSinkNodeDefinition extends DynamicsBaseNodeDefinition {
  readonly primitive: "sink";
  readonly expression: string;
}

export type DynamicsNodeDefinition =
  | DynamicsInputNodeDefinition
  | DynamicsOperatorNodeDefinition
  | DynamicsSinkNodeDefinition;

export interface DynamicsSystemDefinition {
  readonly version: typeof DYNAMICS_SCHEMA_VERSION;
  readonly id: string;
  readonly name: string;
  readonly savedAt?: number;
  readonly nodes: readonly DynamicsNodeDefinition[];
  readonly edges: readonly DynamicsEdgeDefinition[];
}

export interface DynamicsInputControl {
  readonly sliderMin?: number;
  readonly sliderMax?: number;
  readonly actionAmount?: number;
  readonly actionTicks?: number;
}

export interface DynamicsViewNode {
  readonly id: string;
  readonly position: DynamicsPoint;
  readonly inputControl?: DynamicsInputControl;
}

export interface DynamicsView {
  readonly version: typeof DYNAMICS_SCHEMA_VERSION;
  readonly systemId: string;
  readonly nodes: readonly DynamicsViewNode[];
}

export interface DynamicsScenario {
  readonly version: typeof DYNAMICS_SCHEMA_VERSION;
  readonly id: string;
  readonly systemId: string;
  readonly name: string;
  readonly inputValues?: Readonly<Record<string, number>>;
  readonly sinkInitialStates?: Readonly<Record<string, number>>;
}

export interface DynamicsTraceFrame {
  readonly tick: number;
  readonly operatorValues: Readonly<Record<string, number>>;
  readonly sinkStates: Readonly<Record<string, number>>;
}

export interface DynamicsRuntimeState {
  readonly running: boolean;
  readonly tick: number;
  readonly sinkStates: Readonly<Record<string, number>>;
  readonly frames: readonly DynamicsTraceFrame[];
}

export interface DynamicsSavedSystem {
  readonly version: typeof DYNAMICS_SCHEMA_VERSION;
  readonly definition: DynamicsSystemDefinition;
  readonly scenario: DynamicsScenario;
  readonly view: DynamicsView;
}

export interface DynamicsSystemLibrary {
  readonly version: typeof DYNAMICS_SCHEMA_VERSION;
  readonly systems: readonly DynamicsSavedSystem[];
}

export function validateDynamicsSystemDefinition(
  definition: DynamicsSystemDefinition,
): readonly string[] {
  const errors: string[] = [];
  const nodeIds = new Set<string>();
  const sinkIds = new Set<string>();

  if (definition.version !== DYNAMICS_SCHEMA_VERSION) {
    errors.push("Dynamics system definition has an unsupported version.");
  }
  if (definition.id.trim() === "") {
    errors.push("Dynamics system definition requires a non-empty id.");
  }
  if (definition.name.trim() === "") {
    errors.push("Dynamics system definition requires a non-empty name.");
  }

  for (const node of definition.nodes) {
    if (node.id.trim() === "") {
      errors.push("Dynamics nodes require non-empty ids.");
    }
    if (node.name.trim() === "") {
      errors.push(`Dynamics node "${node.id}" requires a non-empty name.`);
    }
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate dynamics node id "${node.id}".`);
    }
    nodeIds.add(node.id);
    if (node.primitive === "sink") {
      sinkIds.add(node.id);
    }
  }

  for (const node of definition.nodes) {
    if (node.primitive !== "input" || node.inputKind !== "read") {
      continue;
    }
    if (node.readSinkId === undefined || !sinkIds.has(node.readSinkId)) {
      errors.push(
        `Read input "${node.id}" references missing sink "${node.readSinkId ?? ""}".`,
      );
    }
  }

  const edgeIds = new Set<string>();
  for (const edge of definition.edges) {
    if (edge.id.trim() === "") {
      errors.push("Dynamics edges require non-empty ids.");
    }
    if (edgeIds.has(edge.id)) {
      errors.push(`Duplicate dynamics edge id "${edge.id}".`);
    }
    edgeIds.add(edge.id);
    if (!nodeIds.has(edge.source)) {
      errors.push(
        `Dynamics edge "${edge.id}" references missing source "${edge.source}".`,
      );
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(
        `Dynamics edge "${edge.id}" references missing target "${edge.target}".`,
      );
    }
  }

  return errors;
}
