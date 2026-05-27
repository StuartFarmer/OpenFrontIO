import { GameSystemContext } from "./GameSystemContext";

export const GAME_SYSTEM_PHASES = [
  "preTick",
  "legacyExecution",
  "simulation",
  "postTick",
] as const;

export type GameSystemPhase = (typeof GAME_SYSTEM_PHASES)[number];

export interface GameSystem {
  readonly id: string;
  readonly phase: GameSystemPhase;
  readonly order?: number;
  activeDuringSpawnPhase?(): boolean;
  tick(context: GameSystemContext): void;
}

export class GameSystemScheduler {
  private readonly systems: readonly GameSystem[];

  constructor(systems: readonly GameSystem[]) {
    this.systems = [...systems].sort(compareSystems);
  }

  tick(context: GameSystemContext): void {
    for (const system of this.systems) {
      if (context.inSpawnPhase && system.activeDuringSpawnPhase?.() !== true) {
        continue;
      }
      system.tick(context);
    }
  }

  listSystems(): readonly GameSystem[] {
    return this.systems;
  }
}

function compareSystems(a: GameSystem, b: GameSystem): number {
  const phaseDelta = phaseIndex(a.phase) - phaseIndex(b.phase);
  if (phaseDelta !== 0) {
    return phaseDelta;
  }
  const orderDelta = (a.order ?? 0) - (b.order ?? 0);
  if (orderDelta !== 0) {
    return orderDelta;
  }
  return a.id.localeCompare(b.id);
}

function phaseIndex(phase: GameSystemPhase): number {
  return GAME_SYSTEM_PHASES.indexOf(phase);
}
