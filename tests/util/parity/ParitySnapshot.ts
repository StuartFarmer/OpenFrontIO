import {
  Attack,
  Game,
  GameUpdates,
  Player,
  PlayerID,
  Unit,
} from "../../../src/core/game/Game";
import { GameUpdateViewData } from "../../../src/core/game/GameUpdates";
import { ResourceStockpile } from "../../../src/core/game/Resources";
import { simpleHash } from "../../../src/core/Util";

export interface ParitySnapshot {
  readonly tick: number;
  readonly inSpawnPhase: boolean;
  readonly isPaused: boolean;
  readonly winner: string | null;
  readonly hash: number;
  readonly players: readonly PlayerParitySnapshot[];
  readonly attacks: readonly AttackParitySnapshot[];
  readonly units: readonly UnitParitySnapshot[];
  readonly stats: unknown;
  readonly updates?: unknown;
  readonly packedTileUpdates?: readonly number[];
  readonly packedMotionPlans?: readonly number[];
}

export interface PlayerParitySnapshot {
  readonly id: PlayerID;
  readonly smallID: number;
  readonly name: string;
  readonly type: string;
  readonly team: string | null;
  readonly isAlive: boolean;
  readonly hasSpawned: boolean;
  readonly isDisconnected: boolean;
  readonly isTraitor: boolean;
  readonly troops: number;
  readonly gold: string;
  readonly resources: StringResourceStockpile;
  readonly tilesOwned: number;
  readonly tiles: readonly number[];
  readonly borderTiles: readonly number[];
  readonly units: readonly number[];
  readonly outgoingAttacks: readonly string[];
  readonly incomingAttacks: readonly string[];
  readonly alliances: readonly number[];
  readonly targets: readonly number[];
  readonly embargoes: readonly EmbargoParitySnapshot[];
  readonly betrayals: number;
}

export interface AttackParitySnapshot {
  readonly id: string;
  readonly attackerID: number;
  readonly targetID: number | null;
  readonly troops: number;
  readonly isActive: boolean;
  readonly retreating: boolean;
  readonly retreated: boolean;
  readonly sourceTile: number | null;
  readonly borderSize: number;
  readonly clusteredPositions: readonly number[];
}

export interface UnitParitySnapshot {
  readonly id: number;
  readonly type: string;
  readonly ownerID: number;
  readonly tile: number;
  readonly lastTile: number;
  readonly isActive: boolean;
  readonly isMarkedForDeletion: boolean;
  readonly isOverdueDeletion: boolean;
  readonly troops: number;
  readonly level: number;
  readonly health: number;
  readonly isUnderConstruction: boolean;
  readonly trainType?: string;
  readonly isLoaded?: boolean;
  readonly targetTile?: number;
  readonly targetUnitID?: number;
  readonly reachedTarget: boolean;
  readonly targetable: boolean;
  readonly trajectoryIndex: number;
  readonly missileTimerQueue: readonly number[];
  readonly hasTrainStation: boolean;
  readonly warshipState: unknown;
  readonly transportShipState: unknown;
  readonly hash: number;
}

export interface EmbargoParitySnapshot {
  readonly targetID: number;
  readonly createdAt: number;
  readonly isTemporary: boolean;
}

export interface StringResourceStockpile {
  readonly food: string;
  readonly energy: string;
  readonly materials: string;
}

export interface SnapshotOptions {
  readonly updates?: GameUpdates | GameUpdateViewData;
  readonly packedTileUpdates?: Uint32Array | readonly number[];
  readonly packedMotionPlans?: Uint32Array | readonly number[] | null;
}

export function captureParitySnapshot(
  game: Game,
  options: SnapshotOptions = {},
): ParitySnapshot {
  return {
    tick: game.ticks(),
    inSpawnPhase: game.inSpawnPhase(),
    isPaused: game.isPaused(),
    winner: winnerLabel(game.getWinner()),
    hash: gameHash(game),
    players: game
      .allPlayers()
      .map(snapshotPlayer)
      .sort((a, b) => a.smallID - b.smallID),
    attacks: uniqueOutgoingAttacks(game),
    units: game
      .units()
      .map(snapshotUnit)
      .sort((a, b) => a.id - b.id),
    stats: normalizeForParity(game.stats().stats()),
    updates:
      options.updates !== undefined
        ? normalizeForParity(options.updates)
        : undefined,
    packedTileUpdates:
      options.packedTileUpdates !== undefined
        ? Array.from(options.packedTileUpdates)
        : undefined,
    packedMotionPlans:
      options.packedMotionPlans !== undefined &&
      options.packedMotionPlans !== null
        ? Array.from(options.packedMotionPlans)
        : undefined,
  };
}

export function normalizeForParity(value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map(normalizeForParity);
  }
  if (value instanceof Set) {
    return [...value].map(normalizeForParity).sort(stableCompare);
  }
  if (value instanceof Uint32Array) {
    return Array.from(value);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, normalizeForParity(nested)]),
    );
  }
  return value;
}

function snapshotPlayer(player: Player): PlayerParitySnapshot {
  return {
    id: player.id(),
    smallID: player.smallID(),
    name: player.name(),
    type: player.type(),
    team: player.team(),
    isAlive: player.isAlive(),
    hasSpawned: player.hasSpawned(),
    isDisconnected: player.isDisconnected(),
    isTraitor: player.isTraitor(),
    troops: player.troops(),
    gold: player.gold().toString(),
    resources: stringResources(player.resources()),
    tilesOwned: player.numTilesOwned(),
    tiles: sortedNumbers(player.tiles()),
    borderTiles: sortedNumbers(player.borderTiles()),
    units: player
      .units()
      .map((unit) => unit.id())
      .sort((a, b) => a - b),
    outgoingAttacks: player
      .outgoingAttacks()
      .map((attack) => attack.id())
      .sort(),
    incomingAttacks: player
      .incomingAttacks()
      .map((attack) => attack.id())
      .sort(),
    alliances: player
      .alliances()
      .map((alliance) => alliance.other(player).smallID())
      .sort((a, b) => a - b),
    targets: player
      .targets()
      .map((target) => target.smallID())
      .sort((a, b) => a - b),
    embargoes: player
      .getEmbargoes()
      .map((embargo) => ({
        targetID: embargo.target.smallID(),
        createdAt: embargo.createdAt,
        isTemporary: embargo.isTemporary,
      }))
      .sort((a, b) => a.targetID - b.targetID),
    betrayals: player.betrayals(),
  };
}

function snapshotAttack(attack: Attack): AttackParitySnapshot {
  return {
    id: attack.id(),
    attackerID: attack.attacker().smallID(),
    targetID: attack.target().isPlayer() ? attack.target().smallID() : null,
    troops: attack.troops(),
    isActive: attack.isActive(),
    retreating: attack.retreating(),
    retreated: attack.retreated(),
    sourceTile: attack.sourceTile(),
    borderSize: attack.borderSize(),
    clusteredPositions: [...attack.clusteredPositions()].sort((a, b) => a - b),
  };
}

function snapshotUnit(unit: Unit): UnitParitySnapshot {
  return {
    id: unit.id(),
    type: unit.type(),
    ownerID: unit.owner().smallID(),
    tile: unit.tile(),
    lastTile: unit.lastTile(),
    isActive: unit.isActive(),
    isMarkedForDeletion: unit.isMarkedForDeletion(),
    isOverdueDeletion: unit.isOverdueDeletion(),
    troops: unit.troops(),
    level: unit.level(),
    health: unit.health(),
    isUnderConstruction: unit.isUnderConstruction(),
    trainType: unit.trainType(),
    isLoaded: unit.isLoaded(),
    targetTile: unit.targetTile(),
    targetUnitID: unit.targetUnit()?.id(),
    reachedTarget: unit.reachedTarget(),
    targetable: unit.isTargetable(),
    trajectoryIndex: unit.trajectoryIndex(),
    missileTimerQueue: [...unit.missileTimerQueue()],
    hasTrainStation: unit.hasTrainStation(),
    warshipState: normalizeForParity(
      optionalUnitValue(() => unit.warshipState()),
    ),
    transportShipState: normalizeForParity(
      optionalUnitValue(() => unit.transportShipState()),
    ),
    hash: unit.hash(),
  };
}

function uniqueOutgoingAttacks(game: Game): readonly AttackParitySnapshot[] {
  const attacks = new Map<string, Attack>();
  for (const player of game.allPlayers()) {
    for (const attack of player.outgoingAttacks()) {
      attacks.set(attack.id(), attack);
    }
  }
  return [...attacks.values()]
    .map(snapshotAttack)
    .sort((a, b) => a.id.localeCompare(b.id));
}

function stringResources(
  resources: ResourceStockpile,
): StringResourceStockpile {
  return {
    food: resources.food.toString(),
    energy: resources.energy.toString(),
    materials: resources.materials.toString(),
  };
}

function gameHash(game: Game): number {
  return (
    1 +
    game
      .allPlayers()
      .map(
        (player) =>
          simpleHash(player.id()) * (player.troops() + player.numTilesOwned()) +
          player
            .units()
            .map((unit) => unit.hash())
            .reduce((total, hash) => total + hash, 0),
      )
      .reduce((total, hash) => total + hash, 0)
  );
}

function winnerLabel(winner: ReturnType<Game["getWinner"]>): string | null {
  if (winner === null) {
    return null;
  }
  if (typeof winner === "string") {
    return winner;
  }
  return winner.id();
}

function sortedNumbers(values: Iterable<number>): readonly number[] {
  return [...values].sort((a, b) => a - b);
}

function stableCompare(a: unknown, b: unknown): number {
  return JSON.stringify(a).localeCompare(JSON.stringify(b));
}

function optionalUnitValue<T>(read: () => T): T | undefined {
  try {
    return read();
  } catch {
    return undefined;
  }
}
