import { TradeShipExecution } from "../../../src/core/execution/TradeShipExecution";
import { Game, Player, Unit } from "../../../src/core/game/Game";
import type { ResourceStockpile } from "../../../src/core/game/Resources";
import { PathStatus } from "../../../src/core/pathfinding/types";
import { setup } from "../../util/Setup";

const ORIGIN_EXPORT_BLEND = {
  food: 300n,
  energy: 200n,
  materials: 500n,
};

function expectedTradeResources(
  total: bigint,
  blend: ResourceStockpile,
): ResourceStockpile {
  const blendTotal = blend.food + blend.energy + blend.materials;
  const food = (total * blend.food) / blendTotal;
  const energy = (total * blend.energy) / blendTotal;
  return {
    food,
    energy,
    materials: total - food - energy,
  };
}

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
    origOwner = {
      canBuild: vi.fn(() => true),
      buildUnit: vi.fn((type, spawn, opts) => tradeShip),
      displayName: vi.fn(() => "Origin"),
      addGold: vi.fn(),
      addResources: vi.fn(),
      resources: vi.fn(() => ORIGIN_EXPORT_BLEND),
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
      resources: vi.fn(() => ({
        food: 100n,
        energy: 100n,
        materials: 100n,
      })),
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
      resources: vi.fn(() => ({
        food: 0n,
        energy: 500n,
        materials: 500n,
      })),
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

  it("should complete trade and award blended resources", () => {
    tradeShipExecution["pathFinder"] = {
      next: vi.fn(() => ({ status: PathStatus.COMPLETE, node: 32 })),
      findPath: vi.fn((from: number) => [from]),
    } as any;
    tradeShipExecution.tick(1);
    expect(tradeShip.delete).toHaveBeenCalledWith(false);
    expect(tradeShipExecution.isActive()).toBe(false);
    const gold = game.config().tradeShipGold(0, origOwner);
    const resources = expectedTradeResources(gold, ORIGIN_EXPORT_BLEND);
    expect(origOwner.addResources).toHaveBeenCalledWith(resources, undefined, {
      updateGold: false,
    });
    expect(dstOwner.addResources).toHaveBeenCalledWith(
      resources,
      dstPort.tile(),
      { bonusResources: resources, updateGold: false },
    );
    expect(game.displayMessage).toHaveBeenCalled();
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
    const gold = game.config().tradeShipGold(0, pirate);
    expect(pirate.addResources).toHaveBeenCalledWith(
      expectedTradeResources(gold, ORIGIN_EXPORT_BLEND),
      piratePort.tile(),
      {
        bonusResources: expectedTradeResources(gold, ORIGIN_EXPORT_BLEND),
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
});
