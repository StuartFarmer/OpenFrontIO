import {
  compileDynamicsSystem,
  DYNAMICS_SCHEMA_VERSION,
  DynamicsCompileError,
  initialDynamicsSimulationState,
  stepDynamicsSimulationState,
  type DynamicsEdgeDefinition,
  type DynamicsInputKind,
  type DynamicsNodeDefinition,
  type DynamicsPrimitive,
  type DynamicsSavedSystem,
  type DynamicsViewNode,
} from "../../../core/systems/dynamics";
import {
  loadFoundationDynamicsSystemLibrary,
  parseFoundationDynamicsSystemLibraryJson,
  saveFoundationDynamicsSystemLibrary,
  serializeFoundationDynamicsSystemLibrary,
} from "./FoundationDynamicsStorage";
import {
  FOUNDATION_ECONOMY_DYNAMICS_SYSTEM,
  FOUNDATION_ECONOMY_DYNAMICS_SYSTEM_ID,
} from "./FoundationEconomyDynamics";

export { FOUNDATION_ECONOMY_DYNAMICS_SYSTEM_ID };
export type { DynamicsInputKind, DynamicsPrimitive };

export interface FoundationDynamicsNodeData extends Record<string, unknown> {
  readonly primitive: DynamicsPrimitive;
  readonly name: string;
  readonly inputKind?: DynamicsInputKind;
  readonly value?: number;
  readonly sliderMin?: number;
  readonly sliderMax?: number;
  readonly actionAmount?: number;
  readonly actionTicks?: number;
  readonly readSinkId?: string;
  readonly expression?: string;
  readonly state?: number;
}

export interface FoundationDynamicsNode {
  readonly id: string;
  readonly type?: string;
  readonly position: { readonly x: number; readonly y: number };
  readonly data: FoundationDynamicsNodeData;
  readonly selected?: boolean;
}

export interface FoundationDynamicsEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly sourceHandle?: string | null;
  readonly targetHandle?: string | null;
  readonly label?: unknown;
  readonly type?: string;
  readonly data?: unknown;
  readonly selected?: boolean;
}

export interface FoundationDynamicsConnection {
  readonly source: string | null;
  readonly target: string | null;
  readonly sourceHandle?: string | null;
  readonly targetHandle?: string | null;
}

export interface SimulationFrame {
  readonly tick: number;
  readonly operatorValues: Readonly<Record<string, number>>;
  readonly sinkStates: Readonly<Record<string, number>>;
}

export interface SimulationState {
  readonly running: boolean;
  readonly tick: number;
  readonly sinkStates: Readonly<Record<string, number>>;
  readonly frames: readonly SimulationFrame[];
}

export interface InputRampAction {
  readonly nodeId: string;
  readonly remainingTicks: number;
  readonly deltaPerTick: number;
}

export interface FoundationDynamicsEditorSystem {
  readonly id: string;
  readonly name: string;
  readonly savedAt: number;
  readonly nodes: readonly FoundationDynamicsNode[];
  readonly edges: readonly FoundationDynamicsEdge[];
}

export const FOOD_STOCK_BUILTIN_SYSTEM_ID = "food-stock-model";
export const POPULATION_SURPLUS_BUILTIN_SYSTEM_ID =
  "population-food-surplus-model";

export const FOUNDATION_DYNAMICS_NODES: FoundationDynamicsNode[] = [
  inputNode("tiles-owned", "tilesOwned", "user", 10, undefined, 0, 40),
  inputNode("yield-per-tile", "yieldPerTile", "constant", 2, undefined, 0, 170),
  operatorNode(
    "food-production",
    "foodProduction",
    "tilesOwned * yieldPerTile",
    290,
    96,
  ),
  inputNode("population", "population", "user", 10, undefined, 0, 330),
  inputNode(
    "food-per-population",
    "foodPerPopulation",
    "constant",
    1,
    undefined,
    0,
    460,
  ),
  operatorNode(
    "food-demand",
    "foodDemand",
    "population * foodPerPopulation",
    290,
    370,
  ),
  inputNode(
    "capacity",
    "foodStockCapacity",
    "constant",
    20000,
    undefined,
    620,
    60,
  ),
  sinkNode(
    "food-stock",
    "foodStock",
    0,
    "clamp(state + foodProduction - foodDemand, 0, foodStockCapacity)",
    620,
    245,
  ),
];

export const FOUNDATION_DYNAMICS_EDGES: FoundationDynamicsEdge[] = [
  edge("tiles-to-production", "tiles-owned", "food-production"),
  edge("yield-to-production", "yield-per-tile", "food-production"),
  edge("production-to-stock", "food-production", "food-stock", "+"),
  edge("population-to-demand", "population", "food-demand"),
  edge("food-per-population-to-demand", "food-per-population", "food-demand"),
  edge("demand-to-stock", "food-demand", "food-stock", "-"),
  edge("capacity-to-stock", "capacity", "food-stock", "max"),
];

export const POPULATION_SURPLUS_DYNAMICS_NODES: FoundationDynamicsNode[] = [
  inputNode("surplus-tiles-owned", "tilesOwned", "user", 20, undefined, 0, 40),
  inputNode(
    "surplus-yield-per-tile",
    "yieldPerTile",
    "constant",
    2,
    undefined,
    0,
    150,
  ),
  inputNode(
    "surplus-food-per-population",
    "foodPerPopulation",
    "constant",
    1,
    undefined,
    0,
    260,
  ),
  boundedInputNode(
    "surplus-food-supply-share",
    "foodSupplyShare",
    "user",
    0.25,
    undefined,
    0,
    370,
    0,
    1,
    0.05,
    10,
  ),
  inputNode(
    "surplus-population-growth-rate",
    "populationGrowthRate",
    "constant",
    0.05,
    undefined,
    0,
    480,
  ),
  inputNode(
    "surplus-food-stock-capacity",
    "foodStockCapacity",
    "constant",
    20000,
    undefined,
    0,
    590,
  ),
  inputNode(
    "surplus-population-read",
    "population",
    "read",
    undefined,
    "surplus-population-stock",
    300,
    320,
  ),
  operatorNode(
    "surplus-food-production",
    "foodProduction",
    "tilesOwned * yieldPerTile",
    300,
    80,
  ),
  operatorNode(
    "surplus-food-supply",
    "foodSupply",
    "foodProduction * clamp(foodSupplyShare, 0, 1)",
    560,
    80,
  ),
  operatorNode(
    "surplus-food-available",
    "foodAvailable",
    "max(0, foodProduction - foodSupply)",
    560,
    160,
  ),
  operatorNode(
    "surplus-food-demand",
    "foodDemand",
    "population * foodPerPopulation",
    560,
    280,
  ),
  operatorNode(
    "surplus-food-surplus",
    "foodSurplus",
    "max(0, foodAvailable - foodDemand)",
    820,
    150,
  ),
  operatorNode(
    "surplus-food-satisfaction",
    "foodSatisfaction",
    "foodDemand <= 0 ? 1 : clamp(foodAvailable / foodDemand, 0, 1)",
    820,
    250,
  ),
  operatorNode(
    "surplus-food-population-capacity",
    "foodPopulationCapacity",
    "foodPerPopulation <= 0 ? population : foodAvailable / foodPerPopulation",
    820,
    345,
  ),
  operatorNode(
    "surplus-population-growth",
    "populationGrowth",
    "population * populationGrowthRate * foodSatisfaction",
    820,
    455,
  ),
  sinkNode(
    "surplus-food-stock",
    "foodStock",
    0,
    "clamp(state + foodSupply + foodSurplus, 0, foodStockCapacity)",
    1100,
    120,
  ),
  sinkNode(
    "surplus-population-stock",
    "population",
    10,
    "max(0, min(state + populationGrowth, foodPopulationCapacity))",
    1100,
    330,
  ),
];

export const POPULATION_SURPLUS_DYNAMICS_EDGES: FoundationDynamicsEdge[] = [
  edge(
    "surplus-tiles-to-production",
    "surplus-tiles-owned",
    "surplus-food-production",
  ),
  edge(
    "surplus-yield-to-production",
    "surplus-yield-per-tile",
    "surplus-food-production",
  ),
  edge(
    "surplus-production-to-supply",
    "surplus-food-production",
    "surplus-food-supply",
  ),
  edge(
    "surplus-supply-share-to-supply",
    "surplus-food-supply-share",
    "surplus-food-supply",
  ),
  edge(
    "surplus-production-to-available",
    "surplus-food-production",
    "surplus-food-available",
  ),
  edge(
    "surplus-supply-to-available",
    "surplus-food-supply",
    "surplus-food-available",
  ),
  edge(
    "surplus-population-to-demand",
    "surplus-population-read",
    "surplus-food-demand",
  ),
  edge(
    "surplus-food-per-population-to-demand",
    "surplus-food-per-population",
    "surplus-food-demand",
  ),
  edge(
    "surplus-available-to-surplus",
    "surplus-food-available",
    "surplus-food-surplus",
  ),
  edge(
    "surplus-demand-to-surplus",
    "surplus-food-demand",
    "surplus-food-surplus",
  ),
  edge(
    "surplus-available-to-satisfaction",
    "surplus-food-available",
    "surplus-food-satisfaction",
  ),
  edge(
    "surplus-demand-to-satisfaction",
    "surplus-food-demand",
    "surplus-food-satisfaction",
  ),
  edge(
    "surplus-available-to-population-capacity",
    "surplus-food-available",
    "surplus-food-population-capacity",
  ),
  edge(
    "surplus-food-per-population-to-capacity",
    "surplus-food-per-population",
    "surplus-food-population-capacity",
  ),
  edge(
    "surplus-population-to-capacity",
    "surplus-population-read",
    "surplus-food-population-capacity",
  ),
  edge(
    "surplus-supply-to-stock",
    "surplus-food-supply",
    "surplus-food-stock",
    "+",
  ),
  edge(
    "surplus-surplus-to-stock",
    "surplus-food-surplus",
    "surplus-food-stock",
    "+",
  ),
  edge(
    "surplus-capacity-to-stock",
    "surplus-food-stock-capacity",
    "surplus-food-stock",
    "max",
  ),
  edge(
    "surplus-population-to-growth",
    "surplus-population-read",
    "surplus-population-growth",
  ),
  edge(
    "surplus-rate-to-growth",
    "surplus-population-growth-rate",
    "surplus-population-growth",
  ),
  edge(
    "surplus-satisfaction-to-growth",
    "surplus-food-satisfaction",
    "surplus-population-growth",
  ),
  edge(
    "surplus-growth-to-population",
    "surplus-population-growth",
    "surplus-population-stock",
    "+",
  ),
  edge(
    "surplus-capacity-to-population",
    "surplus-food-population-capacity",
    "surplus-population-stock",
    "max",
  ),
];

export const FOUNDATION_DYNAMICS_BUILTIN_SYSTEMS: readonly DynamicsSavedSystem[] =
  [
    savedDynamicsSystemToSchema({
      id: FOOD_STOCK_BUILTIN_SYSTEM_ID,
      name: "Food stock model",
      savedAt: 0,
      nodes: FOUNDATION_DYNAMICS_NODES,
      edges: FOUNDATION_DYNAMICS_EDGES,
    }),
    savedDynamicsSystemToSchema({
      id: POPULATION_SURPLUS_BUILTIN_SYSTEM_ID,
      name: "Food surplus population growth",
      savedAt: 0,
      nodes: POPULATION_SURPLUS_DYNAMICS_NODES,
      edges: POPULATION_SURPLUS_DYNAMICS_EDGES,
    }),
    FOUNDATION_ECONOMY_DYNAMICS_SYSTEM,
  ];

export function inputNode(
  id: string,
  name: string,
  inputKind: DynamicsInputKind,
  value: number | undefined,
  readSinkId: string | undefined,
  x: number,
  y: number,
): FoundationDynamicsNode {
  return {
    id,
    type: "foundationDynamics",
    position: { x, y },
    data: {
      primitive: "input",
      name,
      inputKind,
      value,
      sliderMin: 0,
      sliderMax: 100,
      actionAmount: 1,
      actionTicks: 10,
      readSinkId,
    },
  };
}

export function boundedInputNode(
  id: string,
  name: string,
  inputKind: DynamicsInputKind,
  value: number | undefined,
  readSinkId: string | undefined,
  x: number,
  y: number,
  sliderMin: number,
  sliderMax: number,
  actionAmount: number,
  actionTicks: number,
): FoundationDynamicsNode {
  const node = inputNode(id, name, inputKind, value, readSinkId, x, y);
  return {
    ...node,
    data: {
      ...node.data,
      sliderMin,
      sliderMax,
      actionAmount,
      actionTicks,
    },
  };
}

export function operatorNode(
  id: string,
  name: string,
  expression: string,
  x: number,
  y: number,
): FoundationDynamicsNode {
  return {
    id,
    type: "foundationDynamics",
    position: { x, y },
    data: { primitive: "operator", name, expression },
  };
}

export function sinkNode(
  id: string,
  name: string,
  state: number,
  expression: string,
  x: number,
  y: number,
): FoundationDynamicsNode {
  return {
    id,
    type: "foundationDynamics",
    position: { x, y },
    data: { primitive: "sink", name, state, expression },
  };
}

export function createPrimitiveNode(
  primitive: DynamicsPrimitive,
  index: number,
): FoundationDynamicsNode {
  const x = 120 + (index % 4) * 170;
  const y = 120 + Math.floor(index / 4) * 120;
  const id = `${primitive}-${index + 1}`;
  switch (primitive) {
    case "input":
      return inputNode(id, "newInput", "user", 0, undefined, x, y);
    case "operator":
      return operatorNode(id, "newOperator", "a + b", x, y);
    case "sink":
      return sinkNode(id, "newSink", 0, "state + input", x, y);
    default:
      assertNever(primitive);
  }
}

export function edge(
  id: string,
  source: string,
  target: string,
  label?: string,
): FoundationDynamicsEdge {
  return {
    id,
    source,
    sourceHandle: "out",
    target,
    targetHandle: "in",
    label,
    type: "smoothstep",
  };
}

export function hasEquivalentConnection(
  edges: readonly FoundationDynamicsEdge[],
  connection: FoundationDynamicsConnection,
): boolean {
  if (connection.source === null || connection.target === null) {
    return false;
  }
  const sourceHandle = connection.sourceHandle ?? "out";
  const targetHandle = connection.targetHandle ?? "in";
  return edges.some(
    (edge) =>
      edge.source === connection.source &&
      edge.target === connection.target &&
      (edge.sourceHandle ?? "out") === sourceHandle &&
      (edge.targetHandle ?? "in") === targetHandle,
  );
}

export function normalizeReadInputs(
  nodes: readonly FoundationDynamicsNode[],
): FoundationDynamicsNode[] {
  const sinks = sinkNodes(nodes);
  const sinkById = new Map(sinks.map((sink) => [sink.id, sink]));
  return nodes.map((node) => {
    if (node.data.primitive !== "input" || node.data.inputKind !== "read") {
      return node;
    }
    const readSinkId = node.data.readSinkId;
    const sink =
      readSinkId === undefined ? undefined : sinkById.get(readSinkId);
    if (sink !== undefined) {
      return {
        ...node,
        data: {
          ...node.data,
          name: sink.data.name,
        },
      };
    }
    if (sinks[0] === undefined) {
      return {
        ...node,
        data: {
          ...node.data,
          inputKind: "user",
          readSinkId: undefined,
          value: node.data.value ?? 0,
        },
      };
    }
    return {
      ...node,
      data: {
        ...node.data,
        name: sinks[0].data.name,
        readSinkId: sinks[0].id,
      },
    };
  });
}

export function sinkNodes(
  nodes: readonly FoundationDynamicsNode[],
): readonly FoundationDynamicsNode[] {
  return nodes.filter((node) => node.data.primitive === "sink");
}

export function chartableNodes(
  nodes: readonly FoundationDynamicsNode[],
): readonly FoundationDynamicsNode[] {
  return nodes.filter(
    (node) =>
      node.data.primitive === "sink" || node.data.primitive === "operator",
  );
}

export function primitiveCount(
  nodes: readonly FoundationDynamicsNode[],
  primitive: DynamicsPrimitive,
): number {
  return nodes.filter((node) => node.data.primitive === primitive).length;
}

export function tabLabel(primitive: DynamicsPrimitive): string {
  switch (primitive) {
    case "input":
      return "Inputs";
    case "operator":
      return "Operators";
    case "sink":
      return "Sinks";
    default:
      assertNever(primitive);
  }
}

export function incomingNames(
  nodeId: string,
  nodes: readonly FoundationDynamicsNode[],
  edges: readonly FoundationDynamicsEdge[],
): readonly string[] {
  return edges
    .filter((edge) => edge.target === nodeId)
    .map((edge) => nodes.find((node) => node.id === edge.source)?.data.name)
    .filter((name): name is string => name !== undefined);
}

export function connectionSummaries(
  nodeId: string,
  direction: "incoming" | "outgoing",
  nodes: readonly FoundationDynamicsNode[],
  edges: readonly FoundationDynamicsEdge[],
): readonly string[] {
  return edges
    .filter((edge) =>
      direction === "incoming"
        ? edge.target === nodeId
        : edge.source === nodeId,
    )
    .map((edge) => {
      const sourceName =
        nodes.find((node) => node.id === edge.source)?.data.name ?? edge.source;
      const targetName =
        nodes.find((node) => node.id === edge.target)?.data.name ?? edge.target;
      return direction === "incoming" ? sourceName : targetName;
    });
}

export function initialSimulationState(
  nodes: readonly FoundationDynamicsNode[],
  edges: readonly FoundationDynamicsEdge[],
): SimulationState {
  return initialDynamicsSimulationState(schemaForNodesAndEdges(nodes, edges));
}

export function stepSimulationState(
  current: SimulationState,
  nodes: readonly FoundationDynamicsNode[],
  edges: readonly FoundationDynamicsEdge[],
): SimulationState {
  return stepDynamicsSimulationState(
    current,
    schemaForNodesAndEdges(nodes, edges),
  );
}

export function dynamicsCompileDiagnostics(
  nodes: readonly FoundationDynamicsNode[],
  edges: readonly FoundationDynamicsEdge[],
): readonly string[] {
  try {
    compileDynamicsSystem(schemaForNodesAndEdges(nodes, edges));
    return [];
  } catch (error) {
    if (error instanceof DynamicsCompileError) {
      return error.diagnostics;
    }
    return [
      error instanceof Error ? error.message : "Could not compile graph.",
    ];
  }
}

export function currentNodeValue(
  node: FoundationDynamicsNode,
  simulation: SimulationState,
): number {
  const frame = simulation.frames[simulation.frames.length - 1];
  if (node.data.primitive === "input") {
    return node.data.inputKind === "read"
      ? (frame?.sinkStates[node.data.readSinkId ?? ""] ?? 0)
      : (node.data.value ?? 0);
  }
  return frameValue(frame, node);
}

export function frameValue(
  frame: SimulationFrame | undefined,
  node: FoundationDynamicsNode,
): number {
  if (frame === undefined) {
    return 0;
  }
  return node.data.primitive === "sink"
    ? (frame.sinkStates[node.id] ?? 0)
    : (frame.operatorValues[node.id] ?? 0);
}

export function setCurrentSinkState(
  current: SimulationState,
  nodeId: string,
  value: number,
): SimulationState {
  const sinkStates = { ...current.sinkStates, [nodeId]: value };
  const frames = current.frames.map((frame, index) =>
    index === current.frames.length - 1
      ? { ...frame, sinkStates: { ...frame.sinkStates, [nodeId]: value } }
      : frame,
  );
  return {
    ...current,
    sinkStates,
    frames:
      frames.length === 0
        ? [{ tick: current.tick, operatorValues: {}, sinkStates }]
        : frames,
  };
}

export function applyInputActions(
  nodes: readonly FoundationDynamicsNode[],
  actions: readonly InputRampAction[],
): {
  readonly nodes: FoundationDynamicsNode[];
  readonly actions: readonly InputRampAction[];
} {
  if (actions.length === 0) {
    return { nodes: [...nodes], actions };
  }
  const nodeIds = new Set(nodes.map((node) => node.id));
  const activeActions = actions.filter(
    (action) => action.remainingTicks > 0 && nodeIds.has(action.nodeId),
  );
  const actionByNodeId = new Map(
    activeActions.map((action) => [action.nodeId, action]),
  );
  const nextNodes = nodes.map((node) => {
    const action = actionByNodeId.get(node.id);
    if (
      action === undefined ||
      node.data.primitive !== "input" ||
      node.data.inputKind === "read"
    ) {
      return node;
    }
    const value = (node.data.value ?? 0) + action.deltaPerTick;
    return { ...node, data: { ...node.data, value } };
  });
  return {
    nodes: nextNodes,
    actions: activeActions
      .map((action) => ({
        ...action,
        remainingTicks: action.remainingTicks - 1,
      }))
      .filter((action) => action.remainingTicks > 0),
  };
}

export function loadSavedDynamicsSystems(): readonly FoundationDynamicsEditorSystem[] {
  return loadFoundationDynamicsSystemLibrary().map(
    savedDynamicsSystemFromSchema,
  );
}

export function saveDynamicsSystemLibrary(
  systems: readonly FoundationDynamicsEditorSystem[],
): void {
  saveFoundationDynamicsSystemLibrary(systems.map(savedDynamicsSystemToSchema));
}

export function serializeDynamicsSystemLibrary(
  systems: readonly FoundationDynamicsEditorSystem[],
): string {
  return serializeFoundationDynamicsSystemLibrary(
    systems.map(savedDynamicsSystemToSchema),
  );
}

export function parseDynamicsSystemLibraryJson(
  value: string,
): readonly FoundationDynamicsEditorSystem[] {
  return parseFoundationDynamicsSystemLibraryJson(value).map(
    savedDynamicsSystemFromSchema,
  );
}

export function savedDynamicsSystemToSchema(
  system: FoundationDynamicsEditorSystem,
): DynamicsSavedSystem {
  return {
    version: DYNAMICS_SCHEMA_VERSION,
    definition: {
      version: DYNAMICS_SCHEMA_VERSION,
      id: system.id,
      name: system.name,
      savedAt: system.savedAt,
      nodes: system.nodes.map(editorNodeToDefinition),
      edges: system.edges.map(editorEdgeToDefinition),
    },
    scenario: {
      version: DYNAMICS_SCHEMA_VERSION,
      id: `${system.id}-default`,
      systemId: system.id,
      name: "Default",
      inputValues: editorInputValues(system.nodes),
      sinkInitialStates: editorSinkInitialStates(system.nodes),
    },
    view: {
      version: DYNAMICS_SCHEMA_VERSION,
      systemId: system.id,
      nodes: system.nodes.map(editorNodeToView),
    },
  };
}

export function savedDynamicsSystemFromSchema(
  system: DynamicsSavedSystem,
): FoundationDynamicsEditorSystem {
  const viewById = new Map(system.view.nodes.map((node) => [node.id, node]));
  return normalizeSavedDynamicsSystem({
    id: system.definition.id,
    name: system.definition.name,
    savedAt: system.definition.savedAt ?? 0,
    nodes: system.definition.nodes.map((node) =>
      schemaNodeToEditorNode(
        node,
        viewById.get(node.id),
        system.scenario.inputValues?.[node.id],
        system.scenario.sinkInitialStates?.[node.id],
      ),
    ),
    edges: system.definition.edges.map((definition) => ({
      id: definition.id,
      source: definition.source,
      sourceHandle: "out",
      target: definition.target,
      targetHandle: "in",
      label: definition.label,
      type: "smoothstep",
    })),
  });
}

export function savedDynamicsSystem(
  name: string,
  nodes: readonly FoundationDynamicsNode[],
  edges: readonly FoundationDynamicsEdge[],
): FoundationDynamicsEditorSystem {
  const normalizedName = name.trim() || "Untitled system";
  return {
    id: slugifySystemName(normalizedName),
    name: normalizedName,
    savedAt: Date.now(),
    nodes: cloneNodes(nodes),
    edges: cloneEdges(edges),
  };
}

export function cloneNodes(
  nodes: readonly FoundationDynamicsNode[],
): FoundationDynamicsNode[] {
  return nodes.map((node) => ({
    ...node,
    position: { ...node.position },
    data: { ...node.data },
    selected: false,
  }));
}

export function cloneEdges(
  edges: readonly FoundationDynamicsEdge[],
): FoundationDynamicsEdge[] {
  return edges.map((edge) => ({
    ...edge,
    data:
      edge.data === undefined
        ? undefined
        : { ...(edge.data as Record<string, unknown>) },
    selected: false,
  }));
}

export function parseNumberInput(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function normalizeSavedDynamicsSystem(
  system: FoundationDynamicsEditorSystem,
): FoundationDynamicsEditorSystem {
  return {
    ...system,
    nodes: normalizeReadInputs(cloneNodes(system.nodes)),
    edges: cloneEdges(system.edges),
  };
}

function editorNodeToDefinition(
  node: FoundationDynamicsNode,
): DynamicsNodeDefinition {
  if (node.data.primitive === "input") {
    return {
      id: node.id,
      primitive: "input",
      name: node.data.name,
      inputKind: node.data.inputKind ?? "user",
      readSinkId: node.data.readSinkId,
    };
  }
  if (node.data.primitive === "sink") {
    return {
      id: node.id,
      primitive: "sink",
      name: node.data.name,
      expression: node.data.expression ?? "state",
    };
  }
  return {
    id: node.id,
    primitive: "operator",
    name: node.data.name,
    expression: node.data.expression ?? "0",
  };
}

function editorEdgeToDefinition(
  edge: FoundationDynamicsEdge,
): DynamicsEdgeDefinition {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: typeof edge.label === "string" ? edge.label : undefined,
  };
}

function editorNodeToView(node: FoundationDynamicsNode): DynamicsViewNode {
  return {
    id: node.id,
    position: { x: node.position.x, y: node.position.y },
    inputControl:
      node.data.primitive === "input"
        ? {
            sliderMin: node.data.sliderMin,
            sliderMax: node.data.sliderMax,
            actionAmount: node.data.actionAmount,
            actionTicks: node.data.actionTicks,
          }
        : undefined,
  };
}

function editorInputValues(
  nodes: readonly FoundationDynamicsNode[],
): Record<string, number> {
  const values: Record<string, number> = {};
  for (const node of nodes) {
    if (node.data.primitive === "input" && node.data.inputKind !== "read") {
      values[node.id] = node.data.value ?? 0;
    }
  }
  return values;
}

function editorSinkInitialStates(
  nodes: readonly FoundationDynamicsNode[],
): Record<string, number> {
  const states: Record<string, number> = {};
  for (const node of nodes) {
    if (node.data.primitive === "sink") {
      states[node.id] = node.data.state ?? 0;
    }
  }
  return states;
}

function schemaNodeToEditorNode(
  node: DynamicsNodeDefinition,
  view: DynamicsViewNode | undefined,
  inputValue: number | undefined,
  sinkState: number | undefined,
): FoundationDynamicsNode {
  return {
    id: node.id,
    type: "foundationDynamics",
    position: view?.position ?? { x: 0, y: 0 },
    data: {
      primitive: node.primitive,
      name: node.name,
      inputKind: node.primitive === "input" ? node.inputKind : undefined,
      readSinkId: node.primitive === "input" ? node.readSinkId : undefined,
      value: node.primitive === "input" ? inputValue : undefined,
      expression:
        node.primitive === "operator" || node.primitive === "sink"
          ? node.expression
          : undefined,
      state: node.primitive === "sink" ? sinkState : undefined,
      sliderMin: view?.inputControl?.sliderMin,
      sliderMax: view?.inputControl?.sliderMax,
      actionAmount: view?.inputControl?.actionAmount,
      actionTicks: view?.inputControl?.actionTicks,
    },
  };
}

function schemaForNodesAndEdges(
  nodes: readonly FoundationDynamicsNode[],
  edges: readonly FoundationDynamicsEdge[],
) {
  return savedDynamicsSystemToSchema({
    id: "current-dynamics-system",
    name: "Current dynamics system",
    savedAt: 0,
    nodes,
    edges,
  });
}

function slugifySystemName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug === "" ? "untitled-system" : slug;
}

function assertNever(value: never): never {
  throw new Error(`Unsupported dynamics primitive "${String(value)}".`);
}
