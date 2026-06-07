import { AllianceExtensionExecution } from "../../../../core/execution/alliance/AllianceExtensionExecution";
import { AllianceRequestExecution } from "../../../../core/execution/alliance/AllianceRequestExecution";
import { AttackExecution } from "../../../../core/execution/AttackExecution";
import { ConstructionExecution } from "../../../../core/execution/ConstructionExecution";
import { DeleteUnitExecution } from "../../../../core/execution/DeleteUnitExecution";
import { DonateTroopsExecution } from "../../../../core/execution/DonateTroopExecution";
import { EmojiExecution } from "../../../../core/execution/EmojiExecution";
import { MirvExecution } from "../../../../core/execution/MIRVExecution";
import { NukeExecution } from "../../../../core/execution/NukeExecution";
import { SpawnExecution } from "../../../../core/execution/SpawnExecution";
import { TransportShipExecution } from "../../../../core/execution/TransportShipExecution";
import { UpgradeStructureExecution } from "../../../../core/execution/UpgradeStructureExecution";
import {
  AllPlayers,
  Game,
  Player,
  PlayerID,
  PlayerInfo,
  UnitType,
} from "../../../../core/game/Game";
import { TileRef } from "../../../../core/game/GameMap";
import { GameID } from "../../../../core/Schemas";
import { NukeType } from "../../../../core/StatsSchemas";

export class AiCommandSurface {
  constructor(private readonly game: Game) {}

  sendAttack(player: Player, troops: number, targetID: PlayerID | null): void {
    this.game.addExecution(new AttackExecution(troops, player, targetID));
  }

  sendBoat(player: Player, dst: TileRef, troops: number): void {
    this.game.addExecution(new TransportShipExecution(player, dst, troops));
  }

  spawnPlayer(gameID: GameID, playerInfo: PlayerInfo, tile?: TileRef): void {
    this.game.addExecution(new SpawnExecution(gameID, playerInfo, tile));
  }

  donateTroops(player: Player, recipient: PlayerID, troops: number): void {
    this.game.addExecution(
      new DonateTroopsExecution(player, recipient, troops),
    );
  }

  buildUnit(
    player: Player,
    unitType: UnitType,
    tile: TileRef,
    rocketDirectionUp?: boolean,
  ): void {
    this.game.addExecution(
      new ConstructionExecution(player, unitType, tile, rocketDirectionUp),
    );
  }

  upgradeStructure(player: Player, unitId: number): void {
    this.game.addExecution(new UpgradeStructureExecution(player, unitId));
  }

  sendNuke(
    nukeType: NukeType,
    player: Player,
    tile: TileRef,
    src: TileRef | null = null,
    speed: number = -1,
    waitTicks = 0,
  ): void {
    this.game.addExecution(
      new NukeExecution(nukeType, player, tile, src, speed, waitTicks),
    );
  }

  sendMirv(player: Player, tile: TileRef): void {
    this.game.addExecution(new MirvExecution(player, tile));
  }

  sendEmoji(
    player: Player,
    recipient: PlayerID | typeof AllPlayers,
    emoji: number,
  ): void {
    this.game.addExecution(new EmojiExecution(player, recipient, emoji));
  }

  extendAlliance(player: Player, recipient: PlayerID): void {
    this.game.addExecution(new AllianceExtensionExecution(player, recipient));
  }

  requestAlliance(player: Player, recipient: PlayerID): void {
    this.game.addExecution(new AllianceRequestExecution(player, recipient));
  }

  deleteUnit(player: Player, unitId: number): void {
    this.game.addExecution(new DeleteUnitExecution(player, unitId));
  }
}
