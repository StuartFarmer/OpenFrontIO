import {
  DifficultyMultiplierConfig,
  PopulationResourceMechanicsConfig,
  ResourceWeightConfig,
} from "../configuration/MechanicsConfig";
import { Game, Player, PlayerType, TerrainType, UnitType } from "../game/Game";
import { PlayerView } from "../game/GameView";
import { ResourceStockpile } from "../game/Resources";
import {
  evaluatePlayerEconomyModel,
  PlayerEconomyModelResult,
} from "./models/PlayerEconomyModel";
import {
  capacityMultiplierForPlayerType,
  evaluatePopulationSystem,
  growthMultiplierForPlayerType,
} from "./models/PopulationSystem";
import {
  evaluateResourceCapacity,
  evaluateResourceProductionSystem,
} from "./models/ResourceProductionSystem";

export type DifficultyKey = keyof DifficultyMultiplierConfig;

export interface PopulationEvaluationOptions {
  readonly mechanics: PopulationResourceMechanicsConfig;
  readonly difficulty: DifficultyKey;
  readonly hasInfiniteTroops: boolean;
}

export interface ResourceEvaluationOptions {
  readonly mechanics: PopulationResourceMechanicsConfig;
  readonly difficulty: DifficultyKey;
}

export function evaluatePlayerPopulationCapacity(
  player: Player | PlayerView,
  options: PopulationEvaluationOptions,
): number {
  return evaluatePopulationSystem(options.mechanics, {
    population: player.troops(),
    tilesOwned: player.numTilesOwned(),
    maxPopulationOverride: options.hasInfiniteTroops ? 1_000_000_000 : 0,
    capacityMultiplier: capacityMultiplierForPlayerType(
      player.type(),
      options.mechanics,
      options.difficulty,
    ),
    growthMultiplier: 1,
  }).capacity;
}

export function evaluatePlayerPopulationGrowth(
  player: Player | PlayerView,
  options: PopulationEvaluationOptions,
): number {
  return evaluatePopulationSystem(options.mechanics, {
    population: player.troops(),
    tilesOwned: player.numTilesOwned(),
    maxPopulationOverride: options.hasInfiniteTroops ? 1_000_000_000 : 0,
    capacityMultiplier: capacityMultiplierForPlayerType(
      player.type(),
      options.mechanics,
      options.difficulty,
    ),
    growthMultiplier: growthMultiplierForPlayerType(
      player.type(),
      options.mechanics,
      options.difficulty,
    ),
  }).growth;
}

export function evaluatePlayerResourceCapacity(
  player: Player | PlayerView,
  options: ResourceEvaluationOptions,
): ResourceStockpile {
  return evaluateResourceCapacity(
    options.mechanics,
    player.numTilesOwned(),
    completedSiloLevels(player),
    resourceCapacityMultiplierForPlayerType(
      player.type(),
      options.mechanics,
      options.difficulty,
    ),
  );
}

export function evaluatePlayerResourceProduction(
  game: Game,
  player: Player,
  options: ResourceEvaluationOptions,
): ResourceStockpile {
  return evaluateResourceProductionSystem(options.mechanics, {
    resources: player.resources(),
    tilesOwned: player.numTilesOwned(),
    siloLevels: completedSiloLevels(player),
    capacityMultiplier: resourceCapacityMultiplierForPlayerType(
      player.type(),
      options.mechanics,
      options.difficulty,
    ),
    regenMultiplier: resourceRegenMultiplierForPlayerType(
      player.type(),
      options.mechanics,
      options.difficulty,
    ),
    terrainWeights: terrainResourceProductionSplit(
      game,
      player,
      options.mechanics,
    ),
  }).delta;
}

export function evaluatePlayerEconomy(
  game: Game,
  player: Player,
  options: PopulationEvaluationOptions & ResourceEvaluationOptions,
): PlayerEconomyModelResult {
  const capacityMultiplier = capacityMultiplierForPlayerType(
    player.type(),
    options.mechanics,
    options.difficulty,
  );
  return evaluatePlayerEconomyModel({
    mechanics: options.mechanics,
    playerType: player.type(),
    population: {
      population: player.troops(),
      tilesOwned: player.numTilesOwned(),
      maxPopulationOverride: options.hasInfiniteTroops ? 1_000_000_000 : 0,
      capacityMultiplier,
      growthMultiplier: growthMultiplierForPlayerType(
        player.type(),
        options.mechanics,
        options.difficulty,
      ),
    },
    resources: {
      resources: player.resources(),
      tilesOwned: player.numTilesOwned(),
      siloLevels: completedSiloLevels(player),
      capacityMultiplier: resourceCapacityMultiplierForPlayerType(
        player.type(),
        options.mechanics,
        options.difficulty,
      ),
      regenMultiplier: resourceRegenMultiplierForPlayerType(
        player.type(),
        options.mechanics,
        options.difficulty,
      ),
      terrainWeights: terrainResourceProductionSplit(
        game,
        player,
        options.mechanics,
      ),
    },
    war: {
      mobilizedPopulation: mobilizedPopulation(player),
    },
  });
}

export function terrainResourceProductionSplit(
  game: Game,
  player: Player,
  mechanics: PopulationResourceMechanicsConfig,
): ResourceWeightConfig {
  const weights: ResourceWeightConfig = {
    food: 0,
    energy: 0,
    materials: 0,
  };

  for (const tile of player.tiles()) {
    switch (game.terrainType(tile)) {
      case TerrainType.Plains:
        addResourceWeights(weights, mechanics, "plains");
        break;
      case TerrainType.Highland:
        addResourceWeights(weights, mechanics, "highland");
        break;
      case TerrainType.Mountain:
        addResourceWeights(weights, mechanics, "mountain");
        break;
      default:
        break;
    }
  }

  return weights;
}

function completedSiloLevels(player: Player | PlayerView): number {
  return player
    .units(UnitType.Silo)
    .filter((u) => !u.isUnderConstruction())
    .map((silo) => silo.level())
    .reduce((a, b) => a + b, 0);
}

function resourceCapacityMultiplierForPlayerType(
  playerType: PlayerType,
  mechanics: PopulationResourceMechanicsConfig,
  difficulty: DifficultyKey,
): number {
  if (playerType === PlayerType.Bot) {
    return mechanics.botCapacityMultiplier;
  }
  if (playerType === PlayerType.Human) {
    return 1;
  }
  return mechanics.nationCapacityMultipliers[difficulty];
}

function resourceRegenMultiplierForPlayerType(
  playerType: PlayerType,
  mechanics: PopulationResourceMechanicsConfig,
  difficulty: DifficultyKey,
): number {
  if (playerType === PlayerType.Bot) {
    return mechanics.botResourceRegenMultiplier;
  }
  if (playerType !== PlayerType.Nation) {
    return 1;
  }
  return mechanics.nationResourceRegenMultipliers[difficulty];
}

function addResourceWeights(
  weights: ResourceWeightConfig,
  mechanics: PopulationResourceMechanicsConfig,
  terrain: "plains" | "highland" | "mountain",
): void {
  const terrainWeights = mechanics.terrainWeights[terrain];
  weights.food += terrainWeights.food;
  weights.energy += terrainWeights.energy;
  weights.materials += terrainWeights.materials;
}

function mobilizedPopulation(player: Player): number {
  return player
    .outgoingAttacks()
    .map((attack) => attack.troops())
    .reduce((a, b) => a + b, 0);
}
