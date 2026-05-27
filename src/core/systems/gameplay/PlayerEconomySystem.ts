import { Game, Player } from "../../game/Game";
import { PlayerEconomyModelResult } from "../models/PlayerEconomyModel";

export class PlayerEconomySystem {
  tickPlayer(game: Game, player: Player): PlayerEconomyModelResult {
    const economy = game.config().playerEconomyTick(game, player);
    player.addTroops(economy.troopDelta);
    player.addResources(economy.resourceDelta, undefined, {
      updateGold: false,
    });
    game.stats().goldWork(player, economy.resourceDelta.food);
    return economy;
  }
}
