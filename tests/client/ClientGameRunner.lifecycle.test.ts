import { afterEach, describe, expect, test, vi } from "vitest";
import {
  ClientGameRunner,
  LobbyConfig,
} from "../../src/client/ClientGameRunner";

function createRunner() {
  const lobby = {
    cosmetics: {},
    gameID: "test-game",
    playerClanTag: null,
    playerName: "Player",
    playerRole: null,
    turnstileToken: null,
  } as unknown as LobbyConfig;
  const eventBus = { emit: vi.fn(), on: vi.fn() };
  const renderer = { initialize: vi.fn(), tick: vi.fn(), uiState: {} };
  const input = { initialize: vi.fn() };
  const transport = {
    isLocal: false,
    leaveGame: vi.fn(),
    reconnect: vi.fn(),
    rejoinGame: vi.fn(),
    turnComplete: vi.fn(),
    updateCallback: vi.fn(),
  };
  const worker = { cleanup: vi.fn(), sendTurn: vi.fn(), start: vi.fn() };
  const soundManager = {
    dispose: vi.fn(),
    playBackgroundMusic: vi.fn(),
  };
  const cleanupDom = vi.fn();

  const args: ConstructorParameters<typeof ClientGameRunner> = [
    lobby,
    undefined,
    eventBus as never,
    renderer as never,
    input as never,
    transport as never,
    worker as never,
    {} as never,
    soundManager as never,
    {} as never,
    null,
    cleanupDom,
  ];

  return {
    cleanupDom,
    runner: new ClientGameRunner(...args),
    soundManager,
    transport,
    worker,
  };
}

describe("ClientGameRunner lifecycle", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("stop_invokes_module_cleanup_and_runtime_disposers", () => {
    const { cleanupDom, runner, soundManager, transport, worker } =
      createRunner();

    runner.start();
    runner.stop();

    expect(soundManager.dispose).toHaveBeenCalledTimes(1);
    expect(cleanupDom).toHaveBeenCalledTimes(1);
    expect(worker.cleanup).toHaveBeenCalledTimes(1);
    expect(transport.leaveGame).toHaveBeenCalledTimes(1);
  });

  test("stop_cancels_pending_connection_check_timeout", () => {
    vi.useFakeTimers();
    const { runner, transport } = createRunner();

    runner.start();
    runner.stop();
    vi.advanceTimersByTime(22_000);

    expect(transport.reconnect).not.toHaveBeenCalled();
  });
});
