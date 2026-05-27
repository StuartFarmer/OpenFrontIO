import { renderTroops } from "../../../client/Utils";
import { AttackExecution } from "../../execution/AttackExecution";
import {
  Game,
  MessageType,
  Player,
  TerraNullius,
  Unit,
  UnitType,
} from "../../game/Game";
import { TileRef } from "../../game/GameMap";
import { MotionPlanRecord } from "../../game/MotionPlans";

export interface TransportLanding {
  game: Game;
  boat: Unit;
  attacker: Player;
  target: Player | TerraNullius;
  destination: TileRef;
}

export class MobileUnitSystem {
  recordGridMotionPlan(
    game: Game,
    input: {
      unitId: number;
      planId: number;
      startTick: number;
      ticksPerStep: number;
      path: TileRef[];
    },
  ): void {
    const motionPlan: MotionPlanRecord = {
      kind: "grid",
      unitId: input.unitId,
      planId: input.planId,
      startTick: input.startTick,
      ticksPerStep: input.ticksPerStep,
      path: input.path,
    };
    game.recordMotionPlan(motionPlan);
  }

  recordTrainMotionPlan(
    game: Game,
    input: {
      engineUnitId: number;
      carUnitIds: number[];
      planId: number;
      startTick: number;
      speed: number;
      spacing: number;
      path: TileRef[];
    },
  ): void {
    const motionPlan: MotionPlanRecord = {
      kind: "train",
      engineUnitId: input.engineUnitId,
      carUnitIds: input.carUnitIds,
      planId: input.planId,
      startTick: input.startTick,
      speed: input.speed,
      spacing: input.spacing,
      path: input.path,
    };
    game.recordMotionPlan(motionPlan);
  }

  moveWarships(
    game: Game,
    owner: Player,
    unitIds: readonly number[],
    position: TileRef,
  ): void {
    if (!game.isValidRef(position)) {
      console.warn(`MoveWarshipExecution: position ${position} not valid`);
      return;
    }

    const warshipMap = new Map(
      owner.units(UnitType.Warship).map((unit) => [unit.id(), unit]),
    );
    for (const unitId of new Set(unitIds)) {
      const warship = warshipMap.get(unitId);
      if (!warship) {
        console.warn(`MoveWarshipExecution: warship ${unitId} not found`);
        continue;
      }
      if (!warship.isActive()) {
        console.warn(`MoveWarshipExecution: warship ${unitId} is not active`);
        continue;
      }
      warship.updateWarshipState({
        patrolTile: position,
      });
      warship.setTargetTile(undefined);
    }
  }

  completeTransportRetreat(landing: TransportLanding): void {
    const { game, boat, attacker, target } = landing;
    const deaths = boat.troops() * 0.25;
    const survivors = boat.troops() - deaths;
    attacker.addTroops(survivors);
    boat.delete(false);

    game.stats().boatArriveTroops(attacker, target, survivors);
    if (deaths) {
      game.displayMessage(
        "events_display.attack_cancelled_retreat",
        MessageType.ATTACK_CANCELLED,
        attacker.id(),
        undefined,
        { troops: renderTroops(deaths) },
      );
    }
  }

  completeTransportLanding(landing: TransportLanding): void {
    const { game, boat, attacker, target, destination } = landing;
    attacker.conquer(destination);
    if (target.isPlayer() && attacker.isFriendly(target)) {
      attacker.addTroops(boat.troops());
    } else {
      game.addExecution(
        new AttackExecution(
          boat.troops(),
          attacker,
          target.id(),
          destination,
          false,
        ),
      );
    }
    boat.delete(false);

    game.stats().boatArriveTroops(attacker, target, boat.troops());
  }
}
