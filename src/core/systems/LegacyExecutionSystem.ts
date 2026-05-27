import { Execution } from "../game/Game";
import { GameSystem } from "./GameSystem";
import { GameSystemContext } from "./GameSystemContext";

export class LegacyExecutionSystem implements GameSystem {
  readonly id = "legacy-execution";
  readonly phase = "legacyExecution";

  private activeExecutions: Execution[] = [];
  private uninitializedExecutions: Execution[] = [];

  activeDuringSpawnPhase(): boolean {
    return true;
  }

  addExecution(...executions: Execution[]): void {
    this.uninitializedExecutions.push(...executions);
  }

  removeExecution(execution: Execution): void {
    this.activeExecutions = this.activeExecutions.filter(
      (candidate) => candidate !== execution,
    );
    this.uninitializedExecutions = this.uninitializedExecutions.filter(
      (candidate) => candidate !== execution,
    );
  }

  executions(): Execution[] {
    return [...this.activeExecutions, ...this.uninitializedExecutions];
  }

  removeInactiveForSpawnPhase(inSpawnPhase: boolean): void {
    this.removeInactiveExecutions(inSpawnPhase);
  }

  tick(context: GameSystemContext): void {
    this.tickActiveExecutions(context);
    const initialized = this.initializeQueuedExecutions(context);
    this.removeInactiveExecutions(context.inSpawnPhase);
    this.activeExecutions.push(...initialized);
  }

  private tickActiveExecutions(context: GameSystemContext): void {
    for (const execution of this.activeExecutions) {
      if (
        (!context.inSpawnPhase || execution.activeDuringSpawnPhase()) &&
        execution.isActive()
      ) {
        execution.tick(context.tick);
      }
    }
  }

  private initializeQueuedExecutions(context: GameSystemContext): Execution[] {
    const initialized: Execution[] = [];
    const uninitialized: Execution[] = [];

    for (const execution of this.uninitializedExecutions) {
      if (!context.inSpawnPhase || execution.activeDuringSpawnPhase()) {
        execution.init(context.game, context.tick);
        initialized.push(execution);
      } else {
        uninitialized.push(execution);
      }
    }

    this.uninitializedExecutions = uninitialized;
    return initialized;
  }

  private removeInactiveExecutions(inSpawnPhase: boolean): void {
    const activeExecutions: Execution[] = [];
    for (const execution of this.activeExecutions) {
      if (inSpawnPhase) {
        if (execution.activeDuringSpawnPhase()) {
          if (execution.isActive()) {
            activeExecutions.push(execution);
          }
        } else {
          activeExecutions.push(execution);
        }
      } else if (execution.isActive()) {
        activeExecutions.push(execution);
      }
    }
    this.activeExecutions = activeExecutions;
  }
}
