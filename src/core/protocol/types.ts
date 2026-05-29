export type ModuleId = string;
export type GameId = string;
export type ClientId = string;
export type PlayerId = string;

export interface EnginePlayerEnvelope<TProfile = unknown> {
  playerId: PlayerId;
  clientId?: ClientId;
  username?: string;
  profile?: TProfile;
}

export interface GameStartEnvelope<
  TConfig = unknown,
  TPlayerProfile = unknown,
> {
  gameId: GameId;
  moduleId: ModuleId;
  lobbyCreatedAt: number;
  visibleAt?: number;
  players: EnginePlayerEnvelope<TPlayerProfile>[];
  config: TConfig;
}

export interface StampedIntentEnvelope<TPayload = unknown> {
  clientId: ClientId;
  type: string;
  payload: TPayload;
}

export interface TurnEnvelope<TIntentPayload = unknown> {
  moduleId: ModuleId;
  turnNumber: number;
  intents: StampedIntentEnvelope<TIntentPayload>[];
  hash?: number | null;
}

export interface EngineMapDeltaEnvelope {
  packedTileStateUpdates?: Uint32Array;
  packedTerrainUpdates?: Uint32Array;
  packedMotionPlans?: Uint32Array;
}

export interface ModuleEventEnvelope<TPayload = unknown> {
  type: string;
  payload: TPayload;
}

export interface EngineUpdateMetricsEnvelope {
  tickExecutionDuration?: number;
  pendingTurns?: number;
}

export interface EngineUpdateEnvelope<TEventPayload = unknown> {
  moduleId: ModuleId;
  tick: number;
  map?: EngineMapDeltaEnvelope;
  events: ModuleEventEnvelope<TEventPayload>[];
  metrics?: EngineUpdateMetricsEnvelope;
}

export interface EngineErrorEnvelope<TDetails = unknown> {
  moduleId?: ModuleId;
  code: string;
  message: string;
  details?: TDetails;
  tick?: number;
  recoverable?: boolean;
}

export type EngineProtocolEnvelope =
  | GameStartEnvelope
  | TurnEnvelope
  | EngineUpdateEnvelope
  | EngineErrorEnvelope;
