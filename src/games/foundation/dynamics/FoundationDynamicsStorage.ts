import {
  DYNAMICS_SCHEMA_VERSION,
  type DynamicsEdgeDefinition,
  type DynamicsNodeDefinition,
  type DynamicsSavedSystem,
  type DynamicsSystemLibrary,
  type DynamicsViewNode,
} from "../../../core/systems/dynamics";

interface LegacyFoundationDynamicsNode {
  readonly id: string;
  readonly type?: string;
  readonly position: { readonly x: number; readonly y: number };
  readonly data: {
    readonly primitive?: unknown;
    readonly name?: unknown;
    readonly inputKind?: unknown;
    readonly value?: unknown;
    readonly sliderMin?: unknown;
    readonly sliderMax?: unknown;
    readonly actionAmount?: unknown;
    readonly actionTicks?: unknown;
    readonly readSinkId?: unknown;
    readonly expression?: unknown;
    readonly state?: unknown;
  };
}

interface LegacyFoundationDynamicsEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly label?: unknown;
}

interface LegacySavedDynamicsSystem {
  readonly id: string;
  readonly name: string;
  readonly savedAt: number;
  readonly nodes: readonly LegacyFoundationDynamicsNode[];
  readonly edges: readonly LegacyFoundationDynamicsEdge[];
}

interface LegacyDynamicsSystemLibrary {
  readonly version: 1;
  readonly systems: readonly LegacySavedDynamicsSystem[];
}

export const FOUNDATION_DYNAMICS_LIBRARY_KEY =
  "openfront.foundation.dynamics.systems.v1";

export function loadFoundationDynamicsSystemLibrary(): readonly DynamicsSavedSystem[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(FOUNDATION_DYNAMICS_LIBRARY_KEY);
    return raw === null ? [] : parseFoundationDynamicsSystemLibraryJson(raw);
  } catch {
    return [];
  }
}

export function saveFoundationDynamicsSystemLibrary(
  systems: readonly DynamicsSavedSystem[],
): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      FOUNDATION_DYNAMICS_LIBRARY_KEY,
      serializeFoundationDynamicsSystemLibrary(systems),
    );
  } catch {
    // Local storage can be unavailable in private or test environments.
  }
}

export function serializeFoundationDynamicsSystemLibrary(
  systems: readonly DynamicsSavedSystem[],
): string {
  return JSON.stringify(
    {
      version: DYNAMICS_SCHEMA_VERSION,
      systems,
    } satisfies DynamicsSystemLibrary,
    null,
    2,
  );
}

export function parseFoundationDynamicsSystemLibraryJson(
  value: string,
): readonly DynamicsSavedSystem[] {
  const parsed = JSON.parse(value) as unknown;
  const systems = parseLibrarySystems(parsed);
  if (systems.length === 0) {
    throw new Error("Dynamics JSON did not contain any valid systems.");
  }
  return systems;
}

function legacySavedSystemToV2(
  system: LegacySavedDynamicsSystem,
): DynamicsSavedSystem {
  const nodes = system.nodes.map(legacyNodeToDefinition);
  return {
    version: DYNAMICS_SCHEMA_VERSION,
    definition: {
      version: DYNAMICS_SCHEMA_VERSION,
      id: system.id,
      name: system.name,
      savedAt: system.savedAt,
      nodes,
      edges: system.edges.map(legacyEdgeToDefinition),
    },
    scenario: {
      version: DYNAMICS_SCHEMA_VERSION,
      id: `${system.id}-default`,
      systemId: system.id,
      name: "Default",
      inputValues: inputValues(system.nodes),
      sinkInitialStates: sinkInitialStates(system.nodes),
    },
    view: {
      version: DYNAMICS_SCHEMA_VERSION,
      systemId: system.id,
      nodes: system.nodes.map(legacyNodeToView),
    },
  };
}

function parseLibrarySystems(parsed: unknown): readonly DynamicsSavedSystem[] {
  if (Array.isArray(parsed)) {
    return parsed
      .filter(isLegacySavedDynamicsSystem)
      .map(legacySavedSystemToV2);
  }
  if (typeof parsed !== "object" || parsed === null) {
    return [];
  }
  const library = parsed as Partial<
    LegacyDynamicsSystemLibrary | DynamicsSystemLibrary
  >;
  if (library.version === 1 && Array.isArray(library.systems)) {
    return library.systems
      .filter(isLegacySavedDynamicsSystem)
      .map(legacySavedSystemToV2);
  }
  if (library.version === DYNAMICS_SCHEMA_VERSION) {
    return (library.systems ?? []).filter(isDynamicsSavedSystem);
  }
  return [];
}

function legacyNodeToDefinition(
  node: LegacyFoundationDynamicsNode,
): DynamicsNodeDefinition {
  const primitive = node.data.primitive;
  const name = stringValue(node.data.name, node.id);
  if (primitive === "input") {
    const inputKind = node.data.inputKind;
    return {
      id: node.id,
      primitive: "input",
      name,
      inputKind:
        inputKind === "read" || inputKind === "constant" || inputKind === "user"
          ? inputKind
          : "user",
      readSinkId: stringOrUndefined(node.data.readSinkId),
    };
  }
  if (primitive === "sink") {
    return {
      id: node.id,
      primitive: "sink",
      name,
      expression: stringValue(node.data.expression, "state"),
    };
  }
  return {
    id: node.id,
    primitive: "operator",
    name,
    expression: stringValue(node.data.expression, "0"),
  };
}

function legacyEdgeToDefinition(
  edge: LegacyFoundationDynamicsEdge,
): DynamicsEdgeDefinition {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: stringOrUndefined(edge.label),
  };
}

function legacyNodeToView(
  node: LegacyFoundationDynamicsNode,
): DynamicsViewNode {
  return {
    id: node.id,
    position: {
      x: finiteNumber(node.position.x, 0),
      y: finiteNumber(node.position.y, 0),
    },
    inputControl:
      node.data.primitive === "input"
        ? {
            sliderMin: numberOrUndefined(node.data.sliderMin),
            sliderMax: numberOrUndefined(node.data.sliderMax),
            actionAmount: numberOrUndefined(node.data.actionAmount),
            actionTicks: numberOrUndefined(node.data.actionTicks),
          }
        : undefined,
  };
}

function inputValues(
  nodes: readonly LegacyFoundationDynamicsNode[],
): Record<string, number> {
  const values: Record<string, number> = {};
  for (const node of nodes) {
    if (node.data.primitive === "input" && node.data.inputKind !== "read") {
      values[node.id] = finiteNumber(node.data.value, 0);
    }
  }
  return values;
}

function sinkInitialStates(
  nodes: readonly LegacyFoundationDynamicsNode[],
): Record<string, number> {
  const states: Record<string, number> = {};
  for (const node of nodes) {
    if (node.data.primitive === "sink") {
      states[node.id] = finiteNumber(node.data.state, 0);
    }
  }
  return states;
}

function isLegacySavedDynamicsSystem(
  value: unknown,
): value is LegacySavedDynamicsSystem {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<LegacySavedDynamicsSystem>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.savedAt === "number" &&
    Array.isArray(candidate.nodes) &&
    Array.isArray(candidate.edges)
  );
}

function isDynamicsSavedSystem(value: unknown): value is DynamicsSavedSystem {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<DynamicsSavedSystem>;
  return (
    candidate.version === DYNAMICS_SCHEMA_VERSION &&
    typeof candidate.definition === "object" &&
    candidate.definition !== null &&
    typeof candidate.scenario === "object" &&
    candidate.scenario !== null &&
    typeof candidate.view === "object" &&
    candidate.view !== null
  );
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
