import { describe, expect, test } from "vitest";
import { PlayerInfo, PlayerType, UnitType } from "../../../src/core/game/Game";
import { MobileUnitSystem } from "../../../src/games/openfront/systems/gameplay/MobileUnitSystem";
import { setup } from "../../util/Setup";

const coastX = 7;

describe("MobileUnitSystem", () => {
  test("mobile_unit_system_preserves_warship_combat", async () => {
    const game = await setup(
      "half_land_half_ocean",
      { infiniteGold: true, instantBuild: true },
      [new PlayerInfo("p1", PlayerType.Human, null, "p1")],
    );
    const player = game.player("p1");
    const original = game.ref(coastX + 1, 10);
    const target = game.ref(coastX + 4, 14);
    const warship = player.buildUnit(UnitType.Warship, original, {
      patrolTile: original,
    });

    new MobileUnitSystem().moveWarships(game, player, [warship.id()], target);

    expect(warship.warshipState().patrolTile).toBe(target);
    expect(warship.targetTile()).toBeUndefined();
  });

  test("mobile_unit_system_preserves_transport_landing_attack", async () => {
    const game = await setup(
      "half_land_half_ocean",
      { infiniteGold: true, instantBuild: true },
      [
        new PlayerInfo("p1", PlayerType.Human, null, "p1"),
        new PlayerInfo("p2", PlayerType.Human, null, "p2"),
      ],
    );
    const attacker = game.player("p1");
    const defender = game.player("p2");
    const destination = game.ref(coastX, 10);
    defender.conquer(destination);
    const boat = attacker.buildUnit(
      UnitType.TransportShip,
      game.ref(coastX + 1, 10),
      {
        troops: 500,
        targetTile: destination,
      },
    );

    new MobileUnitSystem().completeTransportLanding({
      game,
      boat,
      attacker,
      target: defender,
      destination,
    });

    expect(game.owner(destination)).toBe(attacker);
    expect(boat.isActive()).toBe(false);
    expect(attacker.outgoingAttacks()).toHaveLength(0);

    game.executeNextTick();

    expect(attacker.outgoingAttacks()).toHaveLength(1);
    expect(attacker.outgoingAttacks()[0].sourceTile()).toBe(destination);
  });
});
