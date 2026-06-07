import { renderTroops } from "../../client/Utils";
import { AttackCommandSystem } from "../../games/openfront/systems/gameplay/AttackCommandSystem";
import { BattleResolutionSystem } from "../../games/openfront/systems/gameplay/BattleResolutionSystem";
import { TerritoryConquestSystem } from "../../games/openfront/systems/gameplay/TerritoryConquestSystem";
import {
  Attack,
  Execution,
  Game,
  MessageType,
  Player,
  PlayerID,
  TerrainType,
  TerraNullius,
} from "../game/Game";
import { TileRef } from "../game/GameMap";
import { PseudoRandom } from "../PseudoRandom";
import { FlatBinaryHeap } from "./utils/FlatBinaryHeap"; // adjust path if needed

export class AttackExecution implements Execution {
  private active: boolean = true;
  private toConquer = new FlatBinaryHeap();

  private random = new PseudoRandom(123);
  private attackCommandSystem = new AttackCommandSystem();
  private battleResolutionSystem = new BattleResolutionSystem();
  private territoryConquestSystem = new TerritoryConquestSystem();

  private target: Player | TerraNullius;

  private mg: Game;

  private attack: Attack | null = null;

  constructor(
    private startTroops: number | null = null,
    private _owner: Player,
    private _targetID: PlayerID | null,
    private sourceTile: TileRef | null = null,
    private removeTroops: boolean = true,
  ) {}

  public targetID(): PlayerID | null {
    return this._targetID;
  }

  activeDuringSpawnPhase(): boolean {
    return false;
  }

  init(mg: Game, ticks: number) {
    if (!this.active) {
      return;
    }
    this.mg = mg;

    const result = this.attackCommandSystem.startAttack(this.mg, {
      startTroops: this.startTroops,
      owner: this._owner,
      targetID: this._targetID,
      sourceTile: this.sourceTile,
      removeTroops: this.removeTroops,
      initializeFrontier: (attack, target) => {
        this.target = target;
        this.attack = attack;
        if (this.sourceTile !== null) {
          this.addNeighbors(this.sourceTile);
        } else {
          this.refreshToConquer();
        }
      },
    });

    this.startTroops = result.startTroops;
    if (result.target !== null) {
      this.target = result.target;
    }
    this.attack = result.attack;
    if (!result.active) {
      this.active = false;
    }
  }

  private refreshToConquer() {
    if (this.attack === null) {
      throw new Error("Attack not initialized");
    }

    this.toConquer.clear();
    this.attack.clearBorder();
    for (const tile of this._owner.borderTiles()) {
      this.addNeighbors(tile);
    }
  }

  private retreat(malusPercent = 0) {
    if (this.attack === null) {
      throw new Error("Attack not initialized");
    }

    const deaths = this.attack.troops() * (malusPercent / 100);
    if (deaths) {
      this.mg.displayMessage(
        "events_display.attack_cancelled_retreat",
        MessageType.ATTACK_CANCELLED,
        this._owner.id(),
        undefined,
        { troops: renderTroops(deaths) },
      );
    }
    if (this.removeTroops === false && this.sourceTile === null) {
      // startTroops are always added to attack troops at init but not always removed from owner troops
      // subtract startTroops from attack troops so we don't give back startTroops to owner that were never removed
      // boat attacks (sourceTile !== null) are the exception: troops were removed at departure and must be returned after attack still
      this.attack.setTroops(this.attack.troops() - (this.startTroops ?? 0));
    }

    const survivors = this.attack.troops() - deaths;
    this._owner.addTroops(survivors);
    this.attack.delete();
    this.active = false;

    // Not all retreats are canceled attacks
    if (this.attack.retreated()) {
      // Record stats
      this.mg.stats().attackCancel(this._owner, this.target, survivors);
    }
  }

  tick(ticks: number) {
    if (this.attack === null) {
      throw new Error("Attack not initialized");
    }
    this.battleResolutionSystem.tickAttack({
      game: this.mg,
      owner: this._owner,
      target: this.target,
      attack: this.attack,
      frontier: this.toConquer,
      randomBorderJitter: () => this.random.nextInt(0, 5),
      refreshFrontier: () => this.refreshToConquer(),
      retreat: (malusPercent = 0) => this.retreat(malusPercent),
      deactivate: () => {
        this.active = false;
      },
      addNeighbors: (tile) => this.addNeighbors(tile),
      captureTile: (tile) =>
        this.territoryConquestSystem.captureAttackTile({
          game: this.mg,
          attacker: this._owner,
          target: this.target,
          tile,
        }),
      handleDeadDefender: () =>
        this.territoryConquestSystem.handleDeadDefender(
          this.mg,
          this._owner,
          this.target,
        ),
    });
  }

  private addNeighbors(tile: TileRef) {
    if (this.attack === null) {
      throw new Error("Attack not initialized");
    }

    const tickNow = this.mg.ticks(); // cache tick

    this.mg.forEachNeighbor(tile, (neighbor) => {
      if (
        this.mg.isWater(neighbor) ||
        this.mg.owner(neighbor) !== this.target
      ) {
        return;
      }
      this.attack!.addBorderTile(neighbor);
      let numOwnedByMe = 0;
      this.mg.forEachNeighbor(neighbor, (n) => {
        if (this.mg.owner(n) === this._owner) {
          numOwnedByMe++;
        }
      });

      let mag: number;
      switch (this.mg.terrainType(neighbor)) {
        case TerrainType.Plains:
          mag = 1;
          break;
        case TerrainType.Highland:
          mag = 1.5;
          break;
        case TerrainType.Mountain:
          mag = 2;
          break;
        default:
          mag = 0;
          break;
      }

      const priority =
        (this.random.nextInt(0, 7) + 10) * (1 - numOwnedByMe * 0.5 + mag / 2) +
        tickNow;

      this.toConquer.enqueue(neighbor, priority);
    });
  }

  owner(): Player {
    return this._owner;
  }

  isActive(): boolean {
    return this.active;
  }
}
