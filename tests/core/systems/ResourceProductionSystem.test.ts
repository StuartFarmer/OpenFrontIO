import { describe, expect, test } from "vitest";
import {
  DEFAULT_MECHANICS_CONFIG,
  resolveMechanicsConfig,
} from "../../../src/core/configuration/MechanicsConfig";
import { PlayerInfo, PlayerType, UnitType } from "../../../src/core/game/Game";
import { createZeroResources } from "../../../src/core/game/Resources";
import {
  evaluateResourceCapacity,
  evaluateResourceProductionSystem,
} from "../../../src/games/openfront/systems/models/ResourceProductionSystem";
import {
  evaluatePlayerResourceProduction,
  terrainResourceProductionSplit,
} from "../../../src/games/openfront/systems/PlayerEconomyAdapter";
import { setup } from "../../util/Setup";

describe("ResourceProductionSystem StockFlow compatibility boundary", () => {
  test("matches current resource capacity from territory and silos", async () => {
    const game = await setup("plains", { instantBuild: true }, [
      new PlayerInfo("player", PlayerType.Human, null, "player_id"),
    ]);
    const player = game.player("player_id");
    const tile = game.ref(0, 0);
    player.conquer(tile);
    player.buildUnit(UnitType.Silo, tile, {});
    const mechanics = DEFAULT_MECHANICS_CONFIG.populationResources;

    const capacity = evaluateResourceCapacity(
      mechanics,
      player.numTilesOwned(),
      1,
      1,
    );

    expect(capacity).toEqual(game.config().maxResources(player));
  });

  test("matches terrain-weighted passive resource production", async () => {
    const game = await setup("plains", { instantBuild: true }, [
      new PlayerInfo("player", PlayerType.Human, null, "player_id"),
    ]);
    const player = game.player("player_id");
    player.conquer(game.ref(0, 0));
    const highland = game.ref(1, 0);
    game.setMagnitude(highland, 15);
    player.conquer(highland);

    const delta = evaluatePlayerResourceProduction(game, player, {
      mechanics: DEFAULT_MECHANICS_CONFIG.populationResources,
      difficulty: game.config().gameConfig().difficulty,
    });

    expect(delta).toEqual(game.config().resourceIncreaseRate(game, player));
  });

  test("matches capacity clamping near resource cap", async () => {
    const game = await setup("plains", { instantBuild: true }, [
      new PlayerInfo("player", PlayerType.Human, null, "player_id"),
    ]);
    const player = game.player("player_id");
    player.conquer(game.ref(0, 0));
    const capacity = game.config().maxResources(player);
    const resources = {
      food: capacity.food - 1n,
      energy: capacity.energy - 100n,
      materials: capacity.materials - 1_000n,
    };

    const result = evaluateResourceProductionSystem(
      DEFAULT_MECHANICS_CONFIG.populationResources,
      {
        resources,
        tilesOwned: player.numTilesOwned(),
        siloLevels: 0,
        capacityMultiplier: 1,
        regenMultiplier: 1,
        terrainWeights: terrainResourceProductionSplit(
          game,
          player,
          DEFAULT_MECHANICS_CONFIG.populationResources,
        ),
      },
    );

    expect(result.delta.food).toBeLessThanOrEqual(1n);
    expect(resources.food + result.delta.food).toBeLessThanOrEqual(
      capacity.food,
    );
    expect(resources.energy + result.delta.energy).toBeLessThanOrEqual(
      capacity.energy,
    );
    expect(resources.materials + result.delta.materials).toBeLessThanOrEqual(
      capacity.materials,
    );
  });

  test("supports custom terrain mechanics", async () => {
    const game = await setup("plains", { instantBuild: true }, [
      new PlayerInfo("player", PlayerType.Human, null, "player_id"),
    ]);
    const player = game.player("player_id");
    player.conquer(game.ref(0, 0));
    const mechanics = resolveMechanicsConfig({
      populationResources: {
        terrainWeights: {
          plains: {
            food: 4,
            energy: 0,
            materials: 0,
          },
        },
      },
    }).populationResources;

    const result = evaluateResourceProductionSystem(mechanics, {
      resources: createZeroResources(),
      tilesOwned: player.numTilesOwned(),
      siloLevels: 0,
      capacityMultiplier: 1,
      regenMultiplier: 1,
      terrainWeights: terrainResourceProductionSplit(game, player, mechanics),
    });

    expect(result.delta.food).toBeGreaterThan(0n);
    expect(result.delta.energy).toBe(0n);
    expect(result.delta.materials).toBe(0n);
  });
});
