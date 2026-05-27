import { Execution, Game, Player } from "../game/Game";
import { PlayerEconomySystem } from "../systems/gameplay/PlayerEconomySystem";
import {
  PlayerUpkeepState,
  PlayerUpkeepSystem,
} from "../systems/gameplay/PlayerUpkeepSystem";

export class PlayerExecution implements Execution {
  private readonly economySystem = new PlayerEconomySystem();
  private readonly upkeepSystem = new PlayerUpkeepSystem();

  private mg: Game;
  private upkeepState: PlayerUpkeepState;
  private active = true;

  constructor(private player: Player) {}

  activeDuringSpawnPhase(): boolean {
    return false;
  }

  init(mg: Game, ticks: number) {
    this.mg = mg;
    this.upkeepState = this.upkeepSystem.initializePlayer(this.player, ticks);
  }

  tick(ticks: number) {
    const upkeep = this.upkeepSystem.tickPlayer(
      this.mg,
      this.player,
      this.upkeepState,
      ticks,
    );
    this.upkeepState = upkeep.state;
    if (!upkeep.active) {
      this.active = false;
      return;
    }

    this.economySystem.tickPlayer(this.mg, this.player);
  }

  owner(): Player {
    if (this.player === null) {
      throw new Error("Not initialized");
    }
    return this.player;
  }

  isActive(): boolean {
    return this.active;
  }
}
