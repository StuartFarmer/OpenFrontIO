import {
  Game,
  Player,
  PlayerInfo,
  PlayerType,
  UnitType,
} from "../src/core/game/Game";
import { setup } from "./util/Setup";

let game: Game;
let player: Player;
let other: Player;

describe("PlayerImpl", () => {
  beforeEach(async () => {
    game = await setup("plains", { instantBuild: true }, [
      new PlayerInfo("player", PlayerType.Human, null, "player_id"),
      new PlayerInfo("other", PlayerType.Human, null, "other_id"),
    ]);

    player = game.player("player_id");
    other = game.player("other_id");

    player.conquer(game.ref(0, 0));
    other.conquer(game.ref(50, 50));
    player.addGold(BigInt(1000000));

    game.config().structureMinDist = () => 10;
  });

  test("resources initialize from starting gold", async () => {
    const startingGoldGame = await setup("plains", { startingGold: 1234 }, [
      new PlayerInfo("rich", PlayerType.Human, null, "rich_id"),
    ]);

    expect(startingGoldGame.player("rich_id").resources()).toEqual({
      food: 1234n,
      energy: 1234n,
      materials: 1234n,
    });
  });

  test("addResources updates all resources and compatibility gold", () => {
    const before = player.gold();

    player.addResources({
      food: 100n,
      energy: 100n,
      materials: 100n,
    });

    expect(player.resources()).toEqual({
      food: before + 100n,
      energy: before + 100n,
      materials: before + 100n,
    });
    expect(player.gold()).toBe(before + 100n);
  });

  test("addResources can update stockpiles without compatibility gold", () => {
    const before = player.gold();

    player.addResources(
      {
        food: 100n,
        energy: 100n,
        materials: 100n,
      },
      undefined,
      { updateGold: false },
    );

    expect(player.resources()).toEqual({
      food: before + 100n,
      energy: before + 100n,
      materials: before + 100n,
    });
    expect(player.gold()).toBe(before);
  });

  test("removeResources removes without underflowing resource stockpiles", () => {
    const removed = player.removeResources({
      food: 2_000_000n,
      energy: 2_000_000n,
      materials: 2_000_000n,
    });

    expect(removed).toEqual({
      food: 1_000_000n,
      energy: 1_000_000n,
      materials: 1_000_000n,
    });
    expect(player.resources()).toEqual({
      food: 0n,
      energy: 0n,
      materials: 0n,
    });
    expect(player.gold()).toBe(0n);
  });

  test("removeResources can spend non-uniform resources without touching gold", () => {
    const beforeGold = player.gold();
    const removed = player.removeResources(
      {
        food: 100n,
        energy: 200n,
        materials: 300n,
      },
      { updateGold: false },
    );

    expect(removed).toEqual({
      food: 100n,
      energy: 200n,
      materials: 300n,
    });
    expect(player.resources()).toEqual({
      food: 999_900n,
      energy: 999_800n,
      materials: 999_700n,
    });
    expect(player.gold()).toBe(beforeGold);
  });

  test("canAffordResources checks each resource", () => {
    expect(
      player.canAffordResources({
        food: 1_000_000n,
        energy: 1_000_000n,
        materials: 1_000_000n,
      }),
    ).toBe(true);

    expect(
      player.canAffordResources({
        food: 1n,
        energy: 1_000_001n,
        materials: 1n,
      }),
    ).toBe(false);
  });

  test("gold compatibility wrappers update resources", () => {
    player.addGold(50n);
    expect(player.resources()).toEqual({
      food: 1_000_050n,
      energy: 1_000_050n,
      materials: 1_000_050n,
    });

    expect(player.removeGold(25n)).toBe(25n);
    expect(player.resources()).toEqual({
      food: 1_000_025n,
      energy: 1_000_025n,
      materials: 1_000_025n,
    });
  });

  test("non-uniform resource mutations are unsupported while gold compatibility is active", () => {
    expect(() =>
      player.addResources({
        food: 10n,
        energy: 5n,
        materials: 10n,
      }),
    ).toThrow("Non-uniform resource payloads are not supported");
  });

  test("City can be upgraded", () => {
    const city = player.buildUnit(UnitType.City, game.ref(0, 0), {});
    const buCity = player
      .buildableUnits(game.ref(0, 0))
      .find((bu) => bu.type === UnitType.City);
    expect(buCity).toBeDefined();
    expect(buCity!.canUpgrade).toBe(city.id());
  });

  test("DefensePost cannot be upgraded", () => {
    player.buildUnit(UnitType.DefensePost, game.ref(0, 0), {});
    const buDefensePost = player
      .buildableUnits(game.ref(0, 0))
      .find((bu) => bu.type === UnitType.DefensePost);
    expect(buDefensePost).toBeDefined();
    expect(buDefensePost!.canUpgrade).toBeFalsy();
  });

  test("City can be upgraded from another city", () => {
    const city = player.buildUnit(UnitType.City, game.ref(0, 0), {});
    const cityToUpgrade = player.findUnitToUpgrade(
      UnitType.City,
      game.ref(0, 1),
    );
    expect(cityToUpgrade).toBeTruthy();
    if (cityToUpgrade === false) {
      return;
    }
    expect(cityToUpgrade.id()).toBe(city.id());
  });
  test("City cannot be upgraded when too far away", () => {
    player.buildUnit(UnitType.City, game.ref(0, 0), {});
    const cityToUpgrade = player.findUnitToUpgrade(
      UnitType.City,
      game.ref(50, 50),
    );
    expect(cityToUpgrade).toBe(false);
  });
  test("Unit cannot be upgraded when not enough resources", () => {
    player.buildUnit(UnitType.City, game.ref(0, 0), {});
    player.removeGold(BigInt(1000000));
    const cityToUpgrade = player.findUnitToUpgrade(
      UnitType.City,
      game.ref(0, 1),
    );
    expect(cityToUpgrade).toBe(false);
  });

  test("Can't send alliance requests when dead", () => {
    // conquer other
    const otherTiles = other.tiles();
    for (const tile of otherTiles) {
      player.conquer(tile);
    }
    expect(other.canSendAllianceRequest(player)).toBe(false);
  });
});
