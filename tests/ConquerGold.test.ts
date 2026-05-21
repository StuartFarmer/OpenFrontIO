import { SpawnExecution } from "../src/core/execution/SpawnExecution";
import type { GameUpdates } from "../src/core/game/Game";
import { Game, Player, PlayerInfo, PlayerType } from "../src/core/game/Game";
import { GameUpdateType } from "../src/core/game/GameUpdates";
import { GameID } from "../src/core/Schemas";
import { setup } from "./util/Setup";

const gameID: GameID = "test_game";

function addPlayerWithGold(
  game: Game,
  id: string,
  type: PlayerType,
  gold: bigint,
): Player {
  game.addPlayer(new PlayerInfo(id, type, null, id));
  const player = game.player(id);
  player.addGold(gold);
  return player;
}

function latestUpdates(game: Game) {
  return (game as unknown as { updates: GameUpdates }).updates;
}

describe("DefaultConfig.conquerGoldAmount", () => {
  let game: Game;

  beforeEach(async () => {
    game = await setup("ocean_and_land");
  });

  test("returns full gold for Bot", () => {
    const bot = addPlayerWithGold(game, "bot", PlayerType.Bot, 1000n);
    expect(game.config().conquerGoldAmount(bot)).toBe(1000n);
  });

  test("returns full gold for Nation", () => {
    const nation = addPlayerWithGold(game, "nation", PlayerType.Nation, 2000n);
    expect(game.config().conquerGoldAmount(nation)).toBe(2000n);
  });

  test("returns half gold for Human", () => {
    const human = addPlayerWithGold(game, "human", PlayerType.Human, 1000n);
    expect(game.config().conquerGoldAmount(human)).toBe(500n);
  });
});

describe("Conquest gold transfer", () => {
  let game: Game;
  let conqueror: Player;

  beforeEach(async () => {
    game = await setup("ocean_and_land");
    const conquerorInfo = new PlayerInfo(
      "conqueror",
      PlayerType.Human,
      null,
      "conqueror",
    );
    game.addPlayer(conquerorInfo);
    game.addExecution(
      new SpawnExecution(gameID, conquerorInfo, game.ref(0, 10)),
    );
    conqueror = game.player(conquerorInfo.id);
  });

  test("conqueror receives 100% of gold when conquering a Bot", () => {
    const bot = addPlayerWithGold(game, "bot", PlayerType.Bot, 1000n);
    bot.addResources({ food: 10n, energy: 20n, materials: 30n }, undefined, {
      updateGold: false,
    });
    const goldBefore = conqueror.gold();
    const resourcesBefore = conqueror.resources();
    const botResources = bot.resources();
    game.conquerPlayer(conqueror, bot);
    expect(conqueror.gold()).toBe(goldBefore + 1000n);
    expect(conqueror.resources()).toEqual({
      food: resourcesBefore.food + 1000n + botResources.food,
      energy: resourcesBefore.energy + 1000n + botResources.energy,
      materials: resourcesBefore.materials + 1000n + botResources.materials,
    });
    expect(bot.gold()).toBe(0n);
    expect(bot.resources()).toEqual({
      food: 0n,
      energy: 0n,
      materials: 0n,
    });
  });

  test("conqueror receives 100% of gold when conquering a Nation", () => {
    const nation = addPlayerWithGold(game, "nation", PlayerType.Nation, 800n);
    const goldBefore = conqueror.gold();
    const resourcesBefore = conqueror.resources();
    const nationResources = nation.resources();
    game.conquerPlayer(conqueror, nation);
    expect(conqueror.gold()).toBe(goldBefore + 800n);
    expect(conqueror.resources()).toEqual({
      food: resourcesBefore.food + 800n + nationResources.food,
      energy: resourcesBefore.energy + 800n + nationResources.energy,
      materials: resourcesBefore.materials + 800n + nationResources.materials,
    });
    expect(nation.gold()).toBe(0n);
    expect(nation.resources()).toEqual({
      food: 0n,
      energy: 0n,
      materials: 0n,
    });
  });

  test("conqueror receives 50% of gold when conquering a Human who has attacked", () => {
    // clientID must be non-null for stats tracking to work
    game.addPlayer(
      new PlayerInfo("victim", PlayerType.Human, "victim_client", "victim"),
    );
    const victim = game.player("victim");
    victim.addGold(1000n);
    victim.addResources(
      { food: 100n, energy: 200n, materials: 300n },
      undefined,
      { updateGold: false },
    );
    // Record an attack so the gold transfer is not skipped
    game.stats().attack(victim, game.terraNullius(), 100);
    const goldBefore = conqueror.gold();
    const resourcesBefore = conqueror.resources();
    const victimResources = victim.resources();
    game.conquerPlayer(conqueror, victim);
    expect(conqueror.gold()).toBe(goldBefore + 500n);
    expect(conqueror.resources()).toEqual({
      food: resourcesBefore.food + 500n + victimResources.food,
      energy: resourcesBefore.energy + 500n + victimResources.energy,
      materials: resourcesBefore.materials + 500n + victimResources.materials,
    });
    expect(victim.gold()).toBe(0n);
    expect(victim.resources()).toEqual({
      food: 0n,
      energy: 0n,
      materials: 0n,
    });
  });

  test("conqueror receives no gold when conquering a Human who never attacked", () => {
    const victim = addPlayerWithGold(game, "afk", PlayerType.Human, 1000n);
    const goldBefore = conqueror.gold();
    game.conquerPlayer(conqueror, victim);
    expect(conqueror.gold()).toBe(goldBefore);
    expect(conqueror.resources()).toEqual({
      food: goldBefore,
      energy: goldBefore,
      materials: goldBefore,
    });
    expect(victim.gold()).toBe(1000n);
    expect(victim.resources()).toEqual({
      food: 1000n,
      energy: 1000n,
      materials: 1000n,
    });
  });

  test("conquered resources are capped by conqueror storage and overflow is lost", () => {
    const capacity = game.config().maxResources(conqueror);
    conqueror.addResources(
      {
        food: capacity.food - 5n,
        energy: capacity.energy - 3n,
        materials: capacity.materials - 1n,
      },
      undefined,
      { updateGold: false },
    );

    game.addPlayer(new PlayerInfo("victim", PlayerType.Bot, null, "victim"));
    const victim = game.player("victim");
    victim.addResources(
      { food: 100n, energy: 100n, materials: 100n },
      undefined,
      { updateGold: false },
    );

    game.conquerPlayer(conqueror, victim);

    expect(conqueror.resources()).toEqual(capacity);
    expect(victim.resources()).toEqual({
      food: 0n,
      energy: 0n,
      materials: 0n,
    });

    const updates = latestUpdates(game);
    expect(updates[GameUpdateType.ConquestEvent]).toContainEqual(
      expect.objectContaining({
        resources: { food: 5n, energy: 3n, materials: 1n },
      }),
    );
    expect(updates[GameUpdateType.DisplayEvent]).toContainEqual(
      expect.objectContaining({
        params: expect.objectContaining({
          resources: "Biomass 5 / Fuels 3 / Metals 1",
        }),
      }),
    );
  });
});
