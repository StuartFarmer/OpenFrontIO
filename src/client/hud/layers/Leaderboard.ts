import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { renderTroops, translateText } from "../../../client/Utils";
import { EventBus } from "../../../core/EventBus";
import { TerrainType } from "../../../core/game/Game";
import { GameView, PlayerView } from "../../../core/game/GameView";
import {
  ResourceKind,
  ResourceStockpile,
  createZeroResources,
  resourceRegenDelta,
} from "../../../core/game/Resources";
import { Controller } from "../../Controller";
import { AlternateViewEvent } from "../../InputHandler";
import { GoToPlayerEvent } from "../../TransformHandler";
import { formatPercentage, renderNumber } from "../../Utils";

interface Entry {
  name: string;
  position: number;
  score: string;
  gold: string;
  maxTroops: string;
  isMyPlayer: boolean;
  isOnSameTeam: boolean;
  player: PlayerView;
}

interface ResourceNumbers {
  food: number;
  energy: number;
  materials: number;
}

interface EconomySample {
  atMs: number;
  resources: ResourceNumbers;
  production: ResourceNumbers;
}

interface ResourceEconomyRow {
  key: ResourceKind;
  label: string;
  stock: number;
  capacity: number;
  netPerSecond: number;
  productionPerSecond: number;
  railPerSecond: number;
  productionChange: number;
}

const RESOURCE_LABELS: Record<ResourceKind, string> = {
  food: "Biomass",
  energy: "Fuels",
  materials: "Metals",
};

const RESOURCE_COLORS: Record<ResourceKind, string> = {
  food: "bg-emerald-400",
  energy: "bg-amber-400",
  materials: "bg-sky-400",
};

const ECONOMY_WINDOW_MS = 30_000;
const ECONOMY_SAMPLE_INTERVAL_MS = 1_000;

@customElement("leader-board")
export class Leaderboard extends LitElement implements Controller {
  public game: GameView | null = null;
  public eventBus: EventBus | null = null;

  players: Entry[] = [];

  @property({ type: Boolean }) visible = false;
  private showTopFive = true;

  @state()
  private _sortKey: "tiles" | "gold" | "maxtroops" = "tiles";

  @state()
  private _sortOrder: "asc" | "desc" = "desc";

  @state()
  private economyMode = false;

  @state()
  private economyRows: ResourceEconomyRow[] = [];

  private economySamples: EconomySample[] = [];
  private railImportEvents: EconomySample[] = [];
  private lastEconomySampleAtMs = -Infinity;
  private lastProcessedBonusTick = -1;
  private lastLeaderboardUpdateAtMs = -Infinity;

  createRenderRoot() {
    return this; // use light DOM for Tailwind support
  }

  init() {
    this.eventBus?.on(AlternateViewEvent, (event) => {
      this.economyMode = event.alternateView;
      this.requestUpdate();
    });
  }

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has("visible") && this.visible) {
      this.updateLeaderboard();
    }
  }

  getTickIntervalMs() {
    return 100;
  }

  tick() {
    if (this.game === null) throw new Error("Not initialized");
    this.updateEconomyTelemetry();
    if (!this.visible) return;

    if (this.economyMode) {
      this.updateEconomyView();
      return;
    }

    const nowMs = performance.now();
    if (nowMs - this.lastLeaderboardUpdateAtMs >= 1000) {
      this.lastLeaderboardUpdateAtMs = nowMs;
      this.updateLeaderboard();
    }
  }

  private setSort(key: "tiles" | "gold" | "maxtroops") {
    if (this._sortKey === key) {
      this._sortOrder = this._sortOrder === "asc" ? "desc" : "asc";
    } else {
      this._sortKey = key;
      this._sortOrder = "desc";
    }
    this.updateLeaderboard();
  }

  private updateLeaderboard() {
    if (this.game === null) throw new Error("Not initialized");
    const myPlayer = this.game.myPlayer();

    let sorted = this.game.playerViews();

    const compare = (a: number, b: number) =>
      this._sortOrder === "asc" ? a - b : b - a;

    const maxTroops = (p: PlayerView) => this.game!.config().maxTroops(p);

    switch (this._sortKey) {
      case "gold":
        sorted = sorted.sort((a, b) =>
          compare(Number(a.gold()), Number(b.gold())),
        );
        break;
      case "maxtroops":
        sorted = sorted.sort((a, b) => compare(maxTroops(a), maxTroops(b)));
        break;
      default:
        sorted = sorted.sort((a, b) =>
          compare(a.numTilesOwned(), b.numTilesOwned()),
        );
    }

    const numTilesWithoutFallout =
      this.game.numLandTiles() - this.game.numTilesWithFallout();

    const alivePlayers = sorted.filter((player) => player.isAlive());
    const playersToShow = this.showTopFive
      ? alivePlayers.slice(0, 5)
      : alivePlayers;

    this.players = playersToShow.map((player, index) => {
      const maxTroops = this.game!.config().maxTroops(player);
      return {
        name: player.displayName(),
        position: index + 1,
        score: formatPercentage(
          player.numTilesOwned() / numTilesWithoutFallout,
        ),
        gold: renderNumber(player.gold()),
        maxTroops: renderTroops(maxTroops),
        isMyPlayer: player === myPlayer,
        isOnSameTeam:
          myPlayer !== null &&
          (player === myPlayer || player.isOnSameTeam(myPlayer)),
        player: player,
      };
    });

    if (
      myPlayer !== null &&
      this.players.find((p) => p.isMyPlayer) === undefined
    ) {
      let place = 0;
      for (const p of sorted) {
        place++;
        if (p === myPlayer) {
          break;
        }
      }

      if (myPlayer.isAlive()) {
        const myPlayerMaxTroops = this.game!.config().maxTroops(myPlayer);
        this.players.pop();
        this.players.push({
          name: myPlayer.displayName(),
          position: place,
          score: formatPercentage(
            myPlayer.numTilesOwned() / this.game.numLandTiles(),
          ),
          gold: renderNumber(myPlayer.gold()),
          maxTroops: renderTroops(myPlayerMaxTroops),
          isMyPlayer: true,
          isOnSameTeam: true,
          player: myPlayer,
        });
      }
    }

    this.requestUpdate();
  }

  private updateEconomyTelemetry() {
    if (this.game === null) throw new Error("Not initialized");
    const myPlayer = this.game.myPlayer();
    if (myPlayer === null || !myPlayer.isAlive()) {
      this.economySamples = [];
      this.railImportEvents = [];
      return;
    }

    const nowMs = performance.now();
    this.recordRailImports(nowMs, myPlayer);

    if (nowMs - this.lastEconomySampleAtMs < ECONOMY_SAMPLE_INTERVAL_MS) {
      return;
    }

    this.lastEconomySampleAtMs = nowMs;
    this.economySamples.push({
      atMs: nowMs,
      resources: resourceNumbers(myPlayer.resources()),
      production: this.estimateProductionPerSecond(myPlayer),
    });
    this.pruneEconomyWindow(nowMs);
  }

  private recordRailImports(nowMs: number, myPlayer: PlayerView) {
    if (this.game === null) throw new Error("Not initialized");
    const frame = this.game.frameData();
    if (frame.tick === this.lastProcessedBonusTick) return;
    this.lastProcessedBonusTick = frame.tick;

    for (const event of frame.events.bonusEvents) {
      if (
        event.smallID !== myPlayer.smallID() ||
        event.source !== "rail" ||
        event.resources === undefined
      ) {
        continue;
      }
      this.railImportEvents.push({
        atMs: nowMs,
        resources: event.resources,
        production: zeroResourceNumbers(),
      });
    }
    this.pruneEconomyWindow(nowMs);
  }

  private pruneEconomyWindow(nowMs: number) {
    const cutoff = nowMs - ECONOMY_WINDOW_MS;
    this.economySamples = this.economySamples.filter((s) => s.atMs >= cutoff);
    this.railImportEvents = this.railImportEvents.filter(
      (s) => s.atMs >= cutoff,
    );
  }

  private estimateProductionPerSecond(player: PlayerView): ResourceNumbers {
    if (this.game === null) throw new Error("Not initialized");
    const equalRegen = resourceRegenDelta(
      player.resources(),
      player.resourceCapacity(),
      1 / 3,
    );
    const totalRegen =
      equalRegen.food + equalRegen.energy + equalRegen.materials;
    const terrainWeights = this.terrainResourceWeights(player.smallID());
    const production = splitTotalResourceProduction(totalRegen, terrainWeights);
    const capacity = player.resourceCapacity();
    const resources = player.resources();
    return {
      food:
        Number(
          clampResourceAmount(production.food, resources.food, capacity.food),
        ) * 10,
      energy:
        Number(
          clampResourceAmount(
            production.energy,
            resources.energy,
            capacity.energy,
          ),
        ) * 10,
      materials:
        Number(
          clampResourceAmount(
            production.materials,
            resources.materials,
            capacity.materials,
          ),
        ) * 10,
    };
  }

  private terrainResourceWeights(playerID: number): ResourceStockpile {
    if (this.game === null) throw new Error("Not initialized");
    const weights = createZeroResources();
    const totalTiles = this.game.width() * this.game.height();
    for (let tile = 0; tile < totalTiles; tile++) {
      if (this.game.ownerID(tile) !== playerID) continue;
      switch (this.game.terrainType(tile)) {
        case TerrainType.Plains:
          weights.food += 1n;
          weights.energy += 2n;
          weights.materials += 1n;
          break;
        case TerrainType.Highland:
          weights.food += 2n;
          weights.energy += 1n;
          weights.materials += 1n;
          break;
        case TerrainType.Mountain:
          weights.food += 1n;
          weights.energy += 1n;
          weights.materials += 2n;
          break;
        default:
          break;
      }
    }
    return weights;
  }

  private updateEconomyView() {
    const myPlayer = this.game?.myPlayer();
    if (myPlayer === null || myPlayer === undefined) {
      this.economyRows = [];
      return;
    }

    const latest = this.economySamples[this.economySamples.length - 1];
    const earliest = this.economySamples[0];
    const previous = this.economySamples.find(
      (sample) =>
        latest !== undefined &&
        sample.atMs >= latest.atMs - ECONOMY_WINDOW_MS / 2,
    );
    const elapsedSeconds =
      latest !== undefined && earliest !== undefined
        ? Math.max(1, (latest.atMs - earliest.atMs) / 1000)
        : 1;
    const railWindowSeconds = ECONOMY_WINDOW_MS / 1000;
    const railImports = this.sumSamples(this.railImportEvents);
    const resources = resourceNumbers(myPlayer.resources());
    const capacity = resourceNumbers(myPlayer.resourceCapacity());
    const production = latest?.production ?? zeroResourceNumbers();
    const previousProduction = previous?.production ?? production;

    this.economyRows = (["food", "energy", "materials"] as ResourceKind[]).map(
      (key) => ({
        key,
        label: RESOURCE_LABELS[key],
        stock: resources[key],
        capacity: capacity[key],
        netPerSecond:
          latest !== undefined && earliest !== undefined
            ? (latest.resources[key] - earliest.resources[key]) / elapsedSeconds
            : 0,
        productionPerSecond: production[key],
        railPerSecond: railImports[key] / railWindowSeconds,
        productionChange: production[key] - previousProduction[key],
      }),
    );

    this.requestUpdate();
  }

  private sumSamples(samples: EconomySample[]): ResourceNumbers {
    return samples.reduce(
      (acc, sample) => ({
        food: acc.food + sample.resources.food,
        energy: acc.energy + sample.resources.energy,
        materials: acc.materials + sample.resources.materials,
      }),
      zeroResourceNumbers(),
    );
  }

  private handleRowClickPlayer(player: PlayerView) {
    if (this.eventBus === null) return;
    this.eventBus.emit(new GoToPlayerEvent(player));
  }

  render() {
    if (!this.visible) {
      return html``;
    }
    if (this.economyMode) {
      return this.renderEconomyView();
    }
    return html`
      <div
        class="max-h-[35vh] overflow-y-auto text-white text-xs md:text-xs lg:text-sm md:max-h-[50vh] mt-2 ${this
          .visible
          ? ""
          : "hidden"}"
        @contextmenu=${(e: Event) => e.preventDefault()}
      >
        <div
          class="grid bg-gray-800/85 w-full text-xs md:text-xs lg:text-sm rounded-lg overflow-hidden"
          style="grid-template-columns: minmax(24px, 30px) minmax(60px, 100px) minmax(45px, 70px) minmax(40px, 55px) minmax(55px, 105px);"
        >
          <div class="contents font-bold bg-gray-700/60">
            <div class="py-1 md:py-2 text-center border-b border-slate-500">
              #
            </div>
            <div
              class="py-1 md:py-2 text-center border-b border-slate-500 truncate"
            >
              ${translateText("leaderboard.player")}
            </div>
            <div
              class="py-1 md:py-2 text-center border-b border-slate-500 cursor-pointer whitespace-nowrap truncate"
              @click=${() => this.setSort("tiles")}
            >
              ${translateText("leaderboard.owned")}
              ${this._sortKey === "tiles"
                ? this._sortOrder === "asc"
                  ? "⬆️"
                  : "⬇️"
                : ""}
            </div>
            <div
              class="py-1 md:py-2 text-center border-b border-slate-500 cursor-pointer whitespace-nowrap truncate"
              @click=${() => this.setSort("gold")}
            >
              ${translateText("leaderboard.gold")}
              ${this._sortKey === "gold"
                ? this._sortOrder === "asc"
                  ? "⬆️"
                  : "⬇️"
                : ""}
            </div>
            <div
              class="py-1 md:py-2 text-center border-b border-slate-500 cursor-pointer whitespace-nowrap truncate"
              @click=${() => this.setSort("maxtroops")}
            >
              ${translateText("leaderboard.maxtroops")}
              ${this._sortKey === "maxtroops"
                ? this._sortOrder === "asc"
                  ? "⬆️"
                  : "⬇️"
                : ""}
            </div>
          </div>

          ${repeat(
            this.players,
            (p) => p.player.id(),
            (player, index) => html`
              <div
                class="contents hover:bg-slate-600/60 ${player.isOnSameTeam
                  ? "font-bold"
                  : ""} cursor-pointer"
                @click=${() => this.handleRowClickPlayer(player.player)}
              >
                <div
                  class="py-1 md:py-2 text-center ${index <
                  this.players.length - 1
                    ? "border-b border-slate-500"
                    : ""}"
                >
                  ${player.position}
                </div>
                <div
                  class="py-1 md:py-2 text-center ${index <
                  this.players.length - 1
                    ? "border-b border-slate-500"
                    : ""} truncate"
                >
                  ${player.name}
                </div>
                <div
                  class="py-1 md:py-2 text-center ${index <
                  this.players.length - 1
                    ? "border-b border-slate-500"
                    : ""}"
                >
                  ${player.score}
                </div>
                <div
                  class="py-1 md:py-2 text-center ${index <
                  this.players.length - 1
                    ? "border-b border-slate-500"
                    : ""}"
                >
                  ${player.gold}
                </div>
                <div
                  class="py-1 md:py-2 text-center ${index <
                  this.players.length - 1
                    ? "border-b border-slate-500"
                    : ""}"
                >
                  ${player.maxTroops}
                </div>
              </div>
            `,
          )}
        </div>
      </div>

      <button
        class="mt-2 p-0.5 px-1.5 md:px-2 text-xs md:text-xs lg:text-sm 
        border rounded-md border-slate-500 transition-colors
        text-white mx-auto block hover:bg-white/10 bg-gray-700/50"
        @click=${() => {
          this.showTopFive = !this.showTopFive;
          this.updateLeaderboard();
        }}
      >
        ${this.showTopFive ? "+" : "-"}
      </button>
    `;
  }

  private renderEconomyView() {
    const totalStock = this.economyRows.reduce(
      (sum, row) => sum + row.stock,
      0,
    );
    const totalCapacity = this.economyRows.reduce(
      (sum, row) => sum + row.capacity,
      0,
    );
    const capacityText =
      totalCapacity > 0
        ? `${renderNumber(totalStock)} / ${renderNumber(totalCapacity)}`
        : "0 / 0";

    return html`
      <div
        class="mt-2 w-[320px] max-w-[42vw] text-white text-xs md:text-xs lg:text-sm bg-gray-800/85 rounded-lg overflow-hidden"
        @contextmenu=${(e: Event) => e.preventDefault()}
      >
        <div class="px-3 py-2 bg-gray-700/70 font-bold">
          Economy
          <span class="float-right font-normal text-slate-300"
            >${capacityText}</span
          >
        </div>
        <div class="divide-y divide-slate-600/70">
          ${this.economyRows.map((row) => this.renderEconomyRow(row))}
        </div>
      </div>
    `;
  }

  private renderEconomyRow(row: ResourceEconomyRow) {
    const fillPercent =
      row.capacity <= 0
        ? 0
        : Math.max(0, Math.min(100, (row.stock / row.capacity) * 100));
    return html`
      <div class="px-3 py-2">
        <div class="flex items-center justify-between gap-2">
          <div class="font-semibold">${row.label}</div>
          <div class="text-slate-200">
            ${renderNumber(row.stock)} / ${renderNumber(row.capacity)}
          </div>
        </div>
        <div class="mt-1 h-1.5 bg-black/35 overflow-hidden rounded-sm">
          <div
            class="h-full ${RESOURCE_COLORS[row.key]}"
            style="width: ${fillPercent}%"
          ></div>
        </div>
        <div class="mt-2 grid grid-cols-4 gap-2 text-[11px] leading-tight">
          ${this.renderEconomyMetric("Net", row.netPerSecond)}
          ${this.renderEconomyMetric("Prod", row.productionPerSecond)}
          ${this.renderEconomyMetric("Rail", row.railPerSecond)}
          ${this.renderEconomyMetric("ΔProd", row.productionChange)}
        </div>
      </div>
    `;
  }

  private renderEconomyMetric(label: string, value: number) {
    const valueClass =
      value > 0
        ? "text-emerald-300"
        : value < 0
          ? "text-red-300"
          : "text-slate-300";
    return html`
      <div>
        <div class="text-slate-400">${label}</div>
        <div class="${valueClass} tabular-nums">${formatSignedRate(value)}</div>
      </div>
    `;
  }
}

function resourceNumbers(resources: ResourceStockpile): ResourceNumbers {
  return {
    food: Number(resources.food),
    energy: Number(resources.energy),
    materials: Number(resources.materials),
  };
}

function zeroResourceNumbers(): ResourceNumbers {
  return { food: 0, energy: 0, materials: 0 };
}

function splitTotalResourceProduction(
  total: bigint,
  weights: ResourceStockpile,
): ResourceStockpile {
  const totalWeight = weights.food + weights.energy + weights.materials;
  if (total <= 0n || totalWeight <= 0n) return createZeroResources();
  const food = (total * weights.food) / totalWeight;
  const energy = (total * weights.energy) / totalWeight;
  return {
    food,
    energy,
    materials: total - food - energy,
  };
}

function clampResourceAmount(
  amount: bigint,
  current: bigint,
  capacity: bigint,
): bigint {
  if (amount <= 0n) return amount;
  const available = capacity > current ? capacity - current : 0n;
  return amount < available ? amount : available;
}

function formatSignedRate(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${renderNumber(Math.abs(value))}/s`;
}
