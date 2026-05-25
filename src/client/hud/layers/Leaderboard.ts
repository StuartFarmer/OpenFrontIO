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
import "../ui/HudComponents";

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

const RESOURCE_TONES: Record<ResourceKind, "green" | "cyan" | "slate"> = {
  food: "green",
  energy: "cyan",
  materials: "slate",
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

  connectedCallback() {
    super.connectedCallback();
    this.classList.add("block", "w-full");
  }

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

  private sortMark(key: "tiles" | "gold" | "maxtroops") {
    if (this._sortKey !== key) return "";
    return this._sortOrder === "asc" ? " ▲" : " ▼";
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
        class="mt-2 w-full max-h-[35vh] md:max-h-[50vh] overflow-y-auto font-mono tabular-nums text-white bg-gray-800/88 backdrop-blur-sm shadow-xs rounded-[3px] ${this
          .visible
          ? ""
          : "hidden"}"
        @contextmenu=${(e: Event) => e.preventDefault()}
      >
        <hud-table>
          <hud-table-row>
            <hud-table-cell header align="center">#</hud-table-cell>
            <hud-table-cell header align="left" truncate>
              ${hudLabel("leaderboard.player", "Player")}
            </hud-table-cell>
            <hud-table-cell
              header
              style="cursor: pointer"
              @click=${() => this.setSort("tiles")}
            >
              ${hudLabel("leaderboard.owned", "Owned")}${this.sortMark("tiles")}
            </hud-table-cell>
            <hud-table-cell
              header
              style="cursor: pointer"
              @click=${() => this.setSort("gold")}
            >
              ${hudLabel("leaderboard.gold", "Gold")}${this.sortMark("gold")}
            </hud-table-cell>
            <hud-table-cell
              header
              style="cursor: pointer"
              @click=${() => this.setSort("maxtroops")}
            >
              ${hudLabel("leaderboard.maxtroops", "Max")}${this.sortMark(
                "maxtroops",
              )}
            </hud-table-cell>
          </hud-table-row>
          ${repeat(
            this.players,
            (p) => p.player.id(),
            (player) => html`
              <hud-table-row
                interactive
                ?selected=${player.isOnSameTeam}
                @click=${() => this.handleRowClickPlayer(player.player)}
              >
                <hud-table-cell align="center"
                  >${player.position}</hud-table-cell
                >
                <hud-table-cell align="left" truncate>
                  ${player.name}
                </hud-table-cell>
                <hud-table-cell>${player.score}</hud-table-cell>
                <hud-table-cell>${player.gold}</hud-table-cell>
                <hud-table-cell>${player.maxTroops}</hud-table-cell>
              </hud-table-row>
            `,
          )}
        </hud-table>
      </div>

      <hud-button
        class="mt-2 mx-auto block"
        @click=${() => {
          this.showTopFive = !this.showTopFive;
          this.updateLeaderboard();
        }}
      >
        ${this.showTopFive ? "+" : "-"}
      </hud-button>
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
      <hud-surface
        class="mt-2 w-[320px] max-w-[42vw] overflow-hidden font-mono tabular-nums text-white bg-gray-800/88 backdrop-blur-sm shadow-xs rounded-[3px]"
        @contextmenu=${(e: Event) => e.preventDefault()}
      >
        <hud-surface-header>
          <span>Economy</span>
          <span>${capacityText}</span>
        </hud-surface-header>
        <hud-surface-body class="space-y-2">
          ${this.economyRows.map((row) => this.renderEconomyRow(row))}
        </hud-surface-body>
      </hud-surface>
    `;
  }

  private renderEconomyRow(row: ResourceEconomyRow) {
    const fillPercent =
      row.capacity <= 0
        ? 0
        : Math.max(0, Math.min(100, (row.stock / row.capacity) * 100));
    return html`
      <div class="space-y-2">
        <hud-meter
          variant="mini"
          .segments=${[{ width: fillPercent, tone: RESOURCE_TONES[row.key] }]}
          .label=${html`<span>${row.label}</span>
            <span
              >${renderNumber(row.stock)} / ${renderNumber(row.capacity)}</span
            >`}
          label-align="between"
        ></hud-meter>
        <hud-stat-grid>
          ${this.renderEconomyMetric("Net", row.netPerSecond)}
          ${this.renderEconomyMetric("Prod", row.productionPerSecond)}
          ${this.renderEconomyMetric("Rail", row.railPerSecond)}
          ${this.renderEconomyMetric("ΔProd", row.productionChange)}
        </hud-stat-grid>
      </div>
    `;
  }

  private renderEconomyMetric(label: string, value: number) {
    const tone = value > 0 ? "success" : value < 0 ? "danger" : "default";
    return html`<hud-stat
      .label=${label}
      .value=${formatSignedRate(value)}
      .tone=${tone}
    ></hud-stat>`;
  }
}

function hudLabel(key: string, fallback: string): string {
  const translated = translateText(key);
  return translated === key ? fallback : translated;
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
