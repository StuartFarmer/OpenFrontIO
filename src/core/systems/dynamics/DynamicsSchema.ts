export const DYNAMICS_SYSTEM_SCHEMA_VERSION = 1;

export type DynamicsNodeId = string;
export type DynamicsEdgeId = string;
export type DynamicsHandleId = string;
export type DynamicsUnit = string;

export type DynamicsNodeType =
  | "input"
  | "parameter"
  | "math"
  | "activation"
  | "flow"
  | "stock"
  | "probe";

export const DYNAMICS_NODE_TYPES = [
  "input",
  "parameter",
  "math",
  "activation",
  "flow",
  "stock",
  "probe",
] as const satisfies readonly DynamicsNodeType[];

export type DynamicsMathOperation =
  | "add"
  | "subtract"
  | "multiply"
  | "divide"
  | "power"
  | "min"
  | "max"
  | "clamp";

export const DYNAMICS_MATH_OPERATIONS = [
  "add",
  "subtract",
  "multiply",
  "divide",
  "power",
  "min",
  "max",
  "clamp",
] as const satisfies readonly DynamicsMathOperation[];

export type DynamicsActivationFunction =
  | "linear"
  | "logistic"
  | "power"
  | "step";

export const DYNAMICS_ACTIVATION_FUNCTIONS = [
  "linear",
  "logistic",
  "power",
  "step",
] as const satisfies readonly DynamicsActivationFunction[];

export interface DynamicsPoint {
  readonly x: number;
  readonly y: number;
}

export interface DynamicsNumericControl {
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly unit?: DynamicsUnit;
}

export interface DynamicsInputNodeConfig extends DynamicsNumericControl {
  readonly value: number;
}

export interface DynamicsParameterNodeConfig extends DynamicsNumericControl {
  readonly value: number;
}

export interface DynamicsMathNodeConfig {
  readonly operation: DynamicsMathOperation;
  readonly fallback?: number;
}

export interface DynamicsActivationNodeConfig {
  readonly function: DynamicsActivationFunction;
  readonly min?: number;
  readonly max?: number;
  readonly k?: number;
  readonly exponent?: number;
  readonly threshold?: number;
}

export interface DynamicsFlowNodeConfig {
  readonly direction: "inflow" | "outflow";
  readonly unit?: DynamicsUnit;
}

export interface DynamicsStockNodeConfig {
  readonly initialValue: number;
  readonly min?: number;
  readonly max?: number;
  readonly unit?: DynamicsUnit;
}

export interface DynamicsProbeNodeConfig {
  readonly charted?: boolean;
  readonly unit?: DynamicsUnit;
}

export type DynamicsNodeConfigByType = {
  readonly input: DynamicsInputNodeConfig;
  readonly parameter: DynamicsParameterNodeConfig;
  readonly math: DynamicsMathNodeConfig;
  readonly activation: DynamicsActivationNodeConfig;
  readonly flow: DynamicsFlowNodeConfig;
  readonly stock: DynamicsStockNodeConfig;
  readonly probe: DynamicsProbeNodeConfig;
};

export type DynamicsNode = {
  readonly [TType in DynamicsNodeType]: {
    readonly id: DynamicsNodeId;
    readonly type: TType;
    readonly name: string;
    readonly position: DynamicsPoint;
    readonly config: DynamicsNodeConfigByType[TType];
  };
}[DynamicsNodeType];

export interface DynamicsEdge {
  readonly id: DynamicsEdgeId;
  readonly source: DynamicsNodeId;
  readonly sourceHandle: DynamicsHandleId;
  readonly target: DynamicsNodeId;
  readonly targetHandle: DynamicsHandleId;
}

export interface DynamicsSystemDefinition {
  readonly version: typeof DYNAMICS_SYSTEM_SCHEMA_VERSION;
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly nodes: readonly DynamicsNode[];
  readonly edges: readonly DynamicsEdge[];
}

export interface DynamicsScenario {
  readonly version: typeof DYNAMICS_SYSTEM_SCHEMA_VERSION;
  readonly id: string;
  readonly systemId: string;
  readonly name: string;
  readonly inputValues?: Readonly<Record<DynamicsNodeId, number>>;
  readonly parameterValues?: Readonly<Record<DynamicsNodeId, number>>;
  readonly stockInitialValues?: Readonly<Record<DynamicsNodeId, number>>;
  readonly tickCount: number;
}

export interface DynamicsTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly system: DynamicsSystemDefinition;
  readonly scenario: DynamicsScenario;
}

export function isDynamicsNodeType(value: string): value is DynamicsNodeType {
  return (DYNAMICS_NODE_TYPES as readonly string[]).includes(value);
}

export function dynamicsNodeAddress(
  nodeId: DynamicsNodeId,
  handleId: DynamicsHandleId,
): string {
  return `${nodeId}.${handleId}`;
}

export function dynamicsNodeById(
  system: DynamicsSystemDefinition,
  nodeId: DynamicsNodeId,
): DynamicsNode | undefined {
  return system.nodes.find((node) => node.id === nodeId);
}

export function renameDynamicsNode(
  system: DynamicsSystemDefinition,
  nodeId: DynamicsNodeId,
  name: string,
): DynamicsSystemDefinition {
  return {
    ...system,
    nodes: system.nodes.map((node) =>
      node.id === nodeId ? { ...node, name } : node,
    ),
  };
}
