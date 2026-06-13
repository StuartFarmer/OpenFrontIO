import { FoundationBuilding, FoundationBuildingType, TileRef } from "../domain";

export const FOUNDATION_MODULE_ID = "foundation";

export type FoundationModuleId = typeof FOUNDATION_MODULE_ID;

export interface FoundationCommandEnvelope<
  TPayload extends FoundationCommandPayload = FoundationCommandPayload,
> {
  moduleId: FoundationModuleId;
  clientId: string;
  actor: FoundationCommandActor;
  turnNumber: number;
  commandId?: string;
  payload: TPayload;
}

export interface FoundationCommandActor {
  type: "player";
  id: string;
}

export type FoundationCommandPayload =
  | FoundationPlacePlayerCommand
  | FoundationGrowTerritoryCommand
  | FoundationBuildStructureCommand;

export interface FoundationPlacePlayerCommand {
  type: "foundation.place_player";
  tileRef: TileRef;
}

export interface FoundationGrowTerritoryCommand {
  type: "foundation.grow_territory";
  targetTileRef: TileRef;
  troopRatio?: number;
  frontMode?: FoundationFrontMode;
  frontFocus?: number;
}

export interface FoundationBuildStructureCommand {
  type: "foundation.build_structure";
  buildingType: FoundationBuildingType;
  tileRef: TileRef;
}

export type FoundationFrontMode = "uniform" | "focused";

export interface FoundationUpdateEnvelope {
  moduleId: FoundationModuleId;
  tick: number;
  updateId: number;
  map?: FoundationMapUpdate;
  events: FoundationModuleEventEnvelope[];
  metrics?: FoundationUpdateMetrics;
}

export interface FoundationMapUpdate {
  tileState?: Uint16Array;
  changedTiles?: Uint32Array;
  changedTileStates?: Uint16Array;
  terrainChangedTiles?: Uint32Array;
}

export interface FoundationModuleEventEnvelope<
  TPayload = FoundationModuleEventPayload,
> {
  type: string;
  payload: TPayload;
}

export type FoundationModuleEventPayload =
  | FoundationPlayerPlacedEvent
  | FoundationStructureBuiltEvent
  | FoundationWildernessExplorationStartedEvent
  | FoundationTerritoryGrownEvent
  | FoundationWildernessExplorationCompletedEvent
  | FoundationCommandRejectedEvent;

export interface FoundationPlayerPlacedEvent {
  playerId: string;
  selectedTile: TileRef;
  claimedTileCount: number;
}

export interface FoundationStructureBuiltEvent {
  playerId: string;
  building: FoundationBuilding;
}

export interface FoundationTerritoryGrownEvent {
  playerId: string;
  targetTile: TileRef;
  claimedTileCount: number;
  totalClaimedTileCount: number;
}

export interface FoundationWildernessExplorationStartedEvent {
  playerId: string;
  targetTile: TileRef;
  originTile: TileRef;
  committedTroops: number;
  remainingTroops: number;
}

export interface FoundationWildernessExplorationCompletedEvent {
  playerId: string;
  targetTile: TileRef;
}

export interface FoundationCommandRejectedEvent {
  commandType: string;
  reason: string;
}

export interface FoundationUpdateMetrics {
  tickExecutionDuration?: number;
  pendingTurns?: number;
  troops?: number;
  troopIncreaseRate?: number;
  maxTroops?: number;
  foodProduction?: number;
  foodDemand?: number;
  foodSupportedTroops?: number;
  foodSurplus?: number;
  foodDeficit?: number;
  foodStock?: number;
  foodStockCapacity?: number;
  foodStockDelta?: number;
  foodStockOverflow?: number;
  exploringTroops?: number;
}

export interface FoundationCommandResult {
  ok: boolean;
  update: FoundationUpdateEnvelope;
  error?: string;
}
