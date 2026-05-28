import { z } from "zod";

export type ResourceWeightConfig = {
  food: number;
  energy: number;
  materials: number;
};

export type DifficultyMultiplierConfig = {
  Easy: number;
  Medium: number;
  Hard: number;
  Impossible: number;
};

export type TerrainResourceWeightsConfig = {
  plains: ResourceWeightConfig;
  highland: ResourceWeightConfig;
  mountain: ResourceWeightConfig;
};

export type PopulationFoodConstraintMode = "dynamic-shortage" | "hard-min-cap";

export type PopulationResourceMechanicsConfig = {
  populationGrowthRate: number;
  initialPopulation: number;
  maxPopulationPerTile: number;
  populationFoodConstraintMode: PopulationFoodConstraintMode;
  foodAllocationToPopulation: number;
  foodConsumptionPerPopulation: number;
  foodConsumptionPerMobilizedPopulation: number;
  wartimeFoodConsumptionMultiplier: number;
  foodShortageBirthPenalty: number;
  famineDeathRate: number;
  baselineBiomassProductionShare: number;
  minBaseResourceCapacity: number;
  resourceCapacityTerritoryDivisor: number;
  siloResourceCapacityIncrease: number;
  resourceRegenBase: number;
  resourceRegenExponent: number;
  resourceRegenDivisor: number;
  passiveResourceRegenMultiplier: number;
  terrainWeights: TerrainResourceWeightsConfig;
  botCapacityMultiplier: number;
  botTroopGrowthMultiplier: number;
  botResourceRegenMultiplier: number;
  nationCapacityMultipliers: DifficultyMultiplierConfig;
  nationTroopGrowthMultipliers: DifficultyMultiplierConfig;
  nationResourceRegenMultipliers: DifficultyMultiplierConfig;
};

export type MechanicsConfig = {
  version: 1;
  populationResources: PopulationResourceMechanicsConfig;
  expansionCombat: ExpansionCombatMechanicsConfig;
};

export type ExpansionCombatMechanicsConfig = {
  humanAttackTroopFraction: number;
  botAttackTroopFraction: number;
  wildernessAttackerLossMultiplier: number;
  wildernessBotAttackerLossMultiplier: number;
  wildernessTilesPerTickMultiplier: number;
};

const finiteNonNegative = z.number().finite().min(0);
const finiteUnit = z.number().finite().min(0).max(1);
const finitePositive = z.number().finite().positive();
const finiteNonNegativeInteger = z.number().int().finite().min(0);

const ResourceWeightConfigSchema = z.object({
  food: finiteNonNegativeInteger.optional(),
  energy: finiteNonNegativeInteger.optional(),
  materials: finiteNonNegativeInteger.optional(),
});

const DifficultyMultiplierConfigSchema = z.object({
  Easy: finiteNonNegative.optional(),
  Medium: finiteNonNegative.optional(),
  Hard: finiteNonNegative.optional(),
  Impossible: finiteNonNegative.optional(),
});

const TerrainResourceWeightsConfigSchema = z.object({
  plains: ResourceWeightConfigSchema.optional(),
  highland: ResourceWeightConfigSchema.optional(),
  mountain: ResourceWeightConfigSchema.optional(),
});

const PopulationResourceMechanicsConfigSchema = z.object({
  populationGrowthRate: z.number().finite().min(0).max(1).optional(),
  initialPopulation: finiteNonNegativeInteger.optional(),
  maxPopulationPerTile: finiteNonNegativeInteger.optional(),
  populationFoodConstraintMode: z
    .enum(["dynamic-shortage", "hard-min-cap"])
    .optional(),
  foodAllocationToPopulation: finiteUnit.optional(),
  foodConsumptionPerPopulation: finiteNonNegative.optional(),
  foodConsumptionPerMobilizedPopulation: finiteNonNegative.optional(),
  wartimeFoodConsumptionMultiplier: finiteNonNegative.optional(),
  foodShortageBirthPenalty: finiteNonNegative.optional(),
  famineDeathRate: finiteNonNegative.optional(),
  // Legacy aliases accepted so older sandbox JSON/localStorage can migrate.
  troopLogisticGrowthRate: finiteNonNegative.optional(),
  maxPopulationBase: finiteNonNegative.optional(),
  maxPopulationTilesScale: finiteNonNegative.optional(),
  maxPopulationTilesExponent: finitePositive.optional(),
  cityMaxPopulationIncrease: finiteNonNegative.optional(),
  populationCarryingCapacityBase: finiteNonNegative.optional(),
  populationCarryingCapacityTerritoryScale: finiteNonNegative.optional(),
  populationCarryingCapacityTerritoryExponent: finitePositive.optional(),
  cityPopulationCapacityIncrease: finiteNonNegative.optional(),
  troopCapacityBase: finiteNonNegative.optional(),
  troopCapacityTerritoryScale: finiteNonNegative.optional(),
  troopCapacityTerritoryExponent: finitePositive.optional(),
  cityTroopCapacityIncrease: finiteNonNegative.optional(),
  baselineBiomassProductionShare: finitePositive.optional(),
  minBaseResourceCapacity: finiteNonNegativeInteger.optional(),
  resourceCapacityTerritoryDivisor: finitePositive.optional(),
  siloResourceCapacityIncrease: finiteNonNegativeInteger.optional(),
  resourceRegenBase: finiteNonNegative.optional(),
  resourceRegenExponent: finitePositive.optional(),
  resourceRegenDivisor: finitePositive.optional(),
  passiveResourceRegenMultiplier: finiteNonNegative.optional(),
  terrainWeights: TerrainResourceWeightsConfigSchema.optional(),
  botCapacityMultiplier: finiteNonNegative.optional(),
  botTroopGrowthMultiplier: finiteNonNegative.optional(),
  botResourceRegenMultiplier: finiteNonNegative.optional(),
  nationCapacityMultipliers: DifficultyMultiplierConfigSchema.optional(),
  nationTroopGrowthMultipliers: DifficultyMultiplierConfigSchema.optional(),
  nationResourceRegenMultipliers: DifficultyMultiplierConfigSchema.optional(),
});

const ExpansionCombatMechanicsConfigSchema = z.object({
  humanAttackTroopFraction: finiteUnit.optional(),
  botAttackTroopFraction: finiteUnit.optional(),
  wildernessAttackerLossMultiplier: finiteNonNegative.optional(),
  wildernessBotAttackerLossMultiplier: finiteNonNegative.optional(),
  wildernessTilesPerTickMultiplier: finiteNonNegative.optional(),
});

export const MechanicsConfigSchema = z.object({
  version: z.literal(1).optional(),
  populationResources: PopulationResourceMechanicsConfigSchema.optional(),
  expansionCombat: ExpansionCombatMechanicsConfigSchema.optional(),
});

export type MechanicsConfigInput = z.infer<typeof MechanicsConfigSchema>;

export const DEFAULT_MECHANICS_CONFIG: MechanicsConfig = {
  version: 1,
  populationResources: {
    populationGrowthRate: 0.016,
    initialPopulation: 25_000,
    maxPopulationPerTile: 100_000,
    populationFoodConstraintMode: "hard-min-cap",
    foodAllocationToPopulation: 1,
    foodConsumptionPerPopulation: 0,
    foodConsumptionPerMobilizedPopulation: 0,
    wartimeFoodConsumptionMultiplier: 1,
    foodShortageBirthPenalty: 1,
    famineDeathRate: 0,
    baselineBiomassProductionShare: 0.25,
    minBaseResourceCapacity: 75_000,
    resourceCapacityTerritoryDivisor: 3,
    siloResourceCapacityIncrease: 250_000,
    resourceRegenBase: 10,
    resourceRegenExponent: 0.73,
    resourceRegenDivisor: 4,
    passiveResourceRegenMultiplier: 1 / 3,
    terrainWeights: {
      plains: {
        food: 1,
        energy: 2,
        materials: 1,
      },
      highland: {
        food: 2,
        energy: 1,
        materials: 1,
      },
      mountain: {
        food: 1,
        energy: 1,
        materials: 2,
      },
    },
    botCapacityMultiplier: 1 / 3,
    botTroopGrowthMultiplier: 0.5,
    botResourceRegenMultiplier: 0.5,
    nationCapacityMultipliers: {
      Easy: 0.5,
      Medium: 0.75,
      Hard: 1,
      Impossible: 1.25,
    },
    nationTroopGrowthMultipliers: {
      Easy: 0.9,
      Medium: 0.95,
      Hard: 1,
      Impossible: 1.05,
    },
    nationResourceRegenMultipliers: {
      Easy: 0.9,
      Medium: 0.95,
      Hard: 1,
      Impossible: 1.05,
    },
  },
  expansionCombat: {
    humanAttackTroopFraction: 1 / 5,
    botAttackTroopFraction: 1 / 20,
    wildernessAttackerLossMultiplier: 1,
    wildernessBotAttackerLossMultiplier: 1,
    wildernessTilesPerTickMultiplier: 2,
  },
};

export function resolveMechanicsConfig(
  input: MechanicsConfigInput | null | undefined,
): MechanicsConfig {
  const populationResources = input?.populationResources;
  const legacyPopulationResources = populationResources as
    | (typeof populationResources & {
        troopLogisticGrowthRate?: number;
        maxPopulationBase?: number;
        maxPopulationTilesScale?: number;
        maxPopulationTilesExponent?: number;
        cityMaxPopulationIncrease?: number;
        troopCapacityBase?: number;
        troopCapacityTerritoryScale?: number;
        troopCapacityTerritoryExponent?: number;
        cityTroopCapacityIncrease?: number;
        populationCarryingCapacityBase?: number;
        populationCarryingCapacityTerritoryScale?: number;
        populationCarryingCapacityTerritoryExponent?: number;
        cityPopulationCapacityIncrease?: number;
      })
    | undefined;
  const {
    troopLogisticGrowthRate: _legacyTroopLogisticGrowthRate,
    maxPopulationBase: _legacyMaxPopulationBase,
    maxPopulationTilesScale: _legacyMaxPopulationTilesScale,
    maxPopulationTilesExponent: _legacyMaxPopulationTilesExponent,
    cityMaxPopulationIncrease: _legacyCityMaxPopulationIncrease,
    troopCapacityBase: _legacyTroopCapacityBase,
    troopCapacityTerritoryScale: _legacyTroopCapacityTerritoryScale,
    troopCapacityTerritoryExponent: _legacyTroopCapacityTerritoryExponent,
    cityTroopCapacityIncrease: _legacyCityTroopCapacityIncrease,
    populationCarryingCapacityBase: _legacyPopulationCarryingCapacityBase,
    populationCarryingCapacityTerritoryScale:
      _legacyPopulationCarryingCapacityTerritoryScale,
    populationCarryingCapacityTerritoryExponent:
      _legacyPopulationCarryingCapacityTerritoryExponent,
    cityPopulationCapacityIncrease: _legacyCityPopulationCapacityIncrease,
    ...populationResourcesWithoutLegacyAliases
  } = legacyPopulationResources ?? {};
  const defaults = DEFAULT_MECHANICS_CONFIG.populationResources;
  const expansionDefaults = DEFAULT_MECHANICS_CONFIG.expansionCombat;

  return {
    version: 1,
    populationResources: {
      ...defaults,
      ...populationResourcesWithoutLegacyAliases,
      populationGrowthRate:
        populationResources?.populationGrowthRate ??
        legacyPopulationResources?.troopLogisticGrowthRate ??
        defaults.populationGrowthRate,
      initialPopulation:
        populationResources?.initialPopulation ?? defaults.initialPopulation,
      maxPopulationPerTile:
        populationResources?.maxPopulationPerTile ??
        legacyPopulationResources?.maxPopulationTilesScale ??
        legacyPopulationResources?.populationCarryingCapacityTerritoryScale ??
        legacyPopulationResources?.troopCapacityTerritoryScale ??
        defaults.maxPopulationPerTile,
      terrainWeights: {
        plains: {
          ...defaults.terrainWeights.plains,
          ...populationResources?.terrainWeights?.plains,
        },
        highland: {
          ...defaults.terrainWeights.highland,
          ...populationResources?.terrainWeights?.highland,
        },
        mountain: {
          ...defaults.terrainWeights.mountain,
          ...populationResources?.terrainWeights?.mountain,
        },
      },
      nationCapacityMultipliers: {
        ...defaults.nationCapacityMultipliers,
        ...populationResources?.nationCapacityMultipliers,
      },
      nationTroopGrowthMultipliers: {
        ...defaults.nationTroopGrowthMultipliers,
        ...populationResources?.nationTroopGrowthMultipliers,
      },
      nationResourceRegenMultipliers: {
        ...defaults.nationResourceRegenMultipliers,
        ...populationResources?.nationResourceRegenMultipliers,
      },
    },
    expansionCombat: {
      ...expansionDefaults,
      ...input?.expansionCombat,
    },
  };
}
