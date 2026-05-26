import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GameSpeedUpIntentEvent,
  ReplaySpeedChangeEvent,
} from "../../src/client/InputHandler";
import { LocalServer } from "../../src/client/LocalServer";
import { ReplaySpeedMultiplier } from "../../src/client/utilities/ReplaySpeedMultiplier";
import { EventBus } from "../../src/core/EventBus";
import { ServerMessage } from "../../src/core/Schemas";

describe("LocalServer turn pacing", () => {
  const servers: LocalServer[] = [];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    for (const server of servers) {
      clearInterval(
        (server as unknown as { turnCheckInterval: NodeJS.Timeout })
          .turnCheckInterval,
      );
    }
    servers.length = 0;
    vi.restoreAllMocks();
  });

  it("keeps 2x turns on a fixed 50ms cadence after a late client completion", async () => {
    const eventBus = new EventBus();
    const messages = startLocalServer(eventBus);

    await vi.advanceTimersByTimeAsync(5);
    expect(turnMessages(messages)).toHaveLength(1);

    eventBus.emit(new ReplaySpeedChangeEvent(ReplaySpeedMultiplier.fast));

    await vi.advanceTimersByTimeAsync(75);
    expect(turnMessages(messages)).toHaveLength(1);

    servers[0].turnComplete();
    await vi.advanceTimersByTimeAsync(5);
    expect(turnMessages(messages)).toHaveLength(2);

    servers[0].turnComplete();
    await vi.advanceTimersByTimeAsync(15);
    expect(turnMessages(messages)).toHaveLength(3);
  });

  it("updates local game speed intents to the same 2x cadence", async () => {
    const eventBus = new EventBus();
    const messages = startLocalServer(eventBus);

    await vi.advanceTimersByTimeAsync(5);
    expect(turnMessages(messages)).toHaveLength(1);

    servers[0].turnComplete();
    eventBus.emit(new GameSpeedUpIntentEvent());
    await vi.advanceTimersByTimeAsync(45);

    expect(turnMessages(messages)).toHaveLength(2);
  });

  it("does not archive sandbox runs", () => {
    const eventBus = new EventBus();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    startLocalServer(eventBus, { isSandbox: true } as any);

    servers[0].endGame();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  function startLocalServer(
    eventBus: EventBus,
    config: Record<string, unknown> = {},
  ): ServerMessage[] {
    const messages: ServerMessage[] = [];
    const server = new LocalServer(
      {
        cosmetics: {},
        playerName: "Tester",
        playerClanTag: null,
        playerRole: null,
        gameID: "game-id",
        turnstileToken: null,
        gameStartInfo: {
          gameID: "game-id",
          lobbyCreatedAt: 0,
          config: config as any,
          players: [
            {
              clientID: "client-id",
              username: "Tester",
              clanTag: null,
              cosmetics: {},
            },
          ],
        },
      },
      false,
      eventBus,
    );

    server.updateCallback(vi.fn(), (message) => messages.push(message));
    server.start();
    servers.push(server);

    return messages;
  }

  function turnMessages(messages: ServerMessage[]) {
    return messages.filter((message) => message.type === "turn");
  }
});
