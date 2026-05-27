import { describe, expect, test } from "vitest";
import {
  createWarBattleState,
  DEFAULT_WAR_BATTLE_PARAMS,
  evaluateWarBattleTick,
  startWarBattleAttack,
} from "../../../src/core/systems/models/WarBattleSystem";

describe("WarBattleSystem", () => {
  test("mobilizes attackers from home troops into an active attack", () => {
    const state = createWarBattleState(
      side({ troops: 10_000 }),
      side({ troops: 8_000 }),
    );

    const fighting = startWarBattleAttack(state, 3_000);

    expect(fighting.attacker.troops).toBe(7_000);
    expect(fighting.activeAttackers).toBe(3_000);
    expect(fighting.outcome).toBe("fighting");
  });

  test("consumes resources and grinds defender territory during battle", () => {
    const state = startWarBattleAttack(
      createWarBattleState(
        side({ troops: 12_000, food: 5_000, energy: 5_000, materials: 5_000 }),
        side({
          troops: 8_000,
          food: 5_000,
          energy: 5_000,
          materials: 5_000,
          tiles: 500,
        }),
      ),
      4_000,
    );

    const result = evaluateWarBattleTick(state, {
      ...DEFAULT_WAR_BATTLE_PARAMS,
      attackerFoodProductionPerTile: 0,
      attackerEnergyProductionPerTile: 0,
      attackerMaterialsProductionPerTile: 0,
      defenderFoodProductionPerTile: 0,
      defenderEnergyProductionPerTile: 0,
      defenderMaterialsProductionPerTile: 0,
    });

    expect(result.state.outcome).toBe("fighting");
    expect(result.tilesCaptured).toBeGreaterThan(0);
    expect(result.attackerCosts.food).toBeGreaterThan(0n);
    expect(result.defenderCosts.materials).toBeGreaterThan(0n);
    expect(result.state.attacker.food).toBeLessThan(5_000);
    expect(result.state.defender.tiles).toBeLessThan(500);
    expect(result.state.defenderDevastation).toBeGreaterThan(0);
  });

  test("low resources reduce supply below full effectiveness", () => {
    const state = startWarBattleAttack(
      createWarBattleState(
        side({ troops: 10_000, food: 0, energy: 0, materials: 0 }),
        side({ troops: 8_000, food: 0, energy: 0, materials: 0 }),
      ),
      5_000,
    );

    const result = evaluateWarBattleTick(state, {
      ...DEFAULT_WAR_BATTLE_PARAMS,
      attackerFoodProductionPerTile: 0,
      attackerEnergyProductionPerTile: 0,
      attackerMaterialsProductionPerTile: 0,
      defenderFoodProductionPerTile: 0,
      defenderEnergyProductionPerTile: 0,
      defenderMaterialsProductionPerTile: 0,
    });

    expect(result.attackerSupply).toBe(
      DEFAULT_WAR_BATTLE_PARAMS.minSupplyMultiplier,
    );
    expect(result.defenderSupply).toBe(
      DEFAULT_WAR_BATTLE_PARAMS.minSupplyMultiplier,
    );
  });

  test("conquest captures and destroys defender resources", () => {
    const state = startWarBattleAttack(
      createWarBattleState(
        side({
          troops: 100_000,
          food: 10_000,
          energy: 10_000,
          materials: 10_000,
        }),
        side({
          troops: 1_000,
          food: 10_000,
          energy: 10_000,
          materials: 10_000,
          tiles: 1,
        }),
      ),
      40_000,
    );

    const result = evaluateWarBattleTick(state, {
      ...DEFAULT_WAR_BATTLE_PARAMS,
      borderWidth: 50,
    });

    expect(result.state.outcome).toBe("defender-conquered");
    expect(result.resourcesCaptured.food).toBeGreaterThan(0n);
    expect(result.resourcesDestroyed.energy).toBeGreaterThan(0n);
    expect(result.state.activeAttackers).toBe(0);
    expect(result.state.attacker.troops).toBeGreaterThan(60_000);
  });
});

function side(
  overrides: Partial<{
    troops: number;
    food: number;
    energy: number;
    materials: number;
    tiles: number;
  }> = {},
) {
  return {
    troops: 10_000,
    food: 1_000,
    energy: 1_000,
    materials: 1_000,
    tiles: 250,
    ...overrides,
  };
}
