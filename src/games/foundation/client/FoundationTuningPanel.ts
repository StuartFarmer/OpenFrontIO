import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import {
  DEFAULT_FOUNDATION_TUNING_SETTINGS,
  FoundationTuningSettings,
  normalizeFoundationTuningSettings,
} from "./FoundationTuningSettings";

@customElement("foundation-tuning-panel")
export class FoundationTuningPanel extends LitElement {
  @property({ attribute: false })
  settings: FoundationTuningSettings = DEFAULT_FOUNDATION_TUNING_SETTINGS;

  static styles = css`
    :host {
      display: block;
      width: min(280px, calc(100vw - 24px));
      color: #edf7f3;
      font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
      pointer-events: auto;
    }

    .panel {
      margin-top: 8px;
      background: rgba(10, 17, 16, 0.84);
      border: 1px solid rgba(199, 227, 212, 0.22);
      border-radius: 8px;
      box-shadow: 0 18px 48px rgba(0, 0, 0, 0.28);
      overflow: hidden;
      backdrop-filter: blur(8px);
    }

    .header,
    .actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 10px 12px;
      border-bottom: 1px solid rgba(199, 227, 212, 0.16);
      background: rgba(255, 255, 255, 0.04);
    }

    .title {
      font-size: 13px;
      font-weight: 700;
      line-height: 1.2;
    }

    .grid {
      display: grid;
      gap: 9px;
      padding: 12px;
    }

    label {
      display: grid;
      grid-template-columns: 1fr 82px;
      align-items: center;
      gap: 10px;
      color: #a9bab2;
      font-size: 12px;
      line-height: 1.2;
    }

    input,
    select {
      min-width: 0;
      width: 100%;
      box-sizing: border-box;
      border: 1px solid rgba(199, 227, 212, 0.22);
      border-radius: 6px;
      background: rgba(5, 9, 8, 0.55);
      color: #f2fbf7;
      font: inherit;
      font-variant-numeric: tabular-nums;
      padding: 5px 7px;
    }

    button {
      border: 1px solid rgba(199, 227, 212, 0.24);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.07);
      color: #edf7f3;
      font: inherit;
      font-size: 12px;
      font-weight: 650;
      line-height: 1.2;
      padding: 6px 8px;
      cursor: pointer;
    }

    button:hover {
      background: rgba(255, 255, 255, 0.12);
    }

    .actions {
      border-top: 1px solid rgba(199, 227, 212, 0.13);
      border-bottom: 0;
      justify-content: flex-end;
    }
  `;

  render() {
    const settings = this.settings;
    return html`
      <section class="panel" aria-label="Foundation tuning">
        <div class="header">
          <div class="title">Tuning</div>
        </div>
        <div class="grid">
          <label>
            Map
            <select
              .value=${settings.mapGenerator}
              @change=${this.handleMapGeneratorChange}
            >
              <option value="world-engine">WorldEngine</option>
              <option value="foundation">Foundation</option>
            </select>
          </label>
          ${this.numberInput("Seed", "seed", -2147483648, 2147483647, 1)}
          ${this.numberInput("Width", "width", 32, 1024, 1)}
          ${this.numberInput("Height", "height", 32, 1024, 1)}
          <label>
            Elevation
            <select
              .value=${settings.elevation}
              @change=${this.handleElevationChange}
            >
              <option value="flat">Flat</option>
              <option value="rolling">Rolling</option>
            </select>
          </label>
          ${this.numberInput("Sea level", "seaLevel", 0.2, 0.75, 0.01)}
          ${this.numberInput("Continent", "continentScale", 0.35, 1.6, 0.01)}
          ${this.numberInput("Mountains", "mountainStrength", 0, 1, 0.01)}
          ${this.numberInput("Edge bias", "coastFalloff", 0, 1.4, 0.01)}
          ${this.numberInput("Coast rough", "coastRoughness", 0, 1, 0.01)}
          ${this.numberInput("Latitude", "latitudeEffect", 0, 1, 0.01)}
          ${this.numberInput("Cooling", "elevationCooling", 0, 0.8, 0.01)}
          ${this.numberInput("Rain noise", "rainNoise", 0, 1, 0.01)}
          ${this.numberInput("Warm rain", "warmthRainfall", 0, 1, 0.01)}
          ${this.numberInput("Flow retain", "riverFlowRetention", 0, 1, 0.01)}
          ${this.numberInput(
            "Lake threshold",
            "lakeWaterThreshold",
            0.1,
            5,
            0.05,
          )}
          ${this.numberInput("Lake depth", "lakeElevationRange", 0, 0.5, 0.01)}
          ${this.numberInput("Weak river", "riverWeakThreshold", 0, 1, 0.01)}
          ${this.numberInput(
            "Strong river",
            "riverStrongThreshold",
            0,
            1,
            0.01,
          )}
          ${this.numberInput("Tick ms", "tickIntervalMs", 20, 1000, 10)}
          ${this.percentInput("Attack", "attackRatio", 1, 100, 1)}
          ${this.numberInput("Base speed", "wildernessBaseSpeed", 1, 80, 0.5)}
          ${this.numberInput("Slope scale", "elevationSlopeScale", 0, 2, 0.05)}
          ${this.numberInput(
            "Min mult",
            "minToblerSpeedMultiplier",
            0.01,
            2,
            0.01,
          )}
          ${this.numberInput(
            "Max mult",
            "maxToblerSpeedMultiplier",
            0.01,
            3,
            0.05,
          )}
          ${this.numberInput(
            "Priority scale",
            "terrainPriorityElevationScale",
            0,
            4,
            0.1,
          )}
          ${this.numberInput(
            "Front sigma",
            "wildernessVectorSharpness",
            0.01,
            100,
            0.01,
          )}
          ${this.numberInput(
            "Front capacity",
            "wildernessFrontCapacity",
            500,
            50000,
            500,
          )}
        </div>
        <div class="actions">
          <button type="button" @click=${this.copyParameters}>Copy JSON</button>
          <button type="button" @click=${this.resetDefaults}>
            Reset defaults
          </button>
        </div>
      </section>
    `;
  }

  private numberInput(
    label: string,
    key: keyof FoundationTuningSettings,
    min: number,
    max: number,
    step: number,
  ) {
    return html`
      <label>
        ${label}
        <input
          type="number"
          min=${min}
          max=${max}
          step=${step}
          .value=${String(this.settings[key])}
          @change=${(event: Event) => this.handleNumberChange(event, key)}
        />
      </label>
    `;
  }

  private percentInput(
    label: string,
    key: keyof FoundationTuningSettings,
    min: number,
    max: number,
    step: number,
  ) {
    return html`
      <label>
        ${label}
        <input
          type="number"
          min=${min}
          max=${max}
          step=${step}
          .value=${String(Math.round(Number(this.settings[key]) * 100))}
          @change=${(event: Event) => this.handlePercentChange(event, key)}
        />
      </label>
    `;
  }

  private readonly handleElevationChange = (event: Event): void => {
    const target = event.currentTarget as HTMLSelectElement;
    this.emitSettings({
      elevation: target.value === "rolling" ? "rolling" : "flat",
    });
  };

  private readonly handleMapGeneratorChange = (event: Event): void => {
    const target = event.currentTarget as HTMLSelectElement;
    this.emitSettings({
      mapGenerator:
        target.value === "foundation" ? "foundation" : "world-engine",
    });
  };

  private handleNumberChange(
    event: Event,
    key: keyof FoundationTuningSettings,
  ): void {
    const target = event.currentTarget as HTMLInputElement;
    this.emitSettings({ [key]: Number(target.value) });
  }

  private handlePercentChange(
    event: Event,
    key: keyof FoundationTuningSettings,
  ): void {
    const target = event.currentTarget as HTMLInputElement;
    this.emitSettings({ [key]: Number(target.value) / 100 });
  }

  private readonly resetDefaults = (): void => {
    this.dispatchEvent(
      new CustomEvent<FoundationTuningSettings>("foundation-tuning-reset", {
        bubbles: true,
        composed: true,
        detail: DEFAULT_FOUNDATION_TUNING_SETTINGS,
      }),
    );
  };

  private readonly copyParameters = async (): Promise<void> => {
    const text = JSON.stringify(this.settings, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      this.dispatchCopyResult(true);
    } catch {
      this.dispatchCopyResult(false);
    }
  };

  private emitSettings(settings: Partial<FoundationTuningSettings>): void {
    const detail = normalizeFoundationTuningSettings({
      ...this.settings,
      ...settings,
    });
    this.dispatchEvent(
      new CustomEvent<FoundationTuningSettings>("foundation-tuning-change", {
        bubbles: true,
        composed: true,
        detail,
      }),
    );
  }

  private dispatchCopyResult(ok: boolean): void {
    this.dispatchEvent(
      new CustomEvent<{ ok: boolean }>("foundation-tuning-copy", {
        bubbles: true,
        composed: true,
        detail: { ok },
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "foundation-tuning-panel": FoundationTuningPanel;
  }
}
