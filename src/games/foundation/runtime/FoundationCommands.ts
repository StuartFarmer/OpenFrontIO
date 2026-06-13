import { TileRef } from "../domain";
import {
  FOUNDATION_MODULE_ID,
  FoundationBuildStructureCommand,
  FoundationCommandEnvelope,
  FoundationFrontMode,
  FoundationGrowTerritoryCommand,
  FoundationPlacePlayerCommand,
} from "./FoundationProtocol";

export interface CreateFoundationCommandOptions {
  clientId?: string;
  playerId?: string;
  turnNumber?: number;
  commandId?: string;
}

export interface CreatePlacePlayerCommandOptions extends CreateFoundationCommandOptions {
  tileRef: TileRef;
}

export function createPlacePlayerCommand(
  options: CreatePlacePlayerCommandOptions,
): FoundationCommandEnvelope<FoundationPlacePlayerCommand> {
  const command: FoundationCommandEnvelope<FoundationPlacePlayerCommand> = {
    moduleId: FOUNDATION_MODULE_ID,
    clientId: options.clientId ?? "local-client",
    actor: {
      type: "player",
      id: options.playerId ?? "player-1",
    },
    turnNumber: options.turnNumber ?? 0,
    payload: {
      type: "foundation.place_player",
      tileRef: options.tileRef,
    },
  };

  if (options.commandId) {
    command.commandId = options.commandId;
  }

  return command;
}

export interface CreateGrowTerritoryCommandOptions extends CreateFoundationCommandOptions {
  targetTileRef: TileRef;
  troopRatio?: number;
  frontMode?: FoundationFrontMode;
  frontFocus?: number;
}

export function createGrowTerritoryCommand(
  options: CreateGrowTerritoryCommandOptions,
): FoundationCommandEnvelope<FoundationGrowTerritoryCommand> {
  const command: FoundationCommandEnvelope<FoundationGrowTerritoryCommand> = {
    moduleId: FOUNDATION_MODULE_ID,
    clientId: options.clientId ?? "local-client",
    actor: {
      type: "player",
      id: options.playerId ?? "player-1",
    },
    turnNumber: options.turnNumber ?? 0,
    payload: {
      type: "foundation.grow_territory",
      targetTileRef: options.targetTileRef,
    },
  };

  if (options.troopRatio !== undefined) {
    command.payload.troopRatio = options.troopRatio;
  }

  if (options.frontMode !== undefined) {
    command.payload.frontMode = options.frontMode;
  }

  if (options.frontFocus !== undefined) {
    command.payload.frontFocus = options.frontFocus;
  }

  if (options.commandId) {
    command.commandId = options.commandId;
  }

  return command;
}

export interface CreateBuildStructureCommandOptions extends CreateFoundationCommandOptions {
  buildingType: FoundationBuildStructureCommand["buildingType"];
  tileRef: TileRef;
}

export function createBuildStructureCommand(
  options: CreateBuildStructureCommandOptions,
): FoundationCommandEnvelope<FoundationBuildStructureCommand> {
  const command: FoundationCommandEnvelope<FoundationBuildStructureCommand> = {
    moduleId: FOUNDATION_MODULE_ID,
    clientId: options.clientId ?? "local-client",
    actor: {
      type: "player",
      id: options.playerId ?? "player-1",
    },
    turnNumber: options.turnNumber ?? 0,
    payload: {
      type: "foundation.build_structure",
      buildingType: options.buildingType,
      tileRef: options.tileRef,
    },
  };

  if (options.commandId) {
    command.commandId = options.commandId;
  }

  return command;
}
