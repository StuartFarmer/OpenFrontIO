import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { assetUrl } from "../../../core/AssetUrls";
import {
  Difficulty,
  GameMapType,
  mapCategories,
} from "../../../core/game/Game";
import { translateText } from "../../Utils";
import "../../hud/ui";
import "./MapDisplay";
const randomMap = assetUrl("images/RandomMap.webp");

const featuredMaps: GameMapType[] = [
  GameMapType.World,
  GameMapType.Europe,
  GameMapType.NorthAmerica,
  GameMapType.SouthAmerica,
  GameMapType.Asia,
  GameMapType.Africa,
  GameMapType.Japan,
];

@customElement("map-picker")
export class MapPicker extends LitElement {
  @property({ type: String }) selectedMap: GameMapType = GameMapType.World;
  @property({ type: Boolean }) useRandomMap = false;
  @property({ type: Boolean }) showMedals = false;
  @property({ type: Boolean }) randomMapDivider = false;
  @property({ attribute: false }) mapWins: Map<GameMapType, Set<Difficulty>> =
    new Map();
  @property({ attribute: false }) onSelectMap?: (map: GameMapType) => void;
  @property({ attribute: false }) onSelectRandom?: () => void;
  @state() private showAllMaps = false;

  createRenderRoot() {
    return this;
  }

  private handleMapSelection(mapValue: GameMapType) {
    this.onSelectMap?.(mapValue);
  }

  private handleSelectRandomMap = () => {
    this.onSelectRandom?.();
  };

  private preventImageDrag(event: DragEvent) {
    event.preventDefault();
  }

  private getWins(mapValue: GameMapType): Set<Difficulty> {
    return this.mapWins?.get(mapValue) ?? new Set();
  }

  private renderMapCard(mapValue: GameMapType) {
    const mapKey = Object.entries(GameMapType).find(
      ([_, value]) => value === mapValue,
    )?.[0];
    return html`
      <hud-button
        @click=${() => this.handleMapSelection(mapValue)}
        aria-pressed=${!this.useRandomMap && this.selectedMap === mapValue}
        style="--hud-button-host-width: 100%; --hud-button-width: 100%; --hud-button-min-height: 100%; --hud-button-padding: 0; --hud-button-radius: 12px; --hud-button-border-color: transparent; --hud-button-background: transparent; --hud-button-hover-background: transparent;"
      >
        <map-display
          .mapKey=${mapKey}
          .selected=${!this.useRandomMap && this.selectedMap === mapValue}
          .showMedals=${this.showMedals}
          .wins=${this.getWins(mapValue)}
          .translation=${translateText(`map.${mapKey?.toLowerCase()}`)}
        ></map-display>
      </hud-button>
    `;
  }

  private renderAllMaps() {
    const mapCategoryEntries = Object.entries(mapCategories);
    return html`<div class="space-y-8">
      ${mapCategoryEntries.map(
        ([categoryKey, maps]) => html`
          <div class="w-full">
            <h4
              class="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 pl-2"
            >
              ${translateText(`map_categories.${categoryKey}`)}
            </h4>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              ${maps.map((mapValue) => this.renderMapCard(mapValue))}
            </div>
          </div>
        `,
      )}
    </div>`;
  }

  private renderFeaturedMaps() {
    let featuredMapList = featuredMaps;
    if (!this.useRandomMap && !featuredMapList.includes(this.selectedMap)) {
      featuredMapList = [this.selectedMap, ...featuredMaps];
    }
    return html`<div class="w-full">
      <h4
        class="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 pl-2"
      >
        ${translateText("map_categories.featured")}
      </h4>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        ${featuredMapList.map((mapValue) => this.renderMapCard(mapValue))}
      </div>
    </div>`;
  }

  render() {
    return html`
      <div class="space-y-8">
        <div class="w-full">
          <hud-action-group
            role="tablist"
            aria-label="${translateText("map.map")}"
            class="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/20 p-1"
            style="--hud-action-gap: 0.5rem;"
          >
            <hud-button
              role="tab"
              aria-selected=${!this.showAllMaps}
              variant=${this.showAllMaps ? "ghost" : "primary"}
              style="--hud-button-host-width: 100%; --hud-button-width: 100%;"
              @click=${() => (this.showAllMaps = false)}
            >
              ${translateText("map.featured")}
            </hud-button>
            <hud-button
              role="tab"
              aria-selected=${this.showAllMaps}
              variant=${this.showAllMaps ? "primary" : "ghost"}
              style="--hud-button-host-width: 100%; --hud-button-width: 100%;"
              @click=${() => (this.showAllMaps = true)}
            >
              ${translateText("map.all")}
            </hud-button>
          </hud-action-group>
        </div>
        ${this.showAllMaps ? this.renderAllMaps() : this.renderFeaturedMaps()}
        <div
          class="w-full ${this.randomMapDivider
            ? "pt-4 border-t border-white/5"
            : ""}"
        >
          <h4
            class="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 pl-2"
          >
            ${translateText("map_categories.special")}
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <hud-button
              class="w-full h-full p-3 flex flex-col items-center justify-between rounded-xl border cursor-pointer transition-all duration-200 active:scale-95 gap-3 group ${this
                .useRandomMap
                ? "bg-malibu-blue/20 border-malibu-blue/50 shadow-[var(--shadow-malibu-blue-strong)]"
                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:-translate-y-1"}"
              variant=${this.useRandomMap ? "active" : "default"}
              style="--hud-button-host-width: 100%; --hud-button-width: 100%; --hud-button-min-height: 100%; --hud-button-padding: 12px; --hud-button-radius: 12px; --hud-button-direction: column; --hud-button-gap: 12px; --hud-button-background: ${this
                .useRandomMap
                ? "rgba(14,165,233,0.2)"
                : "rgba(255,255,255,0.05)"}; --hud-button-hover-background: rgba(255,255,255,0.1); --hud-button-border-color: ${this
                .useRandomMap
                ? "rgba(125,211,252,0.5)"
                : "rgba(255,255,255,0.1)"};"
              @click=${this.handleSelectRandomMap}
            >
              <div
                class="w-full aspect-[2/1] relative overflow-hidden rounded-lg bg-black/20"
              >
                <img
                  src=${randomMap}
                  alt=${translateText("map.random")}
                  draggable="false"
                  @dragstart=${this.preventImageDrag}
                  class="w-full h-full object-cover ${this.useRandomMap
                    ? "opacity-100"
                    : "opacity-80"} group-hover:opacity-100 transition-opacity duration-200"
                />
              </div>
              <div
                class="text-xs font-bold text-white uppercase tracking-wider text-center leading-tight break-words hyphens-auto"
              >
                ${translateText("map.random")}
              </div>
            </hud-button>
          </div>
        </div>
      </div>
    `;
  }
}
