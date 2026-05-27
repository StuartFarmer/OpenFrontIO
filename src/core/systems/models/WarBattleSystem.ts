import { ResourceStockpile } from "../../game/Resources";

// Sandbox-only tuning model. Canonical live-game combat is resolved by
// BattleResolutionSystem and TerritoryConquestSystem against Game/Attack state.
// Keep this model isolated from GameImpl tick execution unless it is first
// reconciled against the canonical attack parity suite.

export type BattleOutcome =
  | "idle"
  | "fighting"
  | "attacker-defeated"
  | "defender-conquered";

export type TerrainProfile = "plains" | "highland" | "mountain";

export interface WarBattleSideState {
  readonly troops: number;
  readonly food: number;
  readonly energy: number;
  readonly materials: number;
  readonly tiles: number;
}

export interface WarBattleState {
  readonly attacker: WarBattleSideState;
  readonly defender: WarBattleSideState;
  readonly activeAttackers: number;
  readonly defenderDevastation: number;
  readonly outcome: BattleOutcome;
}

export interface WarBattleParams {
  readonly terrain: TerrainProfile;
  readonly borderWidth: number;
  readonly defenseMobilizationResponse: number;
  readonly maxDefensiveMobilizationFraction: number;
  readonly warUpkeepScalePer1000Troops: number;
  readonly attackerFoodCost: number;
  readonly attackerEnergyCost: number;
  readonly attackerMaterialsCost: number;
  readonly defenderFoodCost: number;
  readonly defenderEnergyCost: number;
  readonly defenderMaterialsCost: number;
  readonly minSupplyMultiplier: number;
  readonly attackerSupplyTileSpeedWeight: number;
  readonly supplyLossPenalty: number;
  readonly attackerFoodProductionPerTile: number;
  readonly attackerEnergyProductionPerTile: number;
  readonly attackerMaterialsProductionPerTile: number;
  readonly defenderFoodProductionPerTile: number;
  readonly defenderEnergyProductionPerTile: number;
  readonly defenderMaterialsProductionPerTile: number;
  readonly conqueredTileDevastation: number;
  readonly casualtyDevastation: number;
  readonly devastationRecoveryPerTick: number;
  readonly maxDevastation: number;
  readonly foodCaptureRatio: number;
  readonly foodDestroyRatio: number;
  readonly energyCaptureRatio: number;
  readonly energyDestroyRatio: number;
  readonly materialsCaptureRatio: number;
  readonly materialsDestroyRatio: number;
}

export interface WarBattleTickResult {
  readonly state: WarBattleState;
  readonly activeDefenders: number;
  readonly combatIntensity: number;
  readonly attackerSupply: number;
  readonly defenderSupply: number;
  readonly attackerCosts: ResourceStockpile;
  readonly defenderCosts: ResourceStockpile;
  readonly attackerProduced: ResourceStockpile;
  readonly defenderProduced: ResourceStockpile;
  readonly attackerLosses: number;
  readonly defenderLosses: number;
  readonly tilesCaptured: number;
  readonly resourcesCaptured: ResourceStockpile;
  readonly resourcesDestroyed: ResourceStockpile;
}

export const DEFAULT_WAR_BATTLE_PARAMS: WarBattleParams = {
  terrain: "plains",
  borderWidth: 8,
  defenseMobilizationResponse: 1,
  maxDefensiveMobilizationFraction: 0.6,
  warUpkeepScalePer1000Troops: 5,
  attackerFoodCost: 1,
  attackerEnergyCost: 0.5,
  attackerMaterialsCost: 0.8,
  defenderFoodCost: 0.7,
  defenderEnergyCost: 0.2,
  defenderMaterialsCost: 0.5,
  minSupplyMultiplier: 0.25,
  attackerSupplyTileSpeedWeight: 1,
  supplyLossPenalty: 1,
  attackerFoodProductionPerTile: 0.8,
  attackerEnergyProductionPerTile: 0.25,
  attackerMaterialsProductionPerTile: 0.35,
  defenderFoodProductionPerTile: 0.8,
  defenderEnergyProductionPerTile: 0.25,
  defenderMaterialsProductionPerTile: 0.35,
  conqueredTileDevastation: 0.35,
  casualtyDevastation: 0.1,
  devastationRecoveryPerTick: 0.00003,
  maxDevastation: 0.8,
  foodCaptureRatio: 0.2,
  foodDestroyRatio: 0.5,
  energyCaptureRatio: 0.3,
  energyDestroyRatio: 0.5,
  materialsCaptureRatio: 0.4,
  materialsDestroyRatio: 0.3,
};

export function createWarBattleState(
  attacker: WarBattleSideState,
  defender: WarBattleSideState,
): WarBattleState {
  return {
    attacker,
    defender,
    activeAttackers: 0,
    defenderDevastation: 0,
    outcome: "idle",
  };
}

export function startWarBattleAttack(
  state: WarBattleState,
  troopsToCommit: number,
): WarBattleState {
  if (state.outcome === "defender-conquered") {
    return state;
  }
  const committed = Math.max(
    0,
    Math.min(state.attacker.troops, troopsToCommit),
  );
  return {
    ...state,
    attacker: {
      ...state.attacker,
      troops: state.attacker.troops - committed,
    },
    activeAttackers: state.activeAttackers + committed,
    outcome: committed > 0 ? "fighting" : state.outcome,
  };
}

export function evaluateWarBattleTick(
  state: WarBattleState,
  params: WarBattleParams = DEFAULT_WAR_BATTLE_PARAMS,
): WarBattleTickResult {
  const attackerProduced = productionFor(
    state.attacker.tiles,
    0,
    params.attackerFoodProductionPerTile,
    params.attackerEnergyProductionPerTile,
    params.attackerMaterialsProductionPerTile,
  );
  const defenderProduced = productionFor(
    state.defender.tiles,
    state.defenderDevastation,
    params.defenderFoodProductionPerTile,
    params.defenderEnergyProductionPerTile,
    params.defenderMaterialsProductionPerTile,
  );

  const attackerWithProduction = addResources(state.attacker, attackerProduced);
  const defenderWithProduction = addResources(state.defender, defenderProduced);

  if (state.activeAttackers <= 0 || state.outcome !== "fighting") {
    const recoveredDevastation = recoverDevastation(
      state.defenderDevastation,
      params,
    );
    return {
      state: {
        ...state,
        attacker: attackerWithProduction,
        defender: defenderWithProduction,
        defenderDevastation: recoveredDevastation,
        outcome: state.outcome === "fighting" ? "idle" : state.outcome,
      },
      activeDefenders: 0,
      combatIntensity: 0,
      attackerSupply: 1,
      defenderSupply: 1,
      attackerCosts: zeroResources(),
      defenderCosts: zeroResources(),
      attackerProduced,
      defenderProduced,
      attackerLosses: 0,
      defenderLosses: 0,
      tilesCaptured: 0,
      resourcesCaptured: zeroResources(),
      resourcesDestroyed: zeroResources(),
    };
  }

  const activeDefenders = Math.min(
    defenderWithProduction.troops,
    state.activeAttackers * params.defenseMobilizationResponse,
    defenderWithProduction.troops * params.maxDefensiveMobilizationFraction,
  );
  const combatIntensity = clamp(
    defenderWithProduction.troops / Math.max(state.activeAttackers * 5, 1),
    0.2,
    1,
  );
  const attackerCosts = battleCosts(
    state.activeAttackers,
    combatIntensity,
    params.warUpkeepScalePer1000Troops,
    params.attackerFoodCost,
    params.attackerEnergyCost,
    params.attackerMaterialsCost,
  );
  const defenderCosts = battleCosts(
    activeDefenders,
    combatIntensity,
    params.warUpkeepScalePer1000Troops,
    params.defenderFoodCost,
    params.defenderEnergyCost,
    params.defenderMaterialsCost,
  );
  const attackerSupply = supplyMultiplier(
    attackerWithProduction,
    attackerCosts,
    params.minSupplyMultiplier,
  );
  const defenderSupply = supplyMultiplier(
    defenderWithProduction,
    defenderCosts,
    params.minSupplyMultiplier,
  );
  const attackerAfterCosts = removeResources(
    attackerWithProduction,
    attackerCosts,
  );
  const defenderAfterCosts = removeResources(
    defenderWithProduction,
    defenderCosts,
  );

  const terrain = terrainCombatProfile(params.terrain);
  const tilePressure =
    attackTilesPerTick(
      state.activeAttackers,
      defenderAfterCosts.troops,
      params.borderWidth,
    ) *
    (params.attackerSupplyTileSpeedWeight * attackerSupply +
      (1 - params.attackerSupplyTileSpeedWeight));
  const tileCost = attackTileCost(
    state.activeAttackers,
    defenderAfterCosts.troops,
    terrain.speed,
  );
  const tilesCaptured = Math.min(
    defenderAfterCosts.tiles,
    tilePressure > 0 ? Math.max(1, Math.ceil(tilePressure / tileCost)) : 0,
  );
  const defenderTroopLossPerTile =
    defenderAfterCosts.tiles <= 0
      ? 0
      : defenderAfterCosts.troops / defenderAfterCosts.tiles;
  const baseAttackerLossPerTile = attackerTroopLossPerTile(
    state.activeAttackers,
    defenderAfterCosts.troops,
    defenderTroopLossPerTile,
    terrain.magnitude,
  );
  const attackerLosses = Math.min(
    state.activeAttackers,
    baseAttackerLossPerTile *
      tilesCaptured *
      defenderSupply *
      (1 + (1 - attackerSupply) * params.supplyLossPenalty),
  );
  const defenderLosses = Math.min(
    defenderAfterCosts.troops,
    defenderTroopLossPerTile *
      tilesCaptured *
      attackerSupply *
      (1 + (1 - defenderSupply) * params.supplyLossPenalty),
  );

  const nextActiveAttackers = Math.max(
    0,
    state.activeAttackers - attackerLosses,
  );
  const nextDefenderTroops = Math.max(
    0,
    defenderAfterCosts.troops - defenderLosses,
  );
  const nextDefenderTiles = Math.max(
    0,
    defenderAfterCosts.tiles - tilesCaptured,
  );
  const nextAttackerTiles = attackerAfterCosts.tiles + tilesCaptured;
  const devastationGain = devastationDelta(
    tilesCaptured,
    state.defender.tiles,
    attackerLosses + defenderLosses,
    state.activeAttackers + defenderAfterCosts.troops,
    params,
  );
  const nextDevastation = clamp(
    state.defenderDevastation + devastationGain,
    0,
    params.maxDevastation,
  );

  if (nextActiveAttackers <= 0) {
    return {
      state: {
        attacker: {
          ...attackerAfterCosts,
          tiles: nextAttackerTiles,
        },
        defender: {
          ...defenderAfterCosts,
          troops: nextDefenderTroops,
          tiles: nextDefenderTiles,
        },
        activeAttackers: 0,
        defenderDevastation: nextDevastation,
        outcome: "attacker-defeated",
      },
      activeDefenders,
      combatIntensity,
      attackerSupply,
      defenderSupply,
      attackerCosts,
      defenderCosts,
      attackerProduced,
      defenderProduced,
      attackerLosses,
      defenderLosses,
      tilesCaptured,
      resourcesCaptured: zeroResources(),
      resourcesDestroyed: zeroResources(),
    };
  }

  if (nextDefenderTroops <= 0 || nextDefenderTiles <= 0) {
    const { captured, destroyed, remaining } = conquestResources(
      {
        food: BigInt(Math.floor(defenderAfterCosts.food)),
        energy: BigInt(Math.floor(defenderAfterCosts.energy)),
        materials: BigInt(Math.floor(defenderAfterCosts.materials)),
      },
      params,
    );
    return {
      state: {
        attacker: {
          ...addResources(attackerAfterCosts, captured),
          troops: attackerAfterCosts.troops + nextActiveAttackers,
          tiles: nextAttackerTiles + nextDefenderTiles,
        },
        defender: {
          troops: nextDefenderTroops,
          tiles: 0,
          food: Number(remaining.food),
          energy: Number(remaining.energy),
          materials: Number(remaining.materials),
        },
        activeAttackers: 0,
        defenderDevastation: params.maxDevastation,
        outcome: "defender-conquered",
      },
      activeDefenders,
      combatIntensity,
      attackerSupply,
      defenderSupply,
      attackerCosts,
      defenderCosts,
      attackerProduced,
      defenderProduced,
      attackerLosses,
      defenderLosses,
      tilesCaptured,
      resourcesCaptured: captured,
      resourcesDestroyed: destroyed,
    };
  }

  return {
    state: {
      attacker: {
        ...attackerAfterCosts,
        tiles: nextAttackerTiles,
      },
      defender: {
        ...defenderAfterCosts,
        troops: nextDefenderTroops,
        tiles: nextDefenderTiles,
      },
      activeAttackers: nextActiveAttackers,
      defenderDevastation: nextDevastation,
      outcome: "fighting",
    },
    activeDefenders,
    combatIntensity,
    attackerSupply,
    defenderSupply,
    attackerCosts,
    defenderCosts,
    attackerProduced,
    defenderProduced,
    attackerLosses,
    defenderLosses,
    tilesCaptured,
    resourcesCaptured: zeroResources(),
    resourcesDestroyed: zeroResources(),
  };
}

function productionFor(
  tiles: number,
  devastation: number,
  foodPerTile: number,
  energyPerTile: number,
  materialsPerTile: number,
): ResourceStockpile {
  const multiplier = 1 - clamp(devastation, 0, 1);
  return {
    food: BigInt(Math.floor(Math.max(0, tiles * foodPerTile * multiplier))),
    energy: BigInt(Math.floor(Math.max(0, tiles * energyPerTile * multiplier))),
    materials: BigInt(
      Math.floor(Math.max(0, tiles * materialsPerTile * multiplier)),
    ),
  };
}

function battleCosts(
  troops: number,
  intensity: number,
  scale: number,
  food: number,
  energy: number,
  materials: number,
): ResourceStockpile {
  const units = Math.max(0, troops) / 1000;
  return {
    food: BigInt(Math.ceil(units * food * scale)),
    energy: BigInt(Math.ceil(units * energy * intensity * scale)),
    materials: BigInt(Math.ceil(units * materials * intensity * scale)),
  };
}

function supplyMultiplier(
  side: WarBattleSideState,
  costs: ResourceStockpile,
  minSupply: number,
): number {
  const ratios = [
    resourceRatio(side.food, costs.food),
    resourceRatio(side.energy, costs.energy),
    resourceRatio(side.materials, costs.materials),
  ];
  return clamp(Math.min(...ratios), minSupply, 1);
}

function resourceRatio(available: number, required: bigint): number {
  const needed = Number(required);
  if (needed <= 0) {
    return 1;
  }
  return available / needed;
}

function addResources(
  side: WarBattleSideState,
  resources: ResourceStockpile,
): WarBattleSideState {
  return {
    ...side,
    food: side.food + Number(resources.food),
    energy: side.energy + Number(resources.energy),
    materials: side.materials + Number(resources.materials),
  };
}

function removeResources(
  side: WarBattleSideState,
  resources: ResourceStockpile,
): WarBattleSideState {
  return {
    ...side,
    food: Math.max(0, side.food - Number(resources.food)),
    energy: Math.max(0, side.energy - Number(resources.energy)),
    materials: Math.max(0, side.materials - Number(resources.materials)),
  };
}

function zeroResources(): ResourceStockpile {
  return {
    food: 0n,
    energy: 0n,
    materials: 0n,
  };
}

function terrainCombatProfile(terrain: TerrainProfile): {
  magnitude: number;
  speed: number;
} {
  switch (terrain) {
    case "plains":
      return { magnitude: 80, speed: 16.5 };
    case "highland":
      return { magnitude: 100, speed: 20 };
    case "mountain":
      return { magnitude: 120, speed: 25 };
  }
}

function attackTilesPerTick(
  attackTroops: number,
  defenderTroops: number,
  borderWidth: number,
): number {
  return (
    clamp(((5 * attackTroops) / Math.max(defenderTroops, 1)) * 2, 0.01, 0.5) *
    Math.max(1, borderWidth) *
    3
  );
}

function attackTileCost(
  attackTroops: number,
  defenderTroops: number,
  terrainSpeed: number,
): number {
  return (
    clamp(defenderTroops / Math.max(5 * attackTroops, 1), 0.2, 1.5) *
    terrainSpeed
  );
}

function attackerTroopLossPerTile(
  attackTroops: number,
  defenderTroops: number,
  defenderTroopLossPerTile: number,
  terrainMagnitude: number,
): number {
  const currentAttackerLoss =
    clamp(defenderTroops / Math.max(attackTroops, 1), 0.6, 2) *
    terrainMagnitude *
    0.8;
  const alternateAttackerLoss =
    1.3 * defenderTroopLossPerTile * (terrainMagnitude / 100);
  return 0.6 * currentAttackerLoss + 0.4 * alternateAttackerLoss;
}

function devastationDelta(
  tilesCaptured: number,
  defenderStartingTiles: number,
  casualties: number,
  totalTroops: number,
  params: WarBattleParams,
): number {
  const tileShare =
    defenderStartingTiles <= 0 ? 0 : tilesCaptured / defenderStartingTiles;
  const casualtyShare = totalTroops <= 0 ? 0 : casualties / totalTroops;
  return (
    tileShare * params.conqueredTileDevastation +
    casualtyShare * params.casualtyDevastation
  );
}

function recoverDevastation(
  devastation: number,
  params: WarBattleParams,
): number {
  return Math.max(0, devastation - params.devastationRecoveryPerTick);
}

function conquestResources(
  resources: ResourceStockpile,
  params: WarBattleParams,
): {
  captured: ResourceStockpile;
  destroyed: ResourceStockpile;
  remaining: ResourceStockpile;
} {
  const food = splitResource(
    resources.food,
    params.foodCaptureRatio,
    params.foodDestroyRatio,
  );
  const energy = splitResource(
    resources.energy,
    params.energyCaptureRatio,
    params.energyDestroyRatio,
  );
  const materials = splitResource(
    resources.materials,
    params.materialsCaptureRatio,
    params.materialsDestroyRatio,
  );
  return {
    captured: {
      food: food.captured,
      energy: energy.captured,
      materials: materials.captured,
    },
    destroyed: {
      food: food.destroyed,
      energy: energy.destroyed,
      materials: materials.destroyed,
    },
    remaining: {
      food: food.remaining,
      energy: energy.remaining,
      materials: materials.remaining,
    },
  };
}

function splitResource(
  value: bigint,
  captureRatio: number,
  destroyRatio: number,
): { captured: bigint; destroyed: bigint; remaining: bigint } {
  const captured = BigInt(Math.floor(Number(value) * captureRatio));
  const destroyed = BigInt(Math.floor(Number(value) * destroyRatio));
  const remaining = value - captured - destroyed;
  return {
    captured,
    destroyed,
    remaining: remaining > 0n ? remaining : 0n,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
