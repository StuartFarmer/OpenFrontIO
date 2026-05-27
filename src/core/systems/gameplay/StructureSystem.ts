import { CityExecution } from "../../execution/CityExecution";
import { DefensePostExecution } from "../../execution/DefensePostExecution";
import { MirvExecution } from "../../execution/MIRVExecution";
import { MissileSiloExecution } from "../../execution/MissileSiloExecution";
import { NukeExecution } from "../../execution/NukeExecution";
import { PortExecution } from "../../execution/PortExecution";
import { RailStationExecution } from "../../execution/RailStationExecution";
import { SAMLauncherExecution } from "../../execution/SAMLauncherExecution";
import { TrainStationExecution } from "../../execution/TrainStationExecution";
import { WarshipExecution } from "../../execution/WarshipExecution";
import { Game, Player, Tick, Unit, UnitType } from "../../game/Game";
import { TileRef } from "../../game/GameMap";

export interface StructureConstructionStart {
  active: boolean;
  structure: Unit | null;
  ticksUntilComplete: Tick;
  completed: boolean;
}

export interface CompleteConstructionInput {
  game: Game;
  player: Player;
  constructionType: UnitType;
  tile: TileRef;
  structure: Unit | null;
  rocketDirectionUp?: boolean;
}

export class StructureSystem {
  validateConstructionRequest(
    game: Game,
    constructionType: UnitType,
    tile: TileRef,
  ): boolean {
    if (game.config().isUnitDisabled(constructionType)) {
      console.warn(
        `cannot build construction ${constructionType} because it is disabled`,
      );
      return false;
    }

    if (!game.isValidRef(tile)) {
      console.warn(`cannot build construction invalid tile ${tile}`);
      return false;
    }

    return true;
  }

  startStructureConstruction(
    game: Game,
    player: Player,
    constructionType: UnitType,
    tile: TileRef,
  ): StructureConstructionStart {
    const spawnTile = player.canBuild(constructionType, tile);
    if (spawnTile === false) {
      console.warn(`cannot build ${constructionType}`);
      return {
        active: false,
        structure: null,
        ticksUntilComplete: 0,
        completed: false,
      };
    }

    const structure = player.buildUnit(constructionType, spawnTile, {});
    const duration = game.unitInfo(constructionType).constructionDuration ?? 0;
    if (duration > 0) {
      structure.setUnderConstruction(true);
      return {
        active: true,
        structure,
        ticksUntilComplete: duration,
        completed: false,
      };
    }

    return {
      active: true,
      structure,
      ticksUntilComplete: 0,
      completed: true,
    };
  }

  completeConstruction(input: CompleteConstructionInput): void {
    const {
      game,
      player,
      constructionType,
      tile,
      structure,
      rocketDirectionUp,
    } = input;
    if (structure) {
      structure.setUnderConstruction(false);
    }

    switch (constructionType) {
      case UnitType.AtomBomb:
      case UnitType.HydrogenBomb:
        game.addExecution(
          new NukeExecution(
            constructionType,
            player,
            tile,
            null,
            -1,
            0,
            rocketDirectionUp,
          ),
        );
        break;
      case UnitType.MIRV:
        game.addExecution(new MirvExecution(player, tile));
        break;
      case UnitType.Warship:
        game.addExecution(
          new WarshipExecution({ owner: player, patrolTile: tile }),
        );
        break;
      case UnitType.Port:
        game.addExecution(new PortExecution(structure!));
        break;
      case UnitType.MissileSilo:
        game.addExecution(new MissileSiloExecution(structure!));
        break;
      case UnitType.DefensePost:
        game.addExecution(new DefensePostExecution(structure!));
        break;
      case UnitType.SAMLauncher:
        game.addExecution(new SAMLauncherExecution(player, null, structure!));
        break;
      case UnitType.City:
        game.addExecution(new CityExecution(structure!));
        break;
      case UnitType.RailStation:
        game.addExecution(new RailStationExecution(structure!));
        break;
      case UnitType.Silo:
      case UnitType.Factory:
        break;
      default:
        console.warn(`unit type ${constructionType} cannot be constructed`);
        break;
    }
  }

  isStructure(type: UnitType): boolean {
    switch (type) {
      case UnitType.Port:
      case UnitType.MissileSilo:
      case UnitType.DefensePost:
      case UnitType.SAMLauncher:
      case UnitType.City:
      case UnitType.RailStation:
      case UnitType.Silo:
      case UnitType.Factory:
        return true;
      default:
        return false;
    }
  }

  createStationIfNearRail(game: Game, unit: Unit): void {
    const nearbyRailStation = game.hasUnitNearby(
      unit.tile(),
      game.config().trainStationMaxRange(),
      UnitType.RailStation,
    );
    if (nearbyRailStation) {
      game.addExecution(new TrainStationExecution(unit));
    }
  }

  createRailStationNetwork(game: Game, railStation: Unit): void {
    const structures = game.nearbyUnits(
      railStation.tile(),
      game.config().trainStationMaxRange(),
      [UnitType.City, UnitType.Port, UnitType.RailStation],
    );

    game.addExecution(new TrainStationExecution(railStation));
    for (const { unit } of structures) {
      if (!unit.hasTrainStation()) {
        game.addExecution(new TrainStationExecution(unit));
      }
    }
  }

  tickMissileSilo(game: Game, silo: Unit): void {
    if (silo.isUnderConstruction()) {
      return;
    }

    const frontTime = silo.missileTimerQueue()[0];
    if (frontTime === undefined) {
      return;
    }

    const cooldown = game.config().SiloCooldown() - (game.ticks() - frontTime);
    if (cooldown <= 0) {
      silo.reloadMissile();
    }
  }
}
