export type GameModuleId = string;

export interface ModulePayloadSchema<TPayload = unknown> {
  parse(payload: unknown): TPayload;
}

export interface GameModuleSchemas {
  config?: ModulePayloadSchema;
  intent?: ModulePayloadSchema;
  update?: ModulePayloadSchema;
}

export interface CreateServerRunnerContext<
  TGameStart = unknown,
  TClientId = unknown,
  TMapLoader = unknown,
  TUpdate = unknown,
> {
  gameStart: TGameStart;
  clientId: TClientId;
  mapLoader: TMapLoader;
  onUpdate: (update: TUpdate) => void;
}

export interface ServerGameModuleRuntime<
  TGameStart = unknown,
  TClientId = unknown,
  TMapLoader = unknown,
  TUpdate = unknown,
  TRunner = unknown,
> {
  createRunner(
    ctx: CreateServerRunnerContext<TGameStart, TClientId, TMapLoader, TUpdate>,
  ): Promise<TRunner>;
}

export interface ClientMountContext<TLobbyConfig = unknown> {
  eventBus: unknown;
  lobbyConfig: TLobbyConfig;
}

export interface ClientGameModuleRuntime<
  TLobbyConfig = unknown,
  TClientRuntime = unknown,
> {
  mount(
    ctx: ClientMountContext<TLobbyConfig>,
  ): TClientRuntime | Promise<TClientRuntime>;
}

export interface GameModuleRuntime {
  id: GameModuleId;
  schemas?: GameModuleSchemas;
  server?: ServerGameModuleRuntime;
  client?: ClientGameModuleRuntime;
  services?: Record<string, unknown>;
}
