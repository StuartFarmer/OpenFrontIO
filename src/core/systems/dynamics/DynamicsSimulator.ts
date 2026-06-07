import {
  compileDynamicsSystem,
  evaluateCompiledDynamicsExpression,
  type CompiledDynamicsSystem,
} from "./DynamicsCompiler";
import type {
  DynamicsRuntimeState,
  DynamicsSavedSystem,
  DynamicsTraceFrame,
} from "./DynamicsSchema";

export function initialDynamicsSimulationState(
  system: DynamicsSavedSystem,
): DynamicsRuntimeState {
  const compiled = compileDynamicsSystem(system);
  const sinkStates = initialSinkStates(system);
  const values = evaluateValues(compiled, system, sinkStates);
  const operatorValues = operatorOutputs(compiled, values);
  return {
    running: false,
    tick: 0,
    sinkStates,
    frames: [{ tick: 0, operatorValues, sinkStates }],
  };
}

export function stepDynamicsSimulationState(
  current: DynamicsRuntimeState,
  system: DynamicsSavedSystem,
): DynamicsRuntimeState {
  const compiled = compileDynamicsSystem(system);
  const values = evaluateValues(compiled, system, current.sinkStates);
  const sinkStates = evaluateSinkStates(compiled, current.sinkStates, values);
  const operatorValues = operatorOutputs(compiled, values);
  const tick = current.tick + 1;
  const frame: DynamicsTraceFrame = {
    tick,
    operatorValues,
    sinkStates,
  };
  return {
    running: current.running,
    tick,
    sinkStates,
    frames: [...current.frames, frame].slice(-120),
  };
}

function initialSinkStates(
  system: DynamicsSavedSystem,
): Readonly<Record<string, number>> {
  const states: Record<string, number> = {};
  for (const sink of system.definition.nodes.filter(
    (node) => node.primitive === "sink",
  )) {
    states[sink.id] = system.scenario.sinkInitialStates?.[sink.id] ?? 0;
  }
  return states;
}

function evaluateValues(
  compiled: CompiledDynamicsSystem,
  system: DynamicsSavedSystem,
  currentSinkStates: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> {
  const values: Record<string, number> = {};
  for (const input of compiled.inputs) {
    values[input.id] =
      input.inputKind === "read"
        ? (currentSinkStates[input.readSinkId ?? ""] ?? 0)
        : (system.scenario.inputValues?.[input.id] ?? 0);
  }
  for (const operator of compiled.operators) {
    values[operator.id] = evaluateCompiledDynamicsExpression(
      operator.evaluate,
      incomingScope(operator.id, compiled, values),
    );
  }
  return values;
}

function evaluateSinkStates(
  compiled: CompiledDynamicsSystem,
  currentSinkStates: Readonly<Record<string, number>>,
  values: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> {
  const next: Record<string, number> = {};
  for (const sink of compiled.sinks) {
    next[sink.id] = evaluateCompiledDynamicsExpression(sink.evaluate, {
      ...incomingScope(sink.id, compiled, values),
      state: currentSinkStates[sink.id] ?? 0,
    });
  }
  return next;
}

function operatorOutputs(
  compiled: CompiledDynamicsSystem,
  values: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> {
  const outputs: Record<string, number> = {};
  for (const operator of compiled.operators) {
    outputs[operator.id] = values[operator.id] ?? 0;
  }
  return outputs;
}

function incomingScope(
  nodeId: string,
  compiled: CompiledDynamicsSystem,
  values: Readonly<Record<string, number>>,
): Record<string, number> {
  const scope: Record<string, number> = {};
  for (const edge of compiled.incomingByTarget.get(nodeId) ?? []) {
    const sourceName = compiled.nodeNameById.get(edge.source);
    if (sourceName !== undefined) {
      scope[sourceName] = values[edge.source] ?? 0;
    }
  }
  return scope;
}
