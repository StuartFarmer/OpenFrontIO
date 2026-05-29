import { Execution, Game, Player } from "../game/Game";

export class SetFoodAllocationExecution implements Execution {
  constructor(
    private readonly player: Player,
    private readonly foodAllocationToPopulation: number,
  ) {}

  isActive(): boolean {
    return false;
  }

  activeDuringSpawnPhase(): boolean {
    return false;
  }

  init(_game: Game, _ticks: number): void {
    this.player.setFoodAllocationToPopulation(
      Math.max(0, Math.min(1, this.foodAllocationToPopulation)),
    );
  }

  tick(_ticks: number): void {}
}
