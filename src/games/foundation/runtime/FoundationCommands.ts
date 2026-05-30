import { TileRef } from "../domain";
import {
  FOUNDATION_MODULE_ID,
  FoundationCommandEnvelope,
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

export interface CreateGrowTerritoryCommandOptions
  extends CreateFoundationCommandOptions {
  targetTileRef: TileRef;
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

  if (options.commandId) {
    command.commandId = options.commandId;
  }

  return command;
}
