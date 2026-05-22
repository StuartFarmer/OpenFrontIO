import { html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { assetUrl } from "../../../core/AssetUrls";
import { EventBus } from "../../../core/EventBus";
import { TerrainType, type Gold } from "../../../core/game/Game";
import { GameView } from "../../../core/game/GameView";
import type {
  ResourceKind,
  ResourceStockpile,
} from "../../../core/game/Resources";
import { createZeroResources } from "../../../core/game/Resources";
import { UserSettings } from "../../../core/game/UserSettings";
import { ClientID } from "../../../core/Schemas";
import { Controller } from "../../Controller";
import { AttackRatioEvent } from "../../InputHandler";
import { UIState } from "../../UIState";
import { renderNumber, renderTroops } from "../../Utils";
const goldCoinIcon = assetUrl("images/GoldCoinIcon.svg");
const soldierIcon = assetUrl("images/SoldierIcon.svg");
const swordIcon = assetUrl("images/SwordIcon.svg");
const biomassIcon = assetUrl("icons/biomass-icon.svg");
const fuelIcon = assetUrl("icons/fuel-icon.svg");
const metalIcon = assetUrl("icons/metal-icon.svg");

type MetricKey = "troops" | ResourceKind;
type BlendKind = "import" | "export";

interface ResourceBlendPercents {
  food: number;
  energy: number;
  materials: number;
}

interface MetricView {
  key: MetricKey;
  label: string;
  shortLabel: string;
  value: number | bigint;
  capacity: number | bigint;
  rate: number;
  rateIsIncreasing: boolean;
  barClass: string;
  borderClass: string;
  textClass: string;
  icon: ReturnType<typeof html>;
}

@customElement("control-panel")
export class ControlPanel extends LitElement implements Controller {
  public game: GameView;
  public clientID: ClientID;
  public eventBus: EventBus;
  public uiState: UIState;

  @state()
  private attackRatio: number = 0.2;

  @state()
  private _maxTroops: number = 0;

  @state()
  private troopRate: number = 0;

  @state()
  private _troops: number = 0;

  @state()
  private _isVisible = false;

  @state()
  private _gold: Gold = 0n;

  @state()
  private _resources: ResourceStockpile = createZeroResources();

  @state()
  private _resourceCapacity: ResourceStockpile = createZeroResources();

  @state()
  private _attackingTroops: number = 0;

  @state()
  private _selectedMetric: MetricKey = "troops";

  @state()
  private _importBlendFirst = 34;

  @state()
  private _importBlendSecond = 67;

  @state()
  private _exportBlendFirst = 34;

  @state()
  private _exportBlendSecond = 67;

  @state()
  private _productionBlend: ResourceBlendPercents = {
    food: 34,
    energy: 33,
    materials: 33,
  };

  private _activeBlend: { kind: BlendKind; handle: "first" | "second" } | null =
    null;

  private _troopRateIsIncreasing: boolean = true;

  private _lastTroopIncreaseRate: number = 0;

  private _lastProductionBlendSampleAt = -Infinity;

  private _resourceRates: Record<ResourceKind, number> = {
    food: 0,
    energy: 0,
    materials: 0,
  };

  private _lastResourceRateSample: ResourceStockpile | null = null;

  getTickIntervalMs() {
    return 100;
  }

  init() {
    this.attackRatio = new UserSettings().attackRatio();
    this.uiState.attackRatio = this.attackRatio;
    this.updateResourceImportBlend();
    this.updateResourceExportBlend();
    this.eventBus.on(AttackRatioEvent, (event) => {
      let newAttackRatio = this.attackRatio + event.attackRatio / 100;

      if (newAttackRatio < 0.01) {
        newAttackRatio = 0.01;
      }

      if (newAttackRatio > 1) {
        newAttackRatio = 1;
      }

      if (newAttackRatio === 0.11 && this.attackRatio === 0.01) {
        // If we're changing the ratio from 1%, then set it to 10% instead of 11% to keep a consistency
        newAttackRatio = 0.1;
      }

      this.attackRatio = newAttackRatio;
      this.onAttackRatioChange(this.attackRatio);
    });
  }

  tick() {
    if (!this._isVisible && !this.game.inSpawnPhase()) {
      this.setVisibile(true);
    }

    const player = this.game.myPlayer();
    if (player === null || !player.isAlive()) {
      this.setVisibile(false);
      return;
    }

    this.updateTroopIncrease();

    this._maxTroops = this.game.config().maxTroops(player);
    this._gold = player.gold();
    const nextResources = player.resources();
    this.updateResourceRates(nextResources);
    this._resources = nextResources;
    this._resourceCapacity = player.resourceCapacity();
    this._troops = player.troops();
    this.updateProductionBlend();
    this._attackingTroops = player
      .outgoingAttacks()
      .map((a) => a.troops)
      .reduce((a, b) => a + b, 0);
    this.troopRate = this.game.config().troopIncreaseRate(player) * 10;
    this.requestUpdate();
  }

  private updateTroopIncrease() {
    const player = this.game?.myPlayer();
    if (player === null) return;
    const troopIncreaseRate = this.game.config().troopIncreaseRate(player);
    this._troopRateIsIncreasing =
      troopIncreaseRate >= this._lastTroopIncreaseRate;
    this._lastTroopIncreaseRate = troopIncreaseRate;
  }

  private updateResourceRates(nextResources: ResourceStockpile) {
    if (this._lastResourceRateSample === null) {
      this._lastResourceRateSample = nextResources;
      return;
    }

    const ticksPerSecond = 1000 / this.getTickIntervalMs();
    this._resourceRates = {
      food:
        Number(nextResources.food - this._lastResourceRateSample.food) *
        ticksPerSecond,
      energy:
        Number(nextResources.energy - this._lastResourceRateSample.energy) *
        ticksPerSecond,
      materials:
        Number(
          nextResources.materials - this._lastResourceRateSample.materials,
        ) * ticksPerSecond,
    };
    this._lastResourceRateSample = nextResources;
  }

  onAttackRatioChange(newRatio: number) {
    this.uiState.attackRatio = newRatio;
  }

  private updateResourceImportBlend() {
    if (this.uiState === undefined) return;
    this.uiState.resourceImportBlend = {
      food: this._importBlendFirst,
      energy: this._importBlendSecond - this._importBlendFirst,
      materials: 100 - this._importBlendSecond,
    };
  }

  private updateResourceExportBlend() {
    if (this.uiState === undefined) return;
    this.uiState.resourceExportBlend = {
      food: this._exportBlendFirst,
      energy: this._exportBlendSecond - this._exportBlendFirst,
      materials: 100 - this._exportBlendSecond,
    };
  }

  private updateProductionBlend() {
    const now = performance.now();
    if (now - this._lastProductionBlendSampleAt < 1000) return;
    this._lastProductionBlendSampleAt = now;

    const player = this.game?.myPlayer();
    if (player === null || player === undefined) return;

    const weights = {
      food: 0,
      energy: 0,
      materials: 0,
    };
    const playerID = player.smallID();
    const totalTiles = this.game.width() * this.game.height();

    for (let tile = 0; tile < totalTiles; tile++) {
      if (this.game.ownerID(tile) !== playerID) continue;
      switch (this.game.terrainType(tile)) {
        case TerrainType.Plains:
          weights.food += 1;
          weights.energy += 2;
          weights.materials += 1;
          break;
        case TerrainType.Highland:
          weights.food += 2;
          weights.energy += 1;
          weights.materials += 1;
          break;
        case TerrainType.Mountain:
          weights.food += 1;
          weights.energy += 1;
          weights.materials += 2;
          break;
        default:
          break;
      }
    }

    this._productionBlend = normalizeBlend(weights);
  }

  private handleBlendPointerDown(
    kind: BlendKind,
    e: PointerEvent,
    handle?: "first" | "second",
  ) {
    e.preventDefault();
    e.stopPropagation();
    const target =
      handle === undefined
        ? (e.currentTarget as HTMLElement)
        : ((e.currentTarget as HTMLElement).parentElement as HTMLElement);
    target.setPointerCapture(e.pointerId);
    const percent = this.blendPercentFromPointer(e, target);
    this._activeBlend = {
      kind,
      handle: handle ?? this.nearestBlendHandle(kind, percent),
    };
    this.updateBlendHandle(percent);
  }

  private handleBlendPointerMove(e: PointerEvent) {
    if (this._activeBlend === null) return;
    const target = e.currentTarget as HTMLElement;
    this.updateBlendHandle(this.blendPercentFromPointer(e, target));
  }

  private handleBlendPointerUp(e: PointerEvent) {
    const target = e.currentTarget as HTMLElement;
    if (target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId);
    }
    this._activeBlend = null;
  }

  private blendPercentFromPointer(e: PointerEvent, target: HTMLElement) {
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    return Math.max(
      0,
      Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)),
    );
  }

  private nearestBlendHandle(
    kind: BlendKind,
    percent: number,
  ): "first" | "second" {
    const first =
      kind === "import" ? this._importBlendFirst : this._exportBlendFirst;
    const second =
      kind === "import" ? this._importBlendSecond : this._exportBlendSecond;
    return Math.abs(percent - first) <= Math.abs(percent - second)
      ? "first"
      : "second";
  }

  private updateBlendHandle(percent: number) {
    if (this._activeBlend === null) return;

    if (this._activeBlend.kind === "import") {
      if (this._activeBlend.handle === "first") {
        this._importBlendFirst = Math.min(percent, this._importBlendSecond);
      } else {
        this._importBlendSecond = Math.max(percent, this._importBlendFirst);
      }
      this.updateResourceImportBlend();
      return;
    }

    if (this._activeBlend.handle === "first") {
      this._exportBlendFirst = Math.min(percent, this._exportBlendSecond);
    } else {
      this._exportBlendSecond = Math.max(percent, this._exportBlendFirst);
    }
    this.updateResourceExportBlend();
  }

  setVisibile(visible: boolean) {
    this._isVisible = visible;
    this.requestUpdate();
  }

  private handleRatioSliderInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const value = Number(input.value);
    this.attackRatio = value / 100;
    this.onAttackRatioChange(this.attackRatio);
  }

  private handleRatioSliderPointerUp(e: Event) {
    (e.target as HTMLInputElement).blur();
  }

  private calculateMetricBar(metric: MetricView): {
    greenPercent: number;
    orangePercent: number;
  } {
    const capacity = Math.max(Number(metric.capacity), 1);
    const greenPercentRaw = (Number(metric.value) / capacity) * 100;
    const orangePercentRaw =
      metric.key === "troops" ? (this._attackingTroops / capacity) * 100 : 0;

    const greenPercent = Math.max(0, Math.min(100, greenPercentRaw));
    const orangePercent = Math.max(
      0,
      Math.min(100 - greenPercent, orangePercentRaw),
    );

    return { greenPercent, orangePercent };
  }

  private metricValueText(metric: MetricView): string {
    if (metric.key === "troops") {
      return renderTroops(Number(metric.value));
    }
    return renderNumber(metric.value);
  }

  private metricRateText(metric: MetricView): string {
    const sign = metric.rate >= 0 ? "+" : "-";
    const amount = Math.abs(metric.rate);
    if (metric.key === "troops") {
      return `${sign}${renderTroops(amount)}/s`;
    }
    return `${sign}${renderNumber(Math.round(amount))}/s`;
  }

  private metricView(key: MetricKey): MetricView {
    const metrics: Record<MetricKey, MetricView> = {
      troops: {
        key: "troops",
        label: "Troops",
        shortLabel: "Troops",
        value: this._troops,
        capacity: this._maxTroops,
        rate: this.troopRate,
        rateIsIncreasing: this._troopRateIsIncreasing,
        barClass: "bg-malibu-blue",
        borderClass: "border-blue-300/80",
        textClass: "text-blue-200",
        icon: html`<img
          src=${soldierIcon}
          alt=""
          aria-hidden="true"
          width="14"
          height="14"
          class="shrink-0"
        />`,
      },
      food: {
        key: "food",
        label: "Biomass",
        shortLabel: "Bio",
        value: this._resources.food,
        capacity: this._resourceCapacity.food,
        rate: this._resourceRates.food,
        rateIsIncreasing: this._resourceRates.food >= 0,
        barClass: "bg-green-500",
        borderClass: "border-green-400/80",
        textClass: "text-green-300",
        icon: this.renderResourceIcon("food", "h-4 w-4"),
      },
      energy: {
        key: "energy",
        label: "Fuels",
        shortLabel: "Fuel",
        value: this._resources.energy,
        capacity: this._resourceCapacity.energy,
        rate: this._resourceRates.energy,
        rateIsIncreasing: this._resourceRates.energy >= 0,
        barClass: "bg-cyan-500",
        borderClass: "border-cyan-400/80",
        textClass: "text-cyan-300",
        icon: this.renderResourceIcon("energy", "h-4 w-4"),
      },
      materials: {
        key: "materials",
        label: "Metals",
        shortLabel: "Metal",
        value: this._resources.materials,
        capacity: this._resourceCapacity.materials,
        rate: this._resourceRates.materials,
        rateIsIncreasing: this._resourceRates.materials >= 0,
        barClass: "bg-stone-300",
        borderClass: "border-stone-300/80",
        textClass: "text-stone-200",
        icon: this.renderResourceIcon("materials", "h-4 w-4"),
      },
    };

    return metrics[key];
  }

  private renderResourceIcon(kind: ResourceKind, sizeClass: string) {
    const src =
      kind === "food" ? biomassIcon : kind === "energy" ? fuelIcon : metalIcon;
    return html`<img
      src=${src}
      alt=""
      aria-hidden="true"
      class="${sizeClass} shrink-0"
      style="filter: brightness(0) invert(1) drop-shadow(0 1px 1px rgba(0,0,0,0.8));"
    />`;
  }

  private selectedMetric(): MetricView {
    return this.metricView(this._selectedMetric);
  }

  private metricTabs(): MetricView[] {
    return [
      this.metricView("troops"),
      this.metricView("food"),
      this.metricView("energy"),
      this.metricView("materials"),
    ];
  }

  private renderMetricBar(metric: MetricView, compact: boolean) {
    const { greenPercent, orangePercent } = this.calculateMetricBar(metric);
    return html`
      <div
        class="w-full h-6 border border-gray-600 rounded-md bg-gray-900/60 overflow-hidden relative"
      >
        <div class="h-full flex">
          ${greenPercent > 0
            ? html`<div
                class="h-full ${metric.barClass} transition-[width] duration-200"
                style="width: ${greenPercent}%;"
              ></div>`
            : ""}
          ${orangePercent > 0
            ? html`<div
                class="h-full bg-aquarius transition-[width] duration-200"
                style="width: ${orangePercent}%;"
              ></div>`
            : ""}
        </div>
        <div
          class="absolute inset-0 flex items-center ${compact
            ? "justify-between px-1.5 text-xs"
            : "text-lg"} font-bold leading-none pointer-events-none"
          translate="no"
        >
          ${compact
            ? html`
                <span class="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
                  >${this.metricValueText(metric)}</span
                >
                <span class="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
                  >${this.metricValueText({
                    ...metric,
                    value: metric.capacity,
                  })}</span
                >
              `
            : html`
                <span
                  class="flex-1 flex justify-end h-full items-center pr-0.5"
                >
                  <span
                    class="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
                    >${this.metricValueText(metric)}</span
                  >
                </span>
                <span
                  class="h-full flex items-center px-0.5 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
                  >/</span
                >
                <span
                  class="flex-1 flex justify-start h-full items-center pl-0.5 gap-0.5"
                >
                  <span
                    class="text-white tabular-nums w-[3.5rem] drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
                    >${this.metricValueText({
                      ...metric,
                      value: metric.capacity,
                    })}</span
                  >
                  <span class="ml-1.5">${metric.icon}</span>
                </span>
              `}
        </div>
      </div>
    `;
  }

  private renderRatePill(metric: MetricView, compact = false) {
    return html`
      <div
        class="flex items-center gap-1 shrink-0 border rounded-md font-bold py-0.5 px-1 ${compact
          ? "text-xs w-[4.75rem]"
          : "text-sm w-[5.5rem]"} ${metric.rateIsIncreasing
          ? "border-green-400"
          : "border-orange-400"}"
        translate="no"
      >
        ${metric.icon}
        <span
          class="font-bold tabular-nums ${compact
            ? "text-xs"
            : "text-sm"} ${metric.rateIsIncreasing
            ? "text-green-400"
            : "text-orange-400"}"
          >${this.metricRateText(metric)}</span
        >
      </div>
    `;
  }

  private renderMetricTabs() {
    return html`
      <div class="grid grid-cols-4 gap-1 mb-1">
        ${this.metricTabs().map((metric) => {
          const selected = metric.key === this._selectedMetric;
          return html`
            <button
              class="flex min-w-0 items-center justify-between gap-1 rounded-md border px-1.5 py-0.5 text-xs font-bold transition-colors ${metric.borderClass} ${metric.textClass} ${selected
                ? "bg-white/15 ring-1 ring-white/60"
                : "bg-gray-900/30 hover:bg-white/10"}"
              type="button"
              aria-pressed=${selected ? "true" : "false"}
              @click=${() => {
                this._selectedMetric = metric.key;
              }}
              translate="no"
            >
              <span class="flex min-w-0 items-center gap-1">
                ${metric.icon}
                <span class="hidden sm:inline truncate">${metric.label}</span>
                <span class="sm:hidden truncate">${metric.shortLabel}</span>
              </span>
              <span class="min-w-0 truncate tabular-nums"
                >${this.metricValueText(metric)}</span
              >
            </button>
          `;
        })}
      </div>
    `;
  }

  private renderAttackRatioControl(compact = false) {
    return html`
      <div class="flex items-center gap-1.5" translate="no">
        <div
          class="${compact
            ? "flex flex-col items-center shrink-0 gap-0.5 w-8"
            : "flex items-center gap-1 shrink-0 border border-gray-600 rounded-md px-1 py-0.5 text-sm font-bold text-white cursor-pointer w-[8rem]"}"
        >
          <img
            src=${swordIcon}
            alt=""
            aria-hidden="true"
            width=${compact ? "10" : "12"}
            height=${compact ? "10" : "12"}
            style="filter: brightness(0) invert(1);"
          />
          <span
            class="text-white ${compact
              ? "text-xs"
              : ""} font-bold tabular-nums"
            >${(this.attackRatio * 100).toFixed(0)}%${compact
              ? ""
              : ` (${renderTroops(
                  (this.game?.myPlayer()?.troops() ?? 0) * this.attackRatio,
                )})`}</span
          >
        </div>
        <div class="flex-1">
          <input
            type="range"
            min="1"
            max="100"
            .value=${String(Math.round(this.attackRatio * 100))}
            @input=${(e: Event) => this.handleRatioSliderInput(e)}
            @pointerup=${(e: Event) => this.handleRatioSliderPointerUp(e)}
            class="w-full h-1.5 accent-aquarius cursor-pointer"
          />
        </div>
      </div>
    `;
  }

  private renderResourceBlendControl(compact = false) {
    return html`
      <div class="space-y-1" translate="no">
        ${this.renderBlendRow(
          compact ? "Prod" : "Production Blend",
          this._productionBlend,
          null,
          compact,
        )}
        ${this.renderBlendRow(
          compact ? "Import" : "Import Blend",
          {
            food: this._importBlendFirst,
            energy: this._importBlendSecond - this._importBlendFirst,
            materials: 100 - this._importBlendSecond,
          },
          {
            kind: "import",
            first: this._importBlendFirst,
            second: this._importBlendSecond,
          },
          compact,
        )}
        ${this.renderBlendRow(
          compact ? "Export" : "Export Blend",
          {
            food: this._exportBlendFirst,
            energy: this._exportBlendSecond - this._exportBlendFirst,
            materials: 100 - this._exportBlendSecond,
          },
          {
            kind: "export",
            first: this._exportBlendFirst,
            second: this._exportBlendSecond,
          },
          compact,
        )}
      </div>
    `;
  }

  private renderBlendRow(
    label: string,
    blend: ResourceBlendPercents,
    handles: { kind: BlendKind; first: number; second: number } | null,
    compact: boolean,
  ) {
    return html`
      <div class="flex items-center gap-2">
        <div
          class="shrink-0 ${compact
            ? "w-[4.75rem] text-[10px]"
            : "w-[7.75rem] text-xs"} font-bold text-slate-200 leading-none"
        >
          ${label}
        </div>
        ${this.renderBlendBar(blend, handles)}
      </div>
    `;
  }

  private renderBlendBar(
    blend: ResourceBlendPercents,
    handles: { kind: BlendKind; first: number; second: number } | null,
  ) {
    const interactive = handles !== null;
    return html`
      <div
        class="relative h-6 flex-1 ${interactive
          ? "cursor-pointer touch-none"
          : "pointer-events-none opacity-90"}"
        role=${interactive ? "slider" : "meter"}
        aria-label=${interactive
          ? `${handles.kind} resource blend`
          : "Production resource blend"}
        aria-valuetext="Biomass ${blend.food}%, Fuels ${blend.energy}%, Metals ${blend.materials}%"
        @pointerdown=${interactive
          ? (e: PointerEvent) => this.handleBlendPointerDown(handles.kind, e)
          : undefined}
        @pointermove=${interactive
          ? (e: PointerEvent) => this.handleBlendPointerMove(e)
          : undefined}
        @pointerup=${interactive
          ? (e: PointerEvent) => this.handleBlendPointerUp(e)
          : undefined}
        @pointercancel=${interactive
          ? (e: PointerEvent) => this.handleBlendPointerUp(e)
          : undefined}
      >
        <div
          class="absolute left-0 right-0 top-1/2 h-5 -translate-y-1/2 overflow-hidden rounded-full bg-gray-900/70 border border-gray-600"
        >
          <div class="flex h-full">
            <div
              class="h-full bg-green-500 flex items-center justify-center overflow-hidden"
              style="width: ${blend.food}%"
            >
              ${this.renderBlendSegmentText("food", blend.food)}
            </div>
            <div
              class="h-full bg-cyan-500 flex items-center justify-center overflow-hidden"
              style="width: ${blend.energy}%"
            >
              ${this.renderBlendSegmentText("energy", blend.energy)}
            </div>
            <div
              class="h-full bg-stone-300 flex items-center justify-center overflow-hidden"
              style="width: ${blend.materials}%"
            >
              ${this.renderBlendSegmentText("materials", blend.materials)}
            </div>
          </div>
        </div>
        ${handles === null
          ? ""
          : html`
              ${this.renderBlendHandle(handles.kind, "first", handles.first)}
              ${this.renderBlendHandle(handles.kind, "second", handles.second)}
            `}
      </div>
    `;
  }

  private renderBlendSegmentText(kind: ResourceKind, percent: number) {
    if (percent < 8) return html``;
    return html`
      <span
        class="inline-flex items-center justify-center gap-0.5 text-[10px] font-bold text-white leading-none tabular-nums drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)] whitespace-nowrap pointer-events-none"
        >${this.renderResourceIcon(kind, "h-3 w-3")} ${percent}%</span
      >
    `;
  }

  private renderBlendHandle(
    kind: BlendKind,
    handle: "first" | "second",
    percent: number,
  ) {
    return html`
      <button
        type="button"
        class="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-gray-900 shadow-md cursor-grab active:cursor-grabbing"
        style="left: ${percent}%"
        aria-label=${handle === "first"
          ? "Biomass and Fuels split"
          : "Fuels and Metals split"}
        @pointerdown=${(e: PointerEvent) =>
          this.handleBlendPointerDown(kind, e, handle)}
        @pointermove=${(e: PointerEvent) => this.handleBlendPointerMove(e)}
        @pointerup=${(e: PointerEvent) => this.handleBlendPointerUp(e)}
        @pointercancel=${(e: PointerEvent) => this.handleBlendPointerUp(e)}
      ></button>
    `;
  }

  private renderSelectedActionControl(compact = false) {
    return this._selectedMetric === "troops"
      ? this.renderAttackRatioControl(compact)
      : this.renderResourceBlendControl(compact);
  }

  private renderDesktop() {
    const metric = this.selectedMetric();
    return html`
      <!-- Row 1: metric tabs -->
      ${this.renderMetricTabs()}
      <!-- Row 2: selected metric rate | selected metric bar | gold -->
      <div class="flex gap-1.5 items-center mb-1">
        ${this.renderRatePill(metric)}
        <div class="flex-1">${this.renderMetricBar(metric, false)}</div>
        <div
          class="flex items-center gap-1 shrink-0 border rounded-md border-yellow-400 font-bold text-yellow-400 text-sm py-0.5 px-1 w-[4.5rem]"
          translate="no"
        >
          <img src=${goldCoinIcon} width="13" height="13" class="shrink-0" />
          <span class="tabular-nums">${renderNumber(this._gold)}</span>
        </div>
      </div>
      <!-- Row 3: attack ratio or resource import/export blends -->
      ${this.renderSelectedActionControl(false)}
    `;
  }

  private renderMobile() {
    const metric = this.selectedMetric();
    return html`
      <div>
        ${this.renderMetricTabs()}
        <div class="flex gap-1.5 items-center">
          ${this.renderRatePill(metric, true)}
          <div class="min-w-0 flex-1 flex items-center">
            ${this.renderMetricBar(metric, true)}
          </div>
          <div
            class="flex items-center justify-center p-1 gap-0.5 border rounded-md border-yellow-400 font-bold text-yellow-400 text-xs w-[3.75rem] shrink-0"
            translate="no"
          >
            <img src=${goldCoinIcon} width="13" height="13" />
            <span class="px-0.5">${renderNumber(this._gold)}</span>
          </div>
        </div>
        <div class="mt-1">${this.renderSelectedActionControl(true)}</div>
      </div>
    `;
  }

  render() {
    return html`
      <div
        class="relative pointer-events-auto ${this._isVisible
          ? "relative w-full text-sm px-2 py-1"
          : "hidden"}"
        @contextmenu=${(e: MouseEvent) => e.preventDefault()}
      >
        <div class="lg:hidden">${this.renderMobile()}</div>
        <div class="hidden lg:block">${this.renderDesktop()}</div>
      </div>
    `;
  }

  createRenderRoot() {
    return this; // Disable shadow DOM to allow Tailwind styles
  }
}

function normalizeBlend(weights: ResourceBlendPercents): ResourceBlendPercents {
  const total = weights.food + weights.energy + weights.materials;
  if (total <= 0) {
    return { food: 34, energy: 33, materials: 33 };
  }

  const food = Math.round((weights.food / total) * 100);
  const energy = Math.round((weights.energy / total) * 100);
  return {
    food,
    energy,
    materials: Math.max(0, 100 - food - energy),
  };
}
