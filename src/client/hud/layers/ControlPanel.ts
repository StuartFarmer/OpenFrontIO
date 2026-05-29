import { html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { assetUrl } from "../../../core/AssetUrls";
import { EventBus } from "../../../core/EventBus";
import { type Gold } from "../../../core/game/Game";
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
import { SendFoodAllocationIntentEvent } from "../../Transport";
import { UIState } from "../../UIState";
import { renderNumber, renderTroops } from "../../Utils";
import "../ui/HudComponents";
const goldCoinIcon = assetUrl("images/GoldCoinIcon.svg");
const soldierIcon = assetUrl("images/SoldierIcon.svg");
const swordIcon = assetUrl("images/SwordIcon.svg");
const biomassIcon = assetUrl("icons/biomass-icon.svg");
const fuelIcon = assetUrl("icons/fuel-icon.svg");
const metalIcon = assetUrl("icons/metal-icon.svg");

type MetricKey = "troops" | ResourceKind;

interface MetricView {
  key: MetricKey;
  label: string;
  shortLabel: string;
  iconSrc: string;
  value: number | bigint;
  capacity: number | bigint;
  rate: number;
  rateIsIncreasing: boolean;
  barTone: "blue" | "cyan" | "slate" | "green";
  iconTone: "active" | "success" | "default";
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
  private foodAllocationToPopulation = 0.5;

  @state()
  private nutritionHealth = 1;

  private _hasSyncedFoodAllocation = false;

  private _troopRateIsIncreasing: boolean = true;

  private _lastTroopIncreaseRate: number = 0;

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
    if (this.uiState.foodAllocationToPopulation !== undefined) {
      this.foodAllocationToPopulation = this.uiState.foodAllocationToPopulation;
    }
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
    if (!this._hasSyncedFoodAllocation) {
      this.foodAllocationToPopulation =
        this.uiState?.foodAllocationToPopulation ??
        player.foodAllocationToPopulation() ??
        this.foodAllocationToPopulation;
      if (this.uiState !== undefined) {
        this.uiState.foodAllocationToPopulation =
          this.foodAllocationToPopulation;
      }
      this._hasSyncedFoodAllocation = true;
    }

    this.updateTroopIncrease();

    this._maxTroops = player.effectiveTroopCapacity();
    this._gold = player.gold();
    const nextResources = player.resources();
    this.updateResourceRates(nextResources);
    this._resources = nextResources;
    this._resourceCapacity = player.resourceCapacity();
    this.nutritionHealth = player.nutritionHealth();
    this._troops = player.troops();
    this._attackingTroops = player
      .outgoingAttacks()
      .map((a) => a.troops)
      .reduce((a, b) => a + b, 0);
    this.troopRate = player.troopIncreaseRate() * 10;
    this.requestUpdate();
  }

  private updateTroopIncrease() {
    const player = this.game?.myPlayer();
    if (player === null) return;
    const troopIncreaseRate = player.troopIncreaseRate();
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

  private onFoodAllocationChange(newRatio: number) {
    if (this.uiState === undefined) return;
    this.uiState.foodAllocationToPopulation = newRatio;
    this.eventBus?.emit(new SendFoodAllocationIntentEvent(newRatio));
  }

  setVisibile(visible: boolean) {
    this._isVisible = visible;
    this.requestUpdate();
  }

  private handleRatioSliderChange(event: CustomEvent<{ value: number }>) {
    const value = event.detail.value;
    this.attackRatio = value / 100;
    this.onAttackRatioChange(this.attackRatio);
  }

  private handleBiomassAllocationSliderChange(
    event: CustomEvent<{ value: number }>,
  ) {
    const value = Math.max(0, Math.min(100, event.detail.value));
    this.foodAllocationToPopulation = value / 100;
    this.onFoodAllocationChange(this.foodAllocationToPopulation);
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
        iconSrc: soldierIcon,
        value: this._troops,
        capacity: this._maxTroops,
        rate: this.troopRate,
        rateIsIncreasing: this._troopRateIsIncreasing,
        barTone: "blue",
        iconTone: "active",
        icon: html`<hud-icon
          .src=${soldierIcon}
          size="sm"
          tone="active"
        ></hud-icon>`,
      },
      food: {
        key: "food",
        label: "Biomass",
        shortLabel: "Bio",
        iconSrc: biomassIcon,
        value: this._resources.food,
        capacity: this._resourceCapacity.food,
        rate: this._resourceRates.food,
        rateIsIncreasing: this._resourceRates.food >= 0,
        barTone: "green",
        iconTone: "success",
        icon: this.renderResourceIcon("food", "h-4 w-4"),
      },
      energy: {
        key: "energy",
        label: "Fuels",
        shortLabel: "Fuel",
        iconSrc: fuelIcon,
        value: this._resources.energy,
        capacity: this._resourceCapacity.energy,
        rate: this._resourceRates.energy,
        rateIsIncreasing: this._resourceRates.energy >= 0,
        barTone: "cyan",
        iconTone: "active",
        icon: this.renderResourceIcon("energy", "h-4 w-4"),
      },
      materials: {
        key: "materials",
        label: "Metals",
        shortLabel: "Metal",
        iconSrc: metalIcon,
        value: this._resources.materials,
        capacity: this._resourceCapacity.materials,
        rate: this._resourceRates.materials,
        rateIsIncreasing: this._resourceRates.materials >= 0,
        barTone: "slate",
        iconTone: "default",
        icon: this.renderResourceIcon("materials", "h-4 w-4"),
      },
    };

    return metrics[key];
  }

  private renderResourceIcon(kind: ResourceKind, sizeClass: string) {
    const src =
      kind === "food" ? biomassIcon : kind === "energy" ? fuelIcon : metalIcon;
    return this.renderMaskIcon(src, sizeClass);
  }

  private renderMaskIcon(src: string, sizeClass: string) {
    return html`<hud-mask-icon .src=${src} .size=${sizeClass}></hud-mask-icon>`;
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

  private renderMetricBar(metric: MetricView) {
    const { greenPercent, orangePercent } = this.calculateMetricBar(metric);
    const label = `${this.metricValueText(metric)} / ${this.metricValueText({
      ...metric,
      value: metric.capacity,
    })}`;

    return html`<hud-meter
      slot="meter"
      .segments=${[
        { width: greenPercent, tone: metric.barTone },
        { width: orangePercent, tone: "cyan" },
      ].filter((segment) => segment.width > 0)}
      .label=${label}
    ></hud-meter>`;
  }

  private renderRatePill(metric: MetricView) {
    return html`<hud-pill
      slot="rate"
      .value=${`Rate ${this.metricRateText(metric)}`}
      .tone=${metric.rateIsIncreasing ? "green" : "orange"}
    >
      <span slot="icon">${metric.icon}</span>
    </hud-pill>`;
  }

  private renderMetricTabs() {
    return html`<hud-segmented-control
      slot="metric-tabs"
      .selected=${this._selectedMetric}
      .items=${this.metricTabs().map((metric) => ({
        id: metric.key,
        label: metric.label,
        value: this.metricValueText(metric),
        iconSrc: metric.iconSrc,
        tone: metric.iconTone,
      }))}
      @selection-change=${this.setSelectedMetric}
    ></hud-segmented-control>`;
  }

  private setSelectedMetric(event: CustomEvent<{ id: string }>) {
    this._selectedMetric = event.detail.id as MetricKey;
  }

  private renderAttackRatioControl() {
    return html`
      <hud-form-row
        slot="action"
        style="--hud-form-label-width: 8rem"
        translate="no"
      >
        <hud-pill
          tone="blue"
          .value=${`${(this.attackRatio * 100).toFixed(0)}%${` (${renderTroops(
            (this.game?.myPlayer()?.troops() ?? 0) * this.attackRatio,
          )})`}`}
        >
          <hud-mask-icon slot="icon" .src=${swordIcon} size="h-3 w-3">
          </hud-mask-icon>
        </hud-pill>
        <hud-range
          min="1"
          max="100"
          .value=${Math.round(this.attackRatio * 100)}
          label="Attack ratio"
          @value-change=${this.handleRatioSliderChange}
        ></hud-range>
      </hud-form-row>
    `;
  }

  private renderBiomassAllocationControl() {
    const feedPercent = Math.round(this.foodAllocationToPopulation * 100);
    const surplusPercent = Math.max(0, 100 - feedPercent);
    const nutritionPercent = Math.round(this.nutritionHealth * 100);
    return html`
      <hud-form-row
        slot="action"
        style="--hud-form-label-width: 8rem"
        translate="no"
      >
        <hud-pill
          tone="green"
          .value=${`${feedPercent}% eat / ${surplusPercent}% store · Health ${nutritionPercent}%`}
        >
          <hud-mask-icon slot="icon" .src=${biomassIcon} size="h-3 w-3">
          </hud-mask-icon>
        </hud-pill>
        <hud-range
          data-control="foodAllocationToPopulation"
          min="0"
          max="100"
          .value=${feedPercent}
          label="Biomass eat/store"
          @value-change=${this.handleBiomassAllocationSliderChange}
        ></hud-range>
      </hud-form-row>
    `;
  }

  private renderSelectedActionControl() {
    if (this._selectedMetric === "troops") {
      return this.renderAttackRatioControl();
    }
    if (this._selectedMetric === "food") {
      return this.renderBiomassAllocationControl();
    }
    return "";
  }

  render() {
    const metric = this.selectedMetric();
    return html`
      <hud-player-control-panel
        ?hidden=${!this._isVisible}
        @contextmenu=${(e: MouseEvent) => e.preventDefault()}
      >
        ${this.renderMetricTabs()} ${this.renderRatePill(metric)}
        ${this.renderMetricBar(metric)}
        <hud-pill
          slot="gold"
          tone="gold"
          .value=${`Gold ${renderNumber(this._gold)}`}
        >
          <hud-mask-icon
            slot="icon"
            .src=${goldCoinIcon}
            size="h-[13px] w-[13px]"
          >
          </hud-mask-icon>
        </hud-pill>
        ${this.renderSelectedActionControl()}
      </hud-player-control-panel>
    `;
  }
}
