import type { MechanicsConfig } from "../../core/configuration/MechanicsConfig";

export interface ParameterDescriptor {
  id: string;
  group: string;
  label: string;
  description: string;
  path: readonly [keyof MechanicsConfig, string];
  min: number;
  max: number;
  step: number;
}

export const DEFAULT_QUICK_GAME_PARAMETER_IDS = [
  "population.growthRate",
  "population.maxPerTile",
  "expansion.wildernessLoss",
  "expansion.wildernessSpeed",
] as const;

export const QUICK_GAME_PARAMETER_DESCRIPTORS: ParameterDescriptor[] = [
  {
    id: "population.growthRate",
    group: "Population",
    label: "Population growth rate",
    description: "Lower this if regeneration outpaces expansion attrition.",
    path: ["populationResources", "populationGrowthRate"],
    min: 0,
    max: 0.08,
    step: 0.0005,
  },
  {
    id: "population.maxPerTile",
    group: "Population",
    label: "Max population / tile",
    description: "Lower this if each captured tile adds too much capacity.",
    path: ["populationResources", "maxPopulationPerTile"],
    min: 1000,
    max: 200000,
    step: 1000,
  },
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
  {
    id: "food.populationConsumption",
    group: "Food",
    label: "Food / population",
    description: "Baseline food demand from total population.",
    path: ["populationResources", "foodConsumptionPerPopulation"],
    min: 0,
    max: 0.1,
    step: 0.0005,
  },
  {
    id: "food.mobilizedConsumption",
    group: "Food",
    label: "Food / mobilized population",
    description: "Extra food demand from troops committed to attacks.",
    path: ["populationResources", "foodConsumptionPerMobilizedPopulation"],
    min: 0,
    max: 0.5,
    step: 0.001,
  },
  {
    id: "food.wartimeMultiplier",
    group: "Food",
    label: "Wartime food multiplier",
    description: "Multiplier applied to wartime food demand.",
    path: ["populationResources", "wartimeFoodConsumptionMultiplier"],
    min: 0,
    max: 10,
    step: 0.05,
  },
  {
    id: "food.shortageBirthPenalty",
    group: "Food",
    label: "Shortage birth penalty",
    description: "How strongly food shortage suppresses births.",
    path: ["populationResources", "foodShortageBirthPenalty"],
    min: 0,
    max: 10,
    step: 0.05,
  },
  {
    id: "food.famineDeathRate",
    group: "Food",
    label: "Famine death rate",
    description: "Deaths per tick at full food shortage.",
    path: ["populationResources", "famineDeathRate"],
    min: 0,
    max: 0.2,
    step: 0.001,
  },
];
