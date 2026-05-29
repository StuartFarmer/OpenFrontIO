import { AllianceExtensionExecution } from "../../execution/alliance/AllianceExtensionExecution";
import { AllianceRejectExecution } from "../../execution/alliance/AllianceRejectExecution";
import { AllianceRequestExecution } from "../../execution/alliance/AllianceRequestExecution";
import { BreakAllianceExecution } from "../../execution/alliance/BreakAllianceExecution";
import { AttackExecution } from "../../execution/AttackExecution";
import { BoatRetreatExecution } from "../../execution/BoatRetreatExecution";
import { ConstructionExecution } from "../../execution/ConstructionExecution";
import { DeleteUnitExecution } from "../../execution/DeleteUnitExecution";
import { DonateGoldExecution } from "../../execution/DonateGoldExecution";
import { DonateTroopsExecution } from "../../execution/DonateTroopExecution";
import { EmbargoAllExecution } from "../../execution/EmbargoAllExecution";
import { EmbargoExecution } from "../../execution/EmbargoExecution";
import { EmojiExecution } from "../../execution/EmojiExecution";
import { MarkDisconnectedExecution } from "../../execution/MarkDisconnectedExecution";
import { MoveWarshipExecution } from "../../execution/MoveWarshipExecution";
import { NoOpExecution } from "../../execution/NoOpExecution";
import { PauseExecution } from "../../execution/PauseExecution";
import { QuickChatExecution } from "../../execution/QuickChatExecution";
import { RetreatExecution } from "../../execution/RetreatExecution";
import { SetFoodAllocationExecution } from "../../execution/SetFoodAllocationExecution";
import { SpawnExecution } from "../../execution/SpawnExecution";
import { TargetPlayerExecution } from "../../execution/TargetPlayerExecution";
import { TransportShipExecution } from "../../execution/TransportShipExecution";
import { UpgradeStructureExecution } from "../../execution/UpgradeStructureExecution";
import { Execution, Game, Player } from "../../game/Game";
import { GameID, StampedIntent } from "../../Schemas";

export class IntentCommandSurface {
  constructor(
    private readonly game: Game,
    private readonly gameID: GameID,
  ) {}

  createExecution(intent: StampedIntent): Execution {
    const player = this.game.playerByClientID(intent.clientID);
    if (!player) {
      console.warn(`player with clientID ${intent.clientID} not found`);
      return new NoOpExecution();
    }
    return this.createPlayerExecution(intent, player);
  }

  private createPlayerExecution(
    intent: StampedIntent,
    player: Player,
  ): Execution {
    switch (intent.type) {
      case "attack":
        return new AttackExecution(
          intent.troops,
          player,
          intent.targetID,
          null,
        );
      case "cancel_attack":
        return new RetreatExecution(player, intent.attackID);
      case "set_food_allocation":
        return new SetFoodAllocationExecution(
          player,
          intent.foodAllocationToPopulation,
        );
      case "cancel_boat":
        return new BoatRetreatExecution(player, intent.unitID);
      case "move_warship":
        return new MoveWarshipExecution(player, intent.unitIds, intent.tile);
      case "spawn":
        return new SpawnExecution(this.gameID, player.info(), intent.tile);
      case "boat":
        return new TransportShipExecution(player, intent.dst, intent.troops);
      case "allianceRequest":
        return new AllianceRequestExecution(player, intent.recipient);
      case "allianceReject":
        return new AllianceRejectExecution(intent.requestor, player);
      case "breakAlliance":
        return new BreakAllianceExecution(player, intent.recipient);
      case "targetPlayer":
        return new TargetPlayerExecution(player, intent.target);
      case "emoji":
        return new EmojiExecution(player, intent.recipient, intent.emoji);
      case "donate_troops":
        return new DonateTroopsExecution(
          player,
          intent.recipient,
          intent.troops,
        );
      case "donate_gold":
        return new DonateGoldExecution(player, intent.recipient, intent.gold);
      case "embargo":
        return new EmbargoExecution(player, intent.targetID, intent.action);
      case "embargo_all":
        return new EmbargoAllExecution(player, intent.action);
      case "build_unit":
        return new ConstructionExecution(
          player,
          intent.unit,
          intent.tile,
          intent.rocketDirectionUp,
        );
      case "allianceExtension":
        return new AllianceExtensionExecution(player, intent.recipient);
      case "upgrade_structure":
        return new UpgradeStructureExecution(player, intent.unitId);
      case "delete_unit":
        return new DeleteUnitExecution(player, intent.unitId);
      case "quick_chat":
        return new QuickChatExecution(
          player,
          intent.recipient,
          intent.quickChatKey,
          intent.target,
        );
      case "mark_disconnected":
        return new MarkDisconnectedExecution(player, intent.isDisconnected);
      case "toggle_pause":
        return new PauseExecution(player, intent.paused);
      default:
        throw new Error(`intent type ${intent} not found`);
    }
  }
}
