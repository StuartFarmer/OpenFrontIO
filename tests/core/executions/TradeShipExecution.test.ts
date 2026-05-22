import { TradeShipExecution } from "../../../src/core/execution/TradeShipExecution";
import { Game, Player, Unit } from "../../../src/core/game/Game";
import { PathStatus } from "../../../src/core/pathfinding/types";
import { setup } from "../../util/Setup";

const ORIGIN_RESOURCES = {
  food: 25_000n,
  energy: 50_000n,
  materials: 25_000n,
};

const DESTINATION_RESOURCES = {
  food: 45_000n,
  energy: 10_000n,
  materials: 45_000n,
};

const RESOURCE_CAPACITY = {
  food: 100_000n,
  energy: 100_000n,
  materials: 100_000n,
};

describe("TradeShipExecution", () => {
  let game: Game;
  let origOwner: Player;
  let dstOwner: Player;
  let pirate: Player;
  let srcPort: Unit;
  let piratePort: Unit;
  let piratePort2: Unit;
  let tradeShip: Unit;
  let dstPort: Unit;
  let tradeShipExecution: TradeShipExecution;

  beforeEach(async () => {
    // Mock Game, Player, Unit, and required methods

    game = await setup("ocean_and_land", {
      infiniteGold: true,
      instantBuild: true,
    });
    game.displayMessage = vi.fn();
    (game.config() as any).tradeShipGold = vi.fn(() => 10_000n);
    (game.config() as any).maxResources = vi.fn(() => RESOURCE_CAPACITY);
    origOwner = {
      canBuild: vi.fn(() => true),
      buildUnit: vi.fn((type, spawn, opts) => tradeShip),
      displayName: vi.fn(() => "Origin"),
      addGold: vi.fn(),
      addResources: vi.fn(),
      removeResources: vi.fn(() => ({
        food: 0n,
        energy: 10_000n,
        materials: 0n,
      })),
      resources: vi.fn(() => ORIGIN_RESOURCES),
      units: vi.fn(() => [dstPort]),
      unitCount: vi.fn(() => 1),
      id: vi.fn(() => 1),
      clientID: vi.fn(() => 1),
      canTrade: vi.fn(() => true),
    } as any;

    dstOwner = {
      id: vi.fn(() => 2),
      addGold: vi.fn(),
      addResources: vi.fn(),
      removeResources: vi.fn(() => ({
        food: 4_999n,
        energy: 0n,
        materials: 5_001n,
      })),
      resources: vi.fn(() => DESTINATION_RESOURCES),
      displayName: vi.fn(() => "Destination"),
      units: vi.fn(() => [dstPort]),
      unitCount: vi.fn(() => 1),
      clientID: vi.fn(() => 2),
      canTrade: vi.fn(() => true),
    } as any;

    pirate = {
      id: vi.fn(() => 3),
      addGold: vi.fn(),
      addResources: vi.fn(),
      removeResources: vi.fn(),
      resources: vi.fn(() => DESTINATION_RESOURCES),
      displayName: vi.fn(() => "Destination"),
      units: vi.fn(() => [piratePort, piratePort2]),
      unitCount: vi.fn(() => 2),
      clientID: vi.fn(() => 3),
      canTrade: vi.fn(() => true),
    } as any;

    piratePort = {
      id: vi.fn(() => 201),
      tile: vi.fn(() => 56),
      owner: vi.fn(() => pirate),
      isActive: vi.fn(() => true),
      isUnderConstruction: vi.fn(() => false),
      isMarkedForDeletion: vi.fn(() => false),
    } as any;

    piratePort2 = {
      id: vi.fn(() => 202),
      tile: vi.fn(() => 75),
      owner: vi.fn(() => pirate),
      isActive: vi.fn(() => true),
      isUnderConstruction: vi.fn(() => false),
      isMarkedForDeletion: vi.fn(() => false),
    } as any;

    srcPort = {
      id: vi.fn(() => 101),
      tile: vi.fn(() => 10),
      owner: vi.fn(() => origOwner),
      isActive: vi.fn(() => true),
      isUnderConstruction: vi.fn(() => false),
      isMarkedForDeletion: vi.fn(() => false),
    } as any;

    dstPort = {
      id: vi.fn(() => 102),
      tile: vi.fn(() => 100),
      owner: vi.fn(() => dstOwner),
      isActive: vi.fn(() => true),
      isUnderConstruction: vi.fn(() => false),
      isMarkedForDeletion: vi.fn(() => false),
    } as any;

    tradeShip = {
      isActive: vi.fn(() => true),
      owner: vi.fn(() => origOwner),
      id: vi.fn(() => 123),
      move: vi.fn(),
      setTargetUnit: vi.fn(),
      setSafeFromPirates: vi.fn(),
      touch: vi.fn(),
      delete: vi.fn(),
      tile: vi.fn(() => 32),
    } as any;

    tradeShipExecution = new TradeShipExecution(origOwner, srcPort, dstPort);
    tradeShipExecution.init(game, 0);
    tradeShipExecution["pathFinder"] = {
      next: vi.fn(() => ({ status: PathStatus.NEXT, node: 32 })),
      findPath: vi.fn((from: number) => [from]),
    } as any;
    tradeShipExecution["tradeShip"] = tradeShip;
  });

  it("should initialize and tick without errors", () => {
    tradeShipExecution.tick(1);
    expect(tradeShipExecution.isActive()).toBe(true);
  });

  it("should deactivate if tradeShip is not active", () => {
    tradeShip.isActive = vi.fn(() => false);
    tradeShipExecution.tick(1);
    expect(tradeShipExecution.isActive()).toBe(false);
  });

  it("should delete ship if port owner changes to current owner", () => {
    dstPort.owner = vi.fn(() => origOwner);
    tradeShipExecution.tick(1);
    expect(tradeShip.delete).toHaveBeenCalledWith(false);
    expect(tradeShipExecution.isActive()).toBe(false);
  });

  it("should pick another port if ship is captured", () => {
    tradeShip.owner = vi.fn(() => pirate);
    tradeShipExecution.tick(1);
    expect(tradeShip.setTargetUnit).toHaveBeenCalledWith(piratePort);
  });

  it("should complete trade and exchange resources", () => {
    tradeShipExecution["pathFinder"] = {
      next: vi.fn(() => ({ status: PathStatus.COMPLETE, node: 32 })),
      findPath: vi.fn((from: number) => [from]),
    } as any;
    tradeShipExecution.tick(1);
    expect(tradeShip.delete).toHaveBeenCalledWith(false);
    expect(tradeShipExecution.isActive()).toBe(false);
    expect(origOwner.removeResources).toHaveBeenCalledWith(
      {
        food: 0n,
        energy: 10_000n,
        materials: 0n,
      },
      { updateGold: false },
    );
    expect(dstOwner.removeResources).toHaveBeenCalledWith(
      {
        food: 4_999n,
        energy: 0n,
        materials: 5_001n,
      },
      { updateGold: false },
    );
    expect(origOwner.addResources).toHaveBeenCalledWith(
      {
        food: 4_999n,
        energy: 0n,
        materials: 5_001n,
      },
      undefined,
      {
        bonusResources: {
          food: 4_999n,
          energy: 0n,
          materials: 5_001n,
        },
        bonusSource: "ship",
        updateGold: false,
      },
    );
    expect(dstOwner.addResources).toHaveBeenCalledWith(
      {
        food: 0n,
        energy: 10_000n,
        materials: 0n,
      },
      dstPort.tile(),
      {
        bonusResources: {
          food: 0n,
          energy: 10_000n,
          materials: 0n,
        },
        bonusSource: "ship",
        updateGold: false,
      },
    );
    expect(game.displayMessage).toHaveBeenCalledTimes(2);
  });

  it("should complete captured trade and award captured cargo resources", () => {
    tradeShip.owner = vi.fn(() => pirate);
    tradeShipExecution["wasCaptured"] = true;
    tradeShipExecution["pathFinder"] = {
      next: vi.fn(() => ({ status: PathStatus.COMPLETE, node: 32 })),
      findPath: vi.fn((from: number) => [from]),
    } as any;

    tradeShipExecution.tick(1);

    expect(tradeShip.delete).toHaveBeenCalledWith(false);
    expect(tradeShipExecution.isActive()).toBe(false);
    const expectedResources = {
      food: 0n,
      energy: 10_000n,
      materials: 0n,
    };
    expect(origOwner.removeResources).toHaveBeenCalledWith(expectedResources, {
      updateGold: false,
    });
    expect(pirate.addResources).toHaveBeenCalledWith(
      expectedResources,
      piratePort.tile(),
      {
        bonusResources: expectedResources,
        bonusSource: "ship",
        updateGold: false,
      },
    );
    expect(game.displayMessage).toHaveBeenCalledWith(
      "events_display.received_resources_from_captured_ship",
      expect.anything(),
      pirate.id(),
      undefined,
      expect.objectContaining({
        name: "Origin",
        resources: expect.any(String),
      }),
    );
  });

  it("should complete empty trade without resource popup or log", () => {
    (dstOwner as any).resources = vi.fn(() => ({
      food: 33_000n,
      energy: 33_000n,
      materials: 33_000n,
    }));
    tradeShipExecution["pathFinder"] = {
      next: vi.fn(() => ({ status: PathStatus.COMPLETE, node: 32 })),
      findPath: vi.fn((from: number) => [from]),
    } as any;

    tradeShipExecution.tick(1);

    expect(tradeShip.delete).toHaveBeenCalledWith(false);
    expect(origOwner.removeResources).not.toHaveBeenCalled();
    expect(dstOwner.removeResources).not.toHaveBeenCalled();
    expect(origOwner.addResources).not.toHaveBeenCalled();
    expect(dstOwner.addResources).not.toHaveBeenCalled();
    expect(game.displayMessage).not.toHaveBeenCalled();
  });
});
