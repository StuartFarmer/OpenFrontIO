import {
  DYNAMICS_SYSTEM_SCHEMA_VERSION,
  type DynamicsScenario,
  type DynamicsSystemDefinition,
} from "../../../core/systems/dynamics";

export const FOUNDATION_DYNAMICS_STORAGE_KEY = "foundation.dynamics.v1";
export const FOUNDATION_DYNAMICS_LIBRARY_VERSION = 1;

export interface FoundationDynamicsLibrary {
  readonly version: typeof FOUNDATION_DYNAMICS_LIBRARY_VERSION;
  readonly systems: readonly DynamicsSystemDefinition[];
  readonly scenarios: readonly DynamicsScenario[];
}

export interface FoundationDynamicsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const EMPTY_FOUNDATION_DYNAMICS_LIBRARY: FoundationDynamicsLibrary = {
  version: FOUNDATION_DYNAMICS_LIBRARY_VERSION,
  systems: [],
  scenarios: [],
};

export class FoundationDynamicsStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FoundationDynamicsStorageError";
  }
}

export function loadFoundationDynamicsLibrary(
  storage: FoundationDynamicsStorage = browserLocalStorage(),
): FoundationDynamicsLibrary {
  const stored = storage.getItem(FOUNDATION_DYNAMICS_STORAGE_KEY);
  if (stored === null) {
    return EMPTY_FOUNDATION_DYNAMICS_LIBRARY;
  }
  return parseFoundationDynamicsLibrary(stored);
}

export function saveFoundationDynamicsLibrary(
  library: FoundationDynamicsLibrary,
  storage: FoundationDynamicsStorage = browserLocalStorage(),
): void {
  storage.setItem(
    FOUNDATION_DYNAMICS_STORAGE_KEY,
    exportFoundationDynamicsLibrary(library),
  );
}

export function exportFoundationDynamicsLibrary(
  library: FoundationDynamicsLibrary,
): string {
  assertFoundationDynamicsLibrary(library);
  return JSON.stringify(library, null, 2);
}

export function parseFoundationDynamicsLibrary(
  serialized: string,
): FoundationDynamicsLibrary {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new FoundationDynamicsStorageError("Invalid dynamics JSON.");
  }
  assertFoundationDynamicsLibrary(parsed);
  return parsed;
}

export function upsertFoundationDynamicsSystem(
  library: FoundationDynamicsLibrary,
  system: DynamicsSystemDefinition,
): FoundationDynamicsLibrary {
  assertDynamicsSystemDefinition(system);
  return {
    ...library,
    systems: [
      ...library.systems.filter((stored) => stored.id !== system.id),
      system,
    ],
  };
}

export function upsertFoundationDynamicsScenario(
  library: FoundationDynamicsLibrary,
  scenario: DynamicsScenario,
): FoundationDynamicsLibrary {
  assertDynamicsScenario(scenario);
  return {
    ...library,
    scenarios: [
      ...library.scenarios.filter((stored) => stored.id !== scenario.id),
      scenario,
    ],
  };
}

export function deleteFoundationDynamicsSystem(
  library: FoundationDynamicsLibrary,
  systemId: string,
): FoundationDynamicsLibrary {
  return {
    ...library,
    systems: library.systems.filter((system) => system.id !== systemId),
    scenarios: library.scenarios.filter(
      (scenario) => scenario.systemId !== systemId,
    ),
  };
}

export function duplicateFoundationDynamicsSystem(
  library: FoundationDynamicsLibrary,
  systemId: string,
  options: { id?: string; name?: string } = {},
): FoundationDynamicsLibrary {
  const source = library.systems.find((system) => system.id === systemId);
  if (source === undefined) {
    throw new FoundationDynamicsStorageError(
      `Cannot duplicate missing dynamics system "${systemId}".`,
    );
  }
  const nextId = uniqueId(
    options.id ?? `${source.id}-copy`,
    library.systems.map((system) => system.id),
  );
  const nextSystem: DynamicsSystemDefinition = {
    ...source,
    id: nextId,
    name: options.name ?? `${source.name} Copy`,
  };
  const sourceScenarios = library.scenarios.filter(
    (scenario) => scenario.systemId === systemId,
  );
  const duplicatedScenarios = sourceScenarios.map((scenario) => ({
    ...scenario,
    id: uniqueId(
      `${scenario.id}-copy`,
      library.scenarios.map((stored) => stored.id),
    ),
    systemId: nextId,
    name: `${scenario.name} Copy`,
  }));

  return {
    ...library,
    systems: [...library.systems, nextSystem],
    scenarios: [...library.scenarios, ...duplicatedScenarios],
  };
}

function browserLocalStorage(): FoundationDynamicsStorage {
  if (typeof window === "undefined") {
    throw new FoundationDynamicsStorageError(
      "Foundation dynamics storage is unavailable outside a browser.",
    );
  }
  return window.localStorage;
}

function assertFoundationDynamicsLibrary(
  value: unknown,
): asserts value is FoundationDynamicsLibrary {
  if (!isObject(value)) {
    throw new FoundationDynamicsStorageError(
      "Dynamics library must be an object.",
    );
  }
  if (value.version !== FOUNDATION_DYNAMICS_LIBRARY_VERSION) {
    throw new FoundationDynamicsStorageError(
      `Unsupported dynamics library version "${String(value.version)}".`,
    );
  }
  if (!Array.isArray(value.systems) || !Array.isArray(value.scenarios)) {
    throw new FoundationDynamicsStorageError(
      "Dynamics library must include systems and scenarios arrays.",
    );
  }
  for (const system of value.systems) {
    assertDynamicsSystemDefinition(system);
  }
  for (const scenario of value.scenarios) {
    assertDynamicsScenario(scenario);
  }
}

function assertDynamicsSystemDefinition(
  value: unknown,
): asserts value is DynamicsSystemDefinition {
  if (!isObject(value)) {
    throw new FoundationDynamicsStorageError(
      "Dynamics system must be an object.",
    );
  }
  if (value.version !== DYNAMICS_SYSTEM_SCHEMA_VERSION) {
    throw new FoundationDynamicsStorageError(
      `Unsupported dynamics system version "${String(value.version)}".`,
    );
  }
  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    !Array.isArray(value.nodes) ||
    !Array.isArray(value.edges)
  ) {
    throw new FoundationDynamicsStorageError(
      "Dynamics system is missing id, name, nodes, or edges.",
    );
  }
}

function assertDynamicsScenario(
  value: unknown,
): asserts value is DynamicsScenario {
  if (!isObject(value)) {
    throw new FoundationDynamicsStorageError(
      "Dynamics scenario must be an object.",
    );
  }
  if (value.version !== DYNAMICS_SYSTEM_SCHEMA_VERSION) {
    throw new FoundationDynamicsStorageError(
      `Unsupported dynamics scenario version "${String(value.version)}".`,
    );
  }
  if (
    typeof value.id !== "string" ||
    typeof value.systemId !== "string" ||
    typeof value.name !== "string" ||
    typeof value.tickCount !== "number"
  ) {
    throw new FoundationDynamicsStorageError(
      "Dynamics scenario is missing id, systemId, name, or tickCount.",
    );
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function uniqueId(baseId: string, existingIds: readonly string[]): string {
  const existing = new Set(existingIds);
  if (!existing.has(baseId)) {
    return baseId;
  }
  let suffix = 2;
  while (existing.has(`${baseId}-${suffix}`)) {
    suffix++;
  }
  return `${baseId}-${suffix}`;
}
