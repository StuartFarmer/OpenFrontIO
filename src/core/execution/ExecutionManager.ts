import { Execution, Game } from "../game/Game";
import { PseudoRandom } from "../PseudoRandom";
import { ClientID, GameID, StampedIntent, Turn } from "../Schemas";
import { IntentCommandSurface } from "../systems/commands/IntentCommandSurface";
import { simpleHash } from "../Util";
import { NationExecution } from "./NationExecution";
import { SpawnExecution } from "./SpawnExecution";
import { TribeSpawner } from "./TribeSpawner";
import { PlayerSpawner } from "./utils/PlayerSpawner";

export class Executor {
  // private random = new PseudoRandom(999)
  private random: PseudoRandom;
  private readonly intentCommands: IntentCommandSurface;

  constructor(
    private mg: Game,
    private gameID: GameID,
    private clientID: ClientID | undefined,
  ) {
    // Add one to avoid id collisions with tribes.
    this.random = new PseudoRandom(simpleHash(gameID) + 1);
    this.intentCommands = new IntentCommandSurface(mg, gameID);
  }

  createExecs(turn: Turn): Execution[] {
    return turn.intents.map((i) => this.createExec(i));
  }

  createExec(intent: StampedIntent): Execution {
    return this.intentCommands.createExecution(intent);
  }

  spawnTribes(numTribes: number): SpawnExecution[] {
    return new TribeSpawner(this.mg, this.gameID).spawnTribes(numTribes);
  }

  spawnPlayers(): SpawnExecution[] {
    return new PlayerSpawner(this.mg, this.gameID).spawnPlayers();
  }

  nationExecutions(): Execution[] {
    const execs: Execution[] = [];
    for (const nation of this.mg.nations()) {
      execs.push(new NationExecution(this.gameID, nation));
    }
    return execs;
  }
}
