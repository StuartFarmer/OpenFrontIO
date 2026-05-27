import { Game } from "../../../src/core/game/Game";
import {
  captureParitySnapshot,
  normalizeForParity,
  ParitySnapshot,
  SnapshotOptions,
} from "./ParitySnapshot";

export interface ParityGamePath {
  readonly label: string;
  readonly game: Game;
}

export interface ParityStepResult {
  readonly tick: number;
  readonly expected: ParitySnapshot;
  readonly actual: ParitySnapshot;
  readonly diff: ParityDiff | null;
}

export interface ParityRunResult {
  readonly expectedLabel: string;
  readonly actualLabel: string;
  readonly steps: readonly ParityStepResult[];
  readonly firstDiff: ParityDiff | null;
}

export interface ParityDiff {
  readonly path: string;
  readonly expected: unknown;
  readonly actual: unknown;
}

export interface RunParityOptions {
  readonly ticks: number;
  readonly beforeTick?: (
    tickIndex: number,
    expected: Game,
    actual: Game,
  ) => void;
  readonly afterTick?: (
    tickIndex: number,
    expected: Game,
    actual: Game,
  ) => void;
  readonly captureUpdates?: boolean;
}

export function runParityScenario(
  expected: ParityGamePath,
  actual: ParityGamePath,
  options: RunParityOptions,
): ParityRunResult {
  const steps: ParityStepResult[] = [];
  let firstDiff: ParityDiff | null = null;

  for (let tickIndex = 0; tickIndex < options.ticks; tickIndex++) {
    options.beforeTick?.(tickIndex, expected.game, actual.game);

    const expectedUpdates = expected.game.executeNextTick();
    const actualUpdates = actual.game.executeNextTick();
    const expectedPackedTileUpdates = expected.game.drainPackedTileUpdates();
    const actualPackedTileUpdates = actual.game.drainPackedTileUpdates();
    const expectedPackedMotionPlans = expected.game.drainPackedMotionPlans();
    const actualPackedMotionPlans = actual.game.drainPackedMotionPlans();

    options.afterTick?.(tickIndex, expected.game, actual.game);

    const expectedSnapshot = captureParitySnapshot(
      expected.game,
      snapshotOptions(options.captureUpdates, {
        updates: expectedUpdates,
        packedTileUpdates: expectedPackedTileUpdates,
        packedMotionPlans: expectedPackedMotionPlans,
      }),
    );
    const actualSnapshot = captureParitySnapshot(
      actual.game,
      snapshotOptions(options.captureUpdates, {
        updates: actualUpdates,
        packedTileUpdates: actualPackedTileUpdates,
        packedMotionPlans: actualPackedMotionPlans,
      }),
    );
    const diff = findParityDiff(expectedSnapshot, actualSnapshot);
    firstDiff ??= diff;

    steps.push({
      tick: expected.game.ticks(),
      expected: expectedSnapshot,
      actual: actualSnapshot,
      diff,
    });
  }

  return {
    expectedLabel: expected.label,
    actualLabel: actual.label,
    steps,
    firstDiff,
  };
}

export function expectParity(result: ParityRunResult): void {
  if (result.firstDiff !== null) {
    throw new Error(formatParityDiff(result));
  }
}

export function formatParityDiff(result: ParityRunResult): string {
  if (result.firstDiff === null) {
    return `${result.expectedLabel} and ${result.actualLabel} matched.`;
  }
  const step = result.steps.find((candidate) => candidate.diff !== null);
  const tickLabel = step !== undefined ? ` at tick ${step.tick}` : "";
  return [
    `Parity mismatch${tickLabel}: ${result.expectedLabel} != ${result.actualLabel}`,
    `path: ${result.firstDiff.path}`,
    `expected: ${JSON.stringify(result.firstDiff.expected)}`,
    `actual: ${JSON.stringify(result.firstDiff.actual)}`,
  ].join("\n");
}

export function findParityDiff(
  expected: unknown,
  actual: unknown,
  path = "$",
): ParityDiff | null {
  const normalizedExpected = normalizeForParity(expected);
  const normalizedActual = normalizeForParity(actual);
  return findNormalizedDiff(normalizedExpected, normalizedActual, path);
}

function findNormalizedDiff(
  expected: unknown,
  actual: unknown,
  path: string,
): ParityDiff | null {
  if (Object.is(expected, actual)) {
    return null;
  }
  if (Array.isArray(expected) || Array.isArray(actual)) {
    if (!Array.isArray(expected) || !Array.isArray(actual)) {
      return { path, expected, actual };
    }
    if (expected.length !== actual.length) {
      return {
        path: `${path}.length`,
        expected: expected.length,
        actual: actual.length,
      };
    }
    for (let index = 0; index < expected.length; index++) {
      const diff = findNormalizedDiff(
        expected[index],
        actual[index],
        `${path}[${index}]`,
      );
      if (diff !== null) {
        return diff;
      }
    }
    return null;
  }
  if (isRecord(expected) || isRecord(actual)) {
    if (!isRecord(expected) || !isRecord(actual)) {
      return { path, expected, actual };
    }
    const keys = [
      ...new Set([...Object.keys(expected), ...Object.keys(actual)]),
    ].sort((a, b) => a.localeCompare(b));
    for (const key of keys) {
      if (!(key in expected) || !(key in actual)) {
        return {
          path: `${path}.${key}`,
          expected: expected[key],
          actual: actual[key],
        };
      }
      const diff = findNormalizedDiff(
        expected[key],
        actual[key],
        `${path}.${key}`,
      );
      if (diff !== null) {
        return diff;
      }
    }
    return null;
  }
  return { path, expected, actual };
}

function snapshotOptions(
  captureUpdates: boolean | undefined,
  options: Required<SnapshotOptions>,
): SnapshotOptions {
  if (captureUpdates) {
    return options;
  }
  return {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}
