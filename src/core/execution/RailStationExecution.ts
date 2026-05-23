import { Execution, Game, Unit, UnitType } from "../game/Game";
import { TrainStationExecution } from "./TrainStationExecution";

export class RailStationExecution implements Execution {
  private active = true;
  private game: Game;
  private stationCreated = false;

  constructor(private railStation: Unit) {}

  init(mg: Game, ticks: number): void {
    this.game = mg;
  }

  tick(ticks: number): void {
    if (!this.railStation.isActive()) {
      this.active = false;
      return;
    }
    if (!this.stationCreated) {
      this.createStation();
      this.stationCreated = true;
    }
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }

  activeDuringSpawnPhase(): boolean {
    return false;
  }

  private createStation(): void {
    const structures = this.game.nearbyUnits(
      this.railStation.tile(),
      this.game.config().trainStationMaxRange(),
      [UnitType.City, UnitType.Port, UnitType.RailStation],
    );

    this.game.addExecution(new TrainStationExecution(this.railStation));
    for (const { unit } of structures) {
      if (!unit.hasTrainStation()) {
        this.game.addExecution(new TrainStationExecution(unit));
      }
    }
  }
}
