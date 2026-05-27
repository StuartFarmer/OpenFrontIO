import { Config } from "../configuration/Config";
import { Execution, Game, Player, Tick, Unit } from "../game/Game";
import { GameUpdate } from "../game/GameUpdates";
import { Stats } from "../game/Stats";

export interface GameSystemContext {
  readonly game: Game;
  readonly tick: Tick;
  readonly inSpawnPhase: boolean;
  readonly config: Config;
  players(): Player[];
  allPlayers(): Player[];
  units(): Unit[];
  addExecution(...executions: Execution[]): void;
  addUpdate(update: GameUpdate): void;
  stats(): Stats;
}

export function createGameSystemContext(game: Game): GameSystemContext {
  return {
    game,
    tick: game.ticks(),
    inSpawnPhase: game.inSpawnPhase(),
    config: game.config(),
    players: () => game.players(),
    allPlayers: () => game.allPlayers(),
    units: () => game.units(),
    addExecution: (...executions) => game.addExecution(...executions),
    addUpdate: (update) => game.addUpdate(update),
    stats: () => game.stats(),
  };
}
