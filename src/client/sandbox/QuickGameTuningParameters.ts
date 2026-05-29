import type { HudSelectOption } from "../hud/ui/HudComponents";

export type ParameterPath = readonly string[];

interface BaseParameterDescriptor {
  id: string;
  group: string;
  label: string;
  description: string;
  path: ParameterPath;
}

export interface NumberParameterDescriptor extends BaseParameterDescriptor {
  type?: "number";
  min: number;
  max: number;
  step: number;
}

export interface SelectParameterDescriptor extends BaseParameterDescriptor {
  type: "select";
  options: HudSelectOption[];
}

export type ParameterDescriptor =
  | NumberParameterDescriptor
  | SelectParameterDescriptor;

export const DEFAULT_QUICK_GAME_PARAMETER_IDS = [
  "population.growthRate",
  "population.maxPerTile",
  "expansion.wildernessLoss",
  "expansion.wildernessSpeed",
] as const;

const foodConstraintModeOptions: HudSelectOption[] = [
  {
    label: "Hard minimum cap",
    value: "hard-min-cap",
  },
  {
    label: "Dynamic shortage",
    value: "dynamic-shortage",
  },
];

const difficulties = ["Easy", "Medium", "Hard", "Impossible"] as const;
const terrains = ["plains", "highland", "mountain"] as const;
const resources = ["food", "energy", "materials"] as const;

const difficultyLabels = {
  Easy: "Easy",
  Medium: "Medium",
  Hard: "Hard",
  Impossible: "Impossible",
} as const;

const terrainLabels = {
  plains: "Plains",
  highland: "Highland",
  mountain: "Mountain",
} as const;

const resourceLabels = {
  food: "Food",
  energy: "Energy",
  materials: "Materials",
} as const;

export const QUICK_GAME_PARAMETER_DESCRIPTORS: ParameterDescriptor[] = [
  {
    id: "population.growthRate",
    group: "Population",
    label: "Population growth rate",
    description: "Logistic population growth applied each tick.",
    path: ["populationResources", "populationGrowthRate"],
    min: 0,
    max: 0.08,
    step: 0.0005,
  },
  {
    id: "population.initial",
    group: "Population",
    label: "Initial population",
    description: "Starting population for new players.",
    path: ["populationResources", "initialPopulation"],
    min: 0,
    max: 150000,
    step: 1000,
  },
  {
    id: "population.maxPerTile",
    group: "Population",
    label: "Max population / tile",
    description: "Population capacity added by each owned tile.",
    path: ["populationResources", "maxPopulationPerTile"],
    min: 50,
    max: 50000,
    step: 50,
  },
  {
    id: "population.foodConstraintMode",
    group: "Population",
    label: "Food constraint mode",
    description: "How food shortage constrains population growth.",
    path: ["populationResources", "populationFoodConstraintMode"],
    type: "select",
    options: foodConstraintModeOptions,
  },
  {
    id: "food.allocationToPopulation",
    group: "Food",
    label: "Food allocation to population",
    description:
      "Share of current food production that can satisfy population demand. The rest can accumulate as surplus.",
    path: ["populationResources", "foodAllocationToPopulation"],
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    id: "food.populationConsumption",
    group: "Food",
    label: "Food / population",
    description: "Baseline food demand from total population.",
    path: ["populationResources", "foodConsumptionPerPopulation"],
    min: 0,
    max: 20,
    step: 0.1,
  },
  {
    id: "food.mobilizedConsumption",
    group: "Food",
    label: "Food / mobilized population",
    description: "Extra food demand from troops committed to attacks.",
    path: ["populationResources", "foodConsumptionPerMobilizedPopulation"],
    min: 0,
    max: 60,
    step: 0.1,
  },
  {
    id: "food.wartimeMultiplier",
    group: "Food",
    label: "Wartime food multiplier",
    description: "Multiplier applied to food demand while at war.",
    path: ["populationResources", "wartimeFoodConsumptionMultiplier"],
    min: 0,
    max: 10,
    step: 0.05,
  },
  {
    id: "nutrition.birthThreshold",
    group: "Nutrition",
    label: "Birth nutrition threshold",
    description:
      "Minimum food satisfaction needed before population can reproduce.",
    path: ["populationResources", "birthNutritionThreshold"],
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    id: "nutrition.survivalThreshold",
    group: "Nutrition",
    label: "Survival nutrition threshold",
    description:
      "Food satisfaction below this value starts applying starvation death pressure.",
    path: ["populationResources", "survivalNutritionThreshold"],
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    id: "nutrition.starvationDamage",
    group: "Nutrition",
    label: "Starvation damage",
    description:
      "How quickly nutrition health falls while population is underfed.",
    path: ["populationResources", "starvationDamageRate"],
    min: 0,
    max: 0.1,
    step: 0.001,
  },
  {
    id: "nutrition.recovery",
    group: "Nutrition",
    label: "Nutrition recovery",
    description:
      "How quickly nutrition health recovers when population is fully fed.",
    path: ["populationResources", "nutritionRecoveryRate"],
    min: 0,
    max: 0.1,
    step: 0.001,
  },
  {
    id: "nutrition.mortality",
    group: "Nutrition",
    label: "Starvation mortality",
    description:
      "Maximum per-tick death pressure once nutrition health is depleted.",
    path: ["populationResources", "starvationMortalityScale"],
    min: 0,
    max: 0.02,
    step: 0.0001,
  },
  {
    id: "food.productionPerTile",
    group: "Food Production",
    label: "Food / tile / year",
    description:
      "Annual food units produced by each owned tile before technology and arability modifiers.",
    path: ["populationResources", "foodProductionPerTile"],
    min: 0,
    max: 100000000,
    step: 1000000,
  },
  {
    id: "food.ticksPerYear",
    group: "Food Production",
    label: "Ticks / year",
    description:
      "Number of simulation ticks represented by one agricultural year.",
    path: ["populationResources", "foodTicksPerYear"],
    min: 1,
    max: 2000,
    step: 1,
  },
  {
    id: "food.technologyMultiplier",
    group: "Food Production",
    label: "Food technology x",
    description:
      "Agricultural productivity multiplier. It is clamped by config validation between 1x and 10x.",
    path: ["populationResources", "foodProductionTechnologyMultiplier"],
    min: 1,
    max: 10,
    step: 0.1,
  },
  {
    id: "resources.biomassShare",
    group: "Resources",
    label: "Baseline biomass share",
    description: "Baseline food-oriented share used by resource production.",
    path: ["populationResources", "baselineBiomassProductionShare"],
    min: 0.01,
    max: 1,
    step: 0.01,
  },
  {
    id: "resources.minCapacity",
    group: "Resources",
    label: "Minimum resource capacity",
    description: "Floor for each resource stockpile capacity.",
    path: ["populationResources", "minBaseResourceCapacity"],
    min: 0,
    max: 500000,
    step: 5000,
  },
  {
    id: "resources.capacityTerritoryDivisor",
    group: "Resources",
    label: "Capacity territory divisor",
    description: "Higher values reduce territory-driven resource capacity.",
    path: ["populationResources", "resourceCapacityTerritoryDivisor"],
    min: 0.25,
    max: 20,
    step: 0.25,
  },
  {
    id: "resources.siloCapacityIncrease",
    group: "Resources",
    label: "Silo capacity increase",
    description: "Resource capacity added per silo level.",
    path: ["populationResources", "siloResourceCapacityIncrease"],
    min: 0,
    max: 1000000,
    step: 10000,
  },
  {
    id: "resources.regenBase",
    group: "Resources",
    label: "Resource regen base",
    description: "Base passive regeneration before stockpile curve scaling.",
    path: ["populationResources", "resourceRegenBase"],
    min: 0,
    max: 250,
    step: 1,
  },
  {
    id: "resources.regenExponent",
    group: "Resources",
    label: "Resource regen exponent",
    description: "Exponent applied to current resources in the regen curve.",
    path: ["populationResources", "resourceRegenExponent"],
    min: 0.05,
    max: 2,
    step: 0.01,
  },
  {
    id: "resources.regenDivisor",
    group: "Resources",
    label: "Resource regen divisor",
    description: "Higher values reduce curve-based resource regeneration.",
    path: ["populationResources", "resourceRegenDivisor"],
    min: 0.25,
    max: 40,
    step: 0.25,
  },
  {
    id: "resources.passiveRegenMultiplier",
    group: "Resources",
    label: "Passive regen multiplier",
    description: "Multiplier applied to passive resource regeneration.",
    path: ["populationResources", "passiveResourceRegenMultiplier"],
    min: 0,
    max: 5,
    step: 0.01,
  },
  ...terrains.flatMap((terrain) =>
    resources.map((resource) => ({
      id: `terrain.${terrain}.${resource}`,
      group: "Terrain Weights",
      label: `${terrainLabels[terrain]} ${resourceLabels[resource]} weight`,
      description: `Resource production weight for ${resourceLabels[
        resource
      ].toLowerCase()} on ${terrainLabels[terrain].toLowerCase()} tiles.`,
      path: ["populationResources", "terrainWeights", terrain, resource],
      min: 0,
      max: 10,
      step: 1,
    })),
  ),
  {
    id: "bot.capacityMultiplier",
    group: "Bots",
    label: "Bot capacity multiplier",
    description: "Population and resource capacity multiplier for bots.",
    path: ["populationResources", "botCapacityMultiplier"],
    min: 0,
    max: 5,
    step: 0.05,
  },
  {
    id: "bot.troopGrowthMultiplier",
    group: "Bots",
    label: "Bot troop growth multiplier",
    description: "Population growth multiplier for bots.",
    path: ["populationResources", "botTroopGrowthMultiplier"],
    min: 0,
    max: 5,
    step: 0.05,
  },
  {
    id: "bot.resourceRegenMultiplier",
    group: "Bots",
    label: "Bot resource regen multiplier",
    description: "Resource regeneration multiplier for bots.",
    path: ["populationResources", "botResourceRegenMultiplier"],
    min: 0,
    max: 5,
    step: 0.05,
  },
  ...difficulties.flatMap((difficulty) => [
    {
      id: `nation.${difficulty}.capacity`,
      group: "Nations",
      label: `${difficultyLabels[difficulty]} capacity multiplier`,
      description: `Population and resource capacity multiplier for ${difficultyLabels[difficulty]} nations.`,
      path: ["populationResources", "nationCapacityMultipliers", difficulty],
      min: 0,
      max: 5,
      step: 0.05,
    },
    {
      id: `nation.${difficulty}.troopGrowth`,
      group: "Nations",
      label: `${difficultyLabels[difficulty]} troop growth multiplier`,
      description: `Population growth multiplier for ${difficultyLabels[difficulty]} nations.`,
      path: ["populationResources", "nationTroopGrowthMultipliers", difficulty],
      min: 0,
      max: 5,
      step: 0.05,
    },
    {
      id: `nation.${difficulty}.resourceRegen`,
      group: "Nations",
      label: `${difficultyLabels[difficulty]} resource regen multiplier`,
      description: `Resource regeneration multiplier for ${difficultyLabels[difficulty]} nations.`,
      path: [
        "populationResources",
        "nationResourceRegenMultipliers",
        difficulty,
      ],
      min: 0,
      max: 5,
      step: 0.05,
    },
  ]),
  {
    id: "expansion.humanCommit",
    group: "Expansion",
    label: "Human/nation attack commit",
    description: "Share of troops committed when humans or nations attack.",
    path: ["expansionCombat", "humanAttackTroopFraction"],
    min: 0.02,
    max: 0.8,
    step: 0.01,
  },
  {
    id: "expansion.botCommit",
    group: "Expansion",
    label: "Bot attack commit",
    description: "Share of troops committed when bots attack.",
    path: ["expansionCombat", "botAttackTroopFraction"],
    min: 0.01,
    max: 0.5,
    step: 0.01,
  },
  {
    id: "expansion.wildernessLoss",
    group: "Wilderness",
    label: "Wilderness loss multiplier",
    description: "Multiplies human/nation troop loss per wilderness tile.",
    path: ["expansionCombat", "wildernessAttackerLossMultiplier"],
    min: 0,
    max: 8,
    step: 0.05,
  },
  {
    id: "expansion.botWildernessLoss",
    group: "Wilderness",
    label: "Bot wilderness loss multiplier",
    description: "Multiplies bot troop loss per wilderness tile.",
    path: ["expansionCombat", "wildernessBotAttackerLossMultiplier"],
    min: 0,
    max: 8,
    step: 0.05,
  },
  {
    id: "expansion.wildernessSpeed",
    group: "Wilderness",
    label: "Wilderness speed",
    description: "Adjacent wilderness tiles considered per tick.",
    path: ["expansionCombat", "wildernessTilesPerTickMultiplier"],
    min: 0.1,
    max: 8,
    step: 0.1,
  },
];
