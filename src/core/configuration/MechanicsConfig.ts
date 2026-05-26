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

export type PopulationResourceMechanicsConfig = {
  troopLogisticGrowthRate: number;
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
};

const finiteNonNegative = z.number().finite().min(0);
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
  troopLogisticGrowthRate: finiteNonNegative.optional(),
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

export const MechanicsConfigSchema = z.object({
  version: z.literal(1).optional(),
  populationResources: PopulationResourceMechanicsConfigSchema.optional(),
});

export type MechanicsConfigInput = z.infer<typeof MechanicsConfigSchema>;

export const DEFAULT_MECHANICS_CONFIG: MechanicsConfig = {
  version: 1,
  populationResources: {
    troopLogisticGrowthRate: 0.016,
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
};

export function resolveMechanicsConfig(
  input: MechanicsConfigInput | null | undefined,
): MechanicsConfig {
  const populationResources = input?.populationResources;
  const defaults = DEFAULT_MECHANICS_CONFIG.populationResources;

  return {
    version: 1,
    populationResources: {
      ...defaults,
      ...populationResources,
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
  };
}
