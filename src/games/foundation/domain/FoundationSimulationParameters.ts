import {
  DEFAULT_FOUNDATION_FOOD_PARAMETERS,
  FoundationFoodParameters,
  normalizeFoundationFoodParameters,
} from "./FoundationFood";
import {
  DEFAULT_FOUNDATION_TROOP_PARAMETERS,
  FoundationTroopParameters,
  normalizeFoundationTroopParameters,
} from "./FoundationTroops";
import {
  DEFAULT_FOUNDATION_WILDERNESS_PARAMETERS,
  FoundationWildernessParameters,
  normalizeFoundationWildernessParameters,
} from "./FoundationWildernessParameters";
import {
  DEFAULT_FOUNDATION_PLACEMENT_PARAMETERS,
  FoundationPlacementParameters,
  normalizeFoundationPlacementParameters,
} from "./placePlayer";

export interface FoundationSimulationParameters
  extends
    FoundationFoodParameters,
    FoundationWildernessParameters,
    FoundationTroopParameters,
    FoundationPlacementParameters {}

export const DEFAULT_FOUNDATION_SIMULATION_PARAMETERS: FoundationSimulationParameters =
  {
    ...DEFAULT_FOUNDATION_FOOD_PARAMETERS,
    ...DEFAULT_FOUNDATION_WILDERNESS_PARAMETERS,
    ...DEFAULT_FOUNDATION_TROOP_PARAMETERS,
    ...DEFAULT_FOUNDATION_PLACEMENT_PARAMETERS,
  };

export function normalizeFoundationSimulationParameters(
  parameters: Partial<FoundationSimulationParameters> = {},
): FoundationSimulationParameters {
  return {
    ...normalizeFoundationFoodParameters(parameters),
    ...normalizeFoundationWildernessParameters(parameters),
    ...normalizeFoundationTroopParameters(parameters),
    ...normalizeFoundationPlacementParameters(parameters),
  };
}
