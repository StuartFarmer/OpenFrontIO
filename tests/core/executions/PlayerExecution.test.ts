import { PlayerExecution } from "../../../src/core/execution/PlayerExecution";
import {
  Game,
  Player,
  PlayerInfo,
  PlayerType,
  UnitType,
} from "../../../src/core/game/Game";
import { setup } from "../../util/Setup";
import { executeTicks } from "../../util/utils";

let game: Game;
let player: Player;
let otherPlayer: Player;

describe("PlayerExecution", () => {
  beforeEach(async () => {
    game = await setup(
      "big_plains",
      { infiniteGold: true, instantBuild: true },
      [
        new PlayerInfo("player", PlayerType.Human, "client_id1", "player_id"),
        new PlayerInfo("other", PlayerType.Human, "client_id2", "other_id"),
      ],
    );

    player = game.player("player_id");
    otherPlayer = game.player("other_id");

    game.addExecution(new PlayerExecution(player));
    game.addExecution(new PlayerExecution(otherPlayer));
  });

  test("passive income adds an equal resource payload without accumulating gold", () => {
    player.conquer(game.ref(50, 50));
    const expectedResources = game.config().resourceIncreaseRate(player);

    executeTicks(game, 2);

    expect(player.resources()).toEqual(expectedResources);
    expect(player.gold()).toBe(0n);
  });

  test("passive resource regen clamps each resource to capacity", () => {
    player.conquer(game.ref(50, 50));
    const capacity = game.config().maxResources(player);
    player.addResources(
      {
        food: capacity.food - 1n,
        energy: capacity.energy - 100n,
        materials: capacity.materials - 1_000n,
      },
      undefined,
      { updateGold: false },
    );

    executeTicks(game, 2);

    const resources = player.resources();
    expect(resources.food).toBe(capacity.food);
    expect(resources.energy).toBeLessThanOrEqual(capacity.energy);
    expect(resources.materials).toBeLessThanOrEqual(capacity.materials);
    expect(resources.energy).toBeGreaterThan(capacity.energy - 100n);
    expect(resources.materials).toBeGreaterThan(capacity.materials - 1_000n);
  });

  test("passive resource regen does not increase over-cap resources", () => {
    player.conquer(game.ref(50, 50));
    const capacity = game.config().maxResources(player);
    const overCap = {
      food: capacity.food + 10n,
      energy: capacity.energy + 20n,
      materials: capacity.materials + 30n,
    };
    player.addResources(overCap, undefined, { updateGold: false });

    executeTicks(game, 2);

    expect(player.resources()).toEqual(overCap);
    expect(player.gold()).toBe(0n);
  });

  test("DefensePost lv. 1 is destroyed when tile owner changes", () => {
    const tile = game.ref(50, 50);
    player.conquer(tile);
    const defensePost = player.buildUnit(UnitType.DefensePost, tile, {});

    game.executeNextTick();
    expect(game.unitCount(UnitType.DefensePost)).toBe(1);
    expect(defensePost.level()).toBe(1);

    otherPlayer.conquer(tile);
    executeTicks(game, 2);

    expect(game.unitCount(UnitType.DefensePost)).toBe(0);
  });

  test("DefensePost lv. 2+ is downgraded when tile owner changes", () => {
    const tile = game.ref(50, 50);
    player.conquer(tile);
    const defensePost = player.buildUnit(UnitType.DefensePost, tile, {});
    defensePost.increaseLevel();

    expect(defensePost.level()).toBe(2);
    expect(game.unitCount(UnitType.DefensePost)).toBe(2); // unitCount sums levels
    expect(player.units(UnitType.DefensePost)).toHaveLength(1);
    expect(defensePost.isActive()).toBe(true);

    otherPlayer.conquer(tile);
    executeTicks(game, 2);

    expect(defensePost.level()).toBe(1);
    expect(game.unitCount(UnitType.DefensePost)).toBe(1);
    expect(otherPlayer.units(UnitType.DefensePost)).toHaveLength(1);
    expect(defensePost.owner()).toBe(otherPlayer);
    expect(defensePost.isActive()).toBe(true);
  });

  test("Non-DefensePost structures are transferred (not downgraded) when tile owner changes", () => {
    const tile = game.ref(50, 50);
    player.conquer(tile);
    const city = player.buildUnit(UnitType.City, tile, {});

    expect(game.unitCount(UnitType.City)).toBe(1);
    expect(city.level()).toBe(1);
    expect(city.owner()).toBe(player);
    expect(city.isActive()).toBe(true);

    otherPlayer.conquer(tile);
    executeTicks(game, 2);

    expect(game.unitCount(UnitType.City)).toBe(1);
    expect(city.level()).toBe(1);
    expect(city.owner()).toBe(otherPlayer);
    expect(city.isActive()).toBe(true);
  });
});
