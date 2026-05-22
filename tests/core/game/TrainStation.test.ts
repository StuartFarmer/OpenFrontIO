import { GameUpdateType } from "src/core/game/GameUpdates";
import { vi, type Mocked } from "vitest";
import { Config } from "../../../src/core/configuration/Config";
import { TrainExecution } from "../../../src/core/execution/TrainExecution";
import {
  Difficulty,
  Game,
  GameMapSize,
  GameMapType,
  GameMode,
  GameType,
  Player,
  Unit,
  UnitType,
} from "../../../src/core/game/Game";
import { Cluster, TrainStation } from "../../../src/core/game/TrainStation";
import { UserSettings } from "../../../src/core/game/UserSettings";
import { GameConfig } from "../../../src/core/Schemas";

vi.mock("../../../src/core/game/Game");
vi.mock("../../../src/core/execution/TrainExecution");
vi.mock("../../../src/core/PseudoRandom");

describe("TrainStation", () => {
  let game: Mocked<Game>;
  let gameStats: {
    trainExternalTrade: ReturnType<typeof vi.fn>;
    trainSelfTrade: ReturnType<typeof vi.fn>;
  };
  let unit: Mocked<Unit>;
  let player: Mocked<Player>;
  let trainExecution: Mocked<TrainExecution>;

  beforeEach(() => {
    gameStats = {
      trainExternalTrade: vi.fn(),
      trainSelfTrade: vi.fn(),
    };
    game = {
      ticks: vi.fn().mockReturnValue(123),
      config: vi.fn().mockReturnValue({
        trainGold: (rel: string, _tradeStopsVisited: number) =>
          rel !== "other" ? BigInt(1000) : BigInt(500),
        maxResources: () => ({
          food: 100_000n,
          energy: 100_000n,
          materials: 100_000n,
        }),
      }),
      addUpdate: vi.fn(),
      addExecution: vi.fn(),
      displayMessage: vi.fn(),
      stats: vi.fn().mockReturnValue(gameStats),
    } as any;

    player = {
      addGold: vi.fn(),
      addResources: vi.fn(),
      removeResources: vi.fn(),
      resources: vi.fn().mockReturnValue({
        food: 300n,
        energy: 200n,
        materials: 500n,
      }),
      id: vi.fn().mockReturnValue("player-id"),
      displayName: vi.fn().mockReturnValue("Player"),
      canTrade: vi.fn().mockReturnValue(true),
      isAlliedWith: vi.fn().mockReturnValue(false),
      isOnSameTeam: vi.fn().mockReturnValue(false),
      isFriendly: vi.fn().mockReturnValue(false),
    } as any;

    unit = {
      owner: vi.fn().mockReturnValue(player),
      level: vi.fn().mockReturnValue(1),
      tile: vi.fn().mockReturnValue({ x: 0, y: 0 }),
      type: vi.fn(),
      isActive: vi.fn().mockReturnValue(true),
    } as any;

    trainExecution = {
      loadCargo: vi.fn(),
      owner: vi.fn().mockReturnValue(player),
      level: vi.fn(),
      tradeStopsVisited: vi.fn().mockReturnValue(0),
    } as any;
  });

  it("does not convert resources on same-owner City stop", () => {
    unit.type.mockReturnValue(UnitType.City);
    const station = new TrainStation(game, unit);

    station.onTrainStop(trainExecution);

    expect(unit.owner().removeResources).not.toHaveBeenCalled();
    expect(unit.owner().addResources).not.toHaveBeenCalled();
    expect(game.displayMessage).not.toHaveBeenCalled();
  });

  it("does not convert resources on same-owner allied trade", () => {
    unit.type.mockReturnValue(UnitType.City);
    player.isFriendly.mockReturnValue(true);
    const station = new TrainStation(game, unit);

    station.onTrainStop(trainExecution);

    expect(unit.owner().removeResources).not.toHaveBeenCalled();
    expect(unit.owner().addResources).not.toHaveBeenCalled();
    expect(game.displayMessage).not.toHaveBeenCalled();
  });

  it("records external trade on the station owner", () => {
    const stationOwner = {
      addGold: vi.fn(),
      addResources: vi.fn(),
      removeResources: vi.fn().mockReturnValue({
        food: 4_999n,
        energy: 0n,
        materials: 5_001n,
      }),
      resources: vi.fn().mockReturnValue({
        food: 45_000n,
        energy: 10_000n,
        materials: 45_000n,
      }),
      id: vi.fn().mockReturnValue("station-owner-id"),
      displayName: vi.fn().mockReturnValue("Station Owner"),
      canTrade: vi.fn().mockReturnValue(true),
      isAlliedWith: vi.fn().mockReturnValue(false),
      isOnSameTeam: vi.fn().mockReturnValue(false),
    } as any;
    const trainOwner = {
      addGold: vi.fn(),
      addResources: vi.fn(),
      removeResources: vi.fn().mockReturnValue({
        food: 0n,
        energy: 10_000n,
        materials: 0n,
      }),
      resources: vi.fn().mockReturnValue({
        food: 25_000n,
        energy: 50_000n,
        materials: 25_000n,
      }),
      id: vi.fn().mockReturnValue("train-owner-id"),
      displayName: vi.fn().mockReturnValue("Train Owner"),
      canTrade: vi.fn().mockReturnValue(true),
      isAlliedWith: vi.fn().mockReturnValue(false),
      isOnSameTeam: vi.fn().mockReturnValue(false),
    } as any;

    unit.type.mockReturnValue(UnitType.City);
    unit.owner.mockReturnValue(stationOwner);
    trainExecution.owner.mockReturnValue(trainOwner);
    (game.config as any).mockReturnValue({
      trainGold: vi.fn().mockReturnValue(10_000n),
      maxResources: () => ({
        food: 100_000n,
        energy: 100_000n,
        materials: 100_000n,
      }),
    });
    const station = new TrainStation(game, unit);

    station.onTrainStop(trainExecution);

    expect(trainOwner.removeResources).toHaveBeenCalledWith(
      {
        food: 0n,
        energy: 10_000n,
        materials: 0n,
      },
      { updateGold: false },
    );
    expect(stationOwner.removeResources).toHaveBeenCalledWith(
      {
        food: 4_999n,
        energy: 0n,
        materials: 5_001n,
      },
      { updateGold: false },
    );
    expect(stationOwner.addResources).toHaveBeenCalledWith(
      {
        food: 0n,
        energy: 10_000n,
        materials: 0n,
      },
      unit.tile(),
      {
        bonusResources: {
          food: 0n,
          energy: 10_000n,
          materials: 0n,
        },
        bonusSource: "rail",
        updateGold: false,
      },
    );
    expect(trainOwner.addResources).toHaveBeenCalledWith(
      {
        food: 4_999n,
        energy: 0n,
        materials: 5_001n,
      },
      unit.tile(),
      {
        bonusResources: {
          food: 4_999n,
          energy: 0n,
          materials: 5_001n,
        },
        bonusSource: "rail",
        updateGold: false,
      },
    );
    expect(game.displayMessage).toHaveBeenCalledWith(
      "events_display.received_resources_from_trade",
      expect.anything(),
      "station-owner-id",
      undefined,
      expect.objectContaining({
        name: "Train Owner",
        resources: expect.stringContaining("/icons/fuel-icon.svg"),
      }),
    );
    expect(game.displayMessage).toHaveBeenCalledWith(
      "events_display.received_resources_from_trade",
      expect.anything(),
      "train-owner-id",
      undefined,
      expect.objectContaining({
        name: "Station Owner",
        resources: expect.stringContaining("/icons/metal-icon.svg"),
      }),
    );
    expect(gameStats.trainExternalTrade).toHaveBeenCalledWith(
      stationOwner,
      10_000n,
    );
    expect(gameStats.trainSelfTrade).toHaveBeenCalledWith(trainOwner, 10_000n);
  });

  it("skips train trade when no reciprocal exchange is available", () => {
    const stationOwner = {
      addResources: vi.fn(),
      removeResources: vi.fn(),
      resources: vi.fn().mockReturnValue({
        food: 33_000n,
        energy: 33_000n,
        materials: 33_000n,
      }),
      id: vi.fn().mockReturnValue("station-owner-id"),
      displayName: vi.fn().mockReturnValue("Station Owner"),
      canTrade: vi.fn().mockReturnValue(true),
      isAlliedWith: vi.fn().mockReturnValue(false),
      isOnSameTeam: vi.fn().mockReturnValue(false),
    } as any;
    const trainOwner = {
      addResources: vi.fn(),
      removeResources: vi.fn(),
      resources: vi.fn().mockReturnValue({
        food: 25_000n,
        energy: 50_000n,
        materials: 25_000n,
      }),
      id: vi.fn().mockReturnValue("train-owner-id"),
      displayName: vi.fn().mockReturnValue("Train Owner"),
      canTrade: vi.fn().mockReturnValue(true),
      isAlliedWith: vi.fn().mockReturnValue(false),
      isOnSameTeam: vi.fn().mockReturnValue(false),
    } as any;

    unit.type.mockReturnValue(UnitType.City);
    unit.owner.mockReturnValue(stationOwner);
    trainExecution.owner.mockReturnValue(trainOwner);
    const station = new TrainStation(game, unit);

    station.onTrainStop(trainExecution);

    expect(stationOwner.removeResources).not.toHaveBeenCalled();
    expect(trainOwner.removeResources).not.toHaveBeenCalled();
    expect(stationOwner.addResources).not.toHaveBeenCalled();
    expect(trainOwner.addResources).not.toHaveBeenCalled();
    expect(game.displayMessage).not.toHaveBeenCalled();
    expect(gameStats.trainExternalTrade).not.toHaveBeenCalled();
    expect(gameStats.trainSelfTrade).not.toHaveBeenCalled();
  });

  it("passes tradeStopsVisited to trainGold", () => {
    unit.type.mockReturnValue(UnitType.City);
    const trainGoldSpy = vi.fn().mockReturnValue(500n);
    const stationOwner = {
      resources: vi.fn().mockReturnValue({
        food: 45_000n,
        energy: 10_000n,
        materials: 45_000n,
      }),
      removeResources: vi.fn().mockReturnValue({
        food: 249n,
        energy: 0n,
        materials: 251n,
      }),
      addResources: vi.fn(),
      id: vi.fn().mockReturnValue("station-owner-id"),
      displayName: vi.fn().mockReturnValue("Station Owner"),
      canTrade: vi.fn().mockReturnValue(true),
      isAlliedWith: vi.fn().mockReturnValue(false),
      isOnSameTeam: vi.fn().mockReturnValue(false),
    } as any;
    const trainOwner = {
      resources: vi.fn().mockReturnValue({
        food: 25_000n,
        energy: 50_000n,
        materials: 25_000n,
      }),
      removeResources: vi.fn().mockReturnValue({
        food: 0n,
        energy: 500n,
        materials: 0n,
      }),
      addResources: vi.fn(),
      id: vi.fn().mockReturnValue("train-owner-id"),
      displayName: vi.fn().mockReturnValue("Train Owner"),
      canTrade: vi.fn().mockReturnValue(true),
      isAlliedWith: vi.fn().mockReturnValue(false),
      isOnSameTeam: vi.fn().mockReturnValue(false),
    } as any;
    unit.owner.mockReturnValue(stationOwner);
    trainExecution.owner.mockReturnValue(trainOwner);
    (game.config as any).mockReturnValue({
      trainGold: trainGoldSpy,
      maxResources: () => ({
        food: 100_000n,
        energy: 100_000n,
        materials: 100_000n,
      }),
    });
    (trainExecution as any).tradeStopsVisited = vi.fn().mockReturnValue(3);
    const station = new TrainStation(game, unit);

    station.onTrainStop(trainExecution);

    expect(trainGoldSpy).toHaveBeenCalledWith(
      expect.any(String),
      3,
      expect.anything(),
    );
  });

  it("checks trade availability (same owner)", () => {
    const otherUnit = {
      owner: vi.fn().mockReturnValue(unit.owner()),
    } as any;

    const station = new TrainStation(game, unit);
    const otherStation = new TrainStation(game, otherUnit);

    expect(station.tradeAvailable(otherStation.unit.owner())).toBe(true);
  });

  it("adds and retrieves neighbors", () => {
    const stationA = new TrainStation(game, unit);
    const stationB = new TrainStation(game, unit);
    const railRoad = { from: stationA, to: stationB, tiles: [] } as any;

    stationA.addRailroad(railRoad);

    const neighbors = stationA.neighbors();
    expect(neighbors).toContain(stationB);
  });

  it("removes neighboring rail", () => {
    const stationA = new TrainStation(game, unit);
    const stationB = new TrainStation(game, unit);

    const railRoad = {
      from: stationA,
      to: stationB,
      tiles: [{ x: 1, y: 1 }],
    } as any;

    stationA.addRailroad(railRoad);
    expect(stationA.getRailroads().size).toBe(1);

    stationA.removeNeighboringRails(stationB);

    expect(game.addUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: GameUpdateType.RailroadDestructionEvent,
      }),
    );
    expect(stationA.getRailroads().size).toBe(0);
  });

  it("assigns and retrieves cluster", () => {
    const cluster: Cluster = {} as Cluster;
    const station = new TrainStation(game, unit);

    station.setCluster(cluster);
    expect(station.getCluster()).toBe(cluster);
  });

  it("returns tile and active status", () => {
    const station = new TrainStation(game, unit);
    expect(station.tile()).toEqual({ x: 0, y: 0 });
    expect(station.isActive()).toBe(true);
  });
});

describe("Config.trainGold trade stop penalty", () => {
  let config: Config;
  let mockPlayer: Player;

  beforeEach(() => {
    const gameConfig: GameConfig = {
      gameMap: GameMapType.Asia,
      gameMapSize: GameMapSize.Normal,
      gameMode: GameMode.FFA,
      gameType: GameType.Singleplayer,
      difficulty: Difficulty.Medium,
      nations: "default",
      donateGold: false,
      donateTroops: false,
      bots: 0,
      infiniteGold: false,
      infiniteTroops: false,
      instantBuild: false,
      disableNavMesh: false,
      randomSpawn: false,
    };
    config = new Config(gameConfig, new UserSettings(), false);
    mockPlayer = { isLobbyCreator: () => false } as unknown as Player;
  });

  it("returns full base gold within free window (stops 0-9)", () => {
    // first 10 stops (0-9) are free — no penalty
    expect(config.trainGold("self", 0, mockPlayer)).toBe(10_000n);
    expect(config.trainGold("self", 9, mockPlayer)).toBe(10_000n);
  });

  it("reduces gold by 5k per stop after the free window", () => {
    // stop 10: effective = 10-9 = 1 -> 10k - 5k = 5k
    expect(config.trainGold("self", 10, mockPlayer)).toBe(5_000n);
  });

  it("floors at 5k when penalty exceeds base gold", () => {
    // stop 12: effective = 3 -> 10k - 15k -> floor at 5k
    expect(config.trainGold("self", 12, mockPlayer)).toBe(5_000n);
  });

  it("floors at 5k for ally base even with heavy penalty", () => {
    // ally base 35k, stop 20: effective = 11 -> penalty 55k -> floor at 5k
    expect(config.trainGold("ally", 20, mockPlayer)).toBe(5_000n);
  });

  it("ally base gold reduces correctly after free window", () => {
    // ally base 35k, stop 11: effective = 2 -> 35k - 10k = 25k
    expect(config.trainGold("ally", 11, mockPlayer)).toBe(25_000n);
  });

  it("other/team base gold reduces correctly after free window", () => {
    // other base 25k, stop 10: effective = 1 -> 25k - 5k = 20k
    expect(config.trainGold("other", 10, mockPlayer)).toBe(20_000n);
    expect(config.trainGold("team", 10, mockPlayer)).toBe(20_000n);
  });
});
