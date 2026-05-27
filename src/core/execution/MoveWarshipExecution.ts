import { Execution, Game, Player } from "../game/Game";
import { TileRef } from "../game/GameMap";
import { MobileUnitSystem } from "../systems/gameplay/MobileUnitSystem";

export class MoveWarshipExecution implements Execution {
  constructor(
    private readonly owner: Player,
    private readonly unitIds: number[],
    private readonly position: TileRef,
  ) {}

  private mobileUnitSystem = new MobileUnitSystem();

  init(mg: Game, _ticks: number): void {
    this.mobileUnitSystem.moveWarships(
      mg,
      this.owner,
      this.unitIds,
      this.position,
    );
  }

  tick(_ticks: number): void {}

  isActive(): boolean {
    return false;
  }

  activeDuringSpawnPhase(): boolean {
    return false;
  }
}
