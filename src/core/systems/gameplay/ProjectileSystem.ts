import {
  Game,
  MessageType,
  Player,
  TrajectoryTile,
  Unit,
  UnitType,
} from "../../game/Game";
import { TileRef } from "../../game/GameMap";
import { NukeType } from "../../StatsSchemas";

export class ProjectileSystem {
  buildNuke(
    player: Player,
    nukeType: NukeType,
    spawn: TileRef,
    targetTile: TileRef,
    trajectory: TrajectoryTile[],
  ): Unit {
    return player.buildUnit(nukeType, spawn, {
      targetTile,
      trajectory,
    });
  }

  markSiloCooldown(player: Player, spawn: TileRef): void {
    const silo = player
      .units(UnitType.MissileSilo)
      .find((candidate) => candidate.tile() === spawn);
    if (silo) {
      silo.launch();
    }
  }

  buildShell(owner: Player, spawn: TileRef): Unit {
    return owner.buildUnit(UnitType.Shell, spawn, {});
  }

  completeShellImpact(
    shell: Unit,
    target: Unit,
    attacker: Player,
    damage: number,
  ): void {
    target.modifyHealth(-damage, attacker);
    shell.setReachedTarget();
    shell.delete(false);
  }

  buildSamMissile(owner: Player, spawn: TileRef): Unit {
    return owner.buildUnit(UnitType.SAMMissile, spawn, {});
  }

  cancelSamMissile(missile: Unit, target: Unit): void {
    if (target.isActive()) {
      target.setTargetedBySAM(false);
    }
    missile.delete(false);
  }

  completeSamIntercept(
    game: Game,
    missile: Unit,
    target: Unit,
    owner: Player,
  ): void {
    game.displayMessage(
      "events_display.missile_intercepted",
      MessageType.SAM_HIT,
      owner.id(),
      undefined,
      { unit: target.type() },
    );
    target.delete(true, owner);
    missile.delete(false);
    game.stats().bombIntercept(owner, target.type() as NukeType, 1);
  }
}
