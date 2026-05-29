import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import {
  DEFAULT_MECHANICS_CONFIG,
  MechanicsConfig,
  resolveMechanicsConfig,
} from "../../core/configuration/MechanicsConfig";
import { Difficulty } from "../../core/game/Game";
import { GameStartInfoSchema } from "../../core/Schemas";
import { generateID } from "../../core/Util";
import "../hud/ui";
import type { HudSelectOption } from "../hud/ui/HudComponents";
import type { JoinLobbyEvent } from "../Main";
import { createQuickGameStartInfo } from "../utilities/QuickGame";
import {
  DEFAULT_QUICK_GAME_PARAMETER_IDS,
  NumberParameterDescriptor,
  ParameterDescriptor,
  QUICK_GAME_PARAMETER_DESCRIPTORS,
  SelectParameterDescriptor,
} from "./QuickGameTuningParameters";

interface TuningSettings {
  mechanics: MechanicsConfig;
  nations: number;
  difficulty: Difficulty;
  autoStart: boolean;
  selectedParameterIds: string[];
}

const STORAGE_KEY = "openfront.quick-game-tuning.v2";
const difficultyOptions = Object.values(Difficulty).map((difficulty) => ({
  label: difficulty,
  value: difficulty,
}));

@customElement("quick-game-tuning-sandbox")
export class QuickGameTuningSandbox extends LitElement {
  @state() private settings: TuningSettings = loadSettings();
  @state() private running = false;
  @state() private lastGameID: string | null = null;

  static styles = css`
    :host {
      position: fixed;
      inset: 0;
      z-index: 1200;
      display: block;
      pointer-events: none;
      color: #e7e5df;
      font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
    }

    .shell {
      width: min(430px, calc(100vw - 24px));
      max-height: calc(100vh - 24px);
      margin: 12px;
      overflow: auto;
      pointer-events: auto;
    }

    hud-stack.controls {
      --hud-stack-gap: 10px;
    }

    hud-row.actions {
      --hud-row-gap: 8px;
    }

    hud-row.actions hud-button {
      flex: 1;
    }

    hud-label.title {
      --hud-label-size: 12px;
      --hud-label-weight: 700;
    }

    hud-label.status {
      --hud-label-size: 11px;
    }

    hud-table.settings-table,
    hud-table.parameter-table {
      min-width: 0;
    }

    hud-table-cell.name-cell,
    hud-table-cell.add-cell,
    hud-table-cell.slider-cell {
      width: 100%;
      --hud-table-cell-padding: 6px 8px;
    }

    hud-table-cell.value-cell {
      width: 92px;
      --hud-table-cell-padding: 4px 6px;
    }

    hud-table-cell.remove-cell {
      width: 28px;
      --hud-table-cell-padding: 4px 6px 4px 0;
    }

    hud-table-cell.empty-cell {
      --hud-table-cell-padding: 0;
    }

    hud-label.parameter-label {
      max-width: 220px;
      cursor: help;
    }

    hud-input.setting-input,
    hud-input.parameter-input {
      width: 92px;
      --hud-input-text-align: right;
    }

    hud-select.setting-select {
      width: 118px;
    }

    hud-select.parameter-select {
      width: 132px;
    }

    hud-icon-button.remove-button {
      --hud-icon-button-size: 24px;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    if (this.settings.autoStart) {
      setTimeout(() => this.startRun(), 0);
    }
  }

  render() {
    return html`
      <hud-surface class="shell">
        <hud-surface-header>
          <hud-stack density="compact">
            <hud-label class="title">Quick Game Tuning</hud-label>
            <hud-label class="status" tone="muted">
              ${this.running
                ? `Running ${this.lastGameID ?? ""}`
                : "World map quick-game preset"}
            </hud-label>
          </hud-stack>
        </hud-surface-header>
        <hud-surface-body>
          <hud-stack class="controls">
            <hud-row class="actions">
              <hud-button variant="active" @click=${this.startRun}>
                ${this.running ? "Restart" : "Start"}
              </hud-button>
              <hud-button variant="default" @click=${this.resetSettings}>
                Reset
              </hud-button>
            </hud-row>

            ${this.renderRunSettings()} ${this.renderParameterControls()}
          </hud-stack>
        </hud-surface-body>
      </hud-surface>
    `;
  }

  private renderRunSettings() {
    return html`
      <hud-table class="settings-table">
        <hud-table-row>
          <hud-table-cell class="name-cell" align="left">
            <hud-label title="World-map nations spawned into the run.">
              Nations
            </hud-label>
          </hud-table-cell>
          <hud-table-cell class="value-cell">
            <hud-input
              class="setting-input"
              data-setting="nations"
              type="number"
              min="1"
              max="400"
              step="1"
              .value=${String(this.settings.nations)}
              @value-change=${this.handleNationsInput}
            ></hud-input>
          </hud-table-cell>
        </hud-table-row>
        <hud-table-row>
          <hud-table-cell class="name-cell" align="left">
            <hud-label title="Applies nation growth/capacity multipliers.">
              Difficulty
            </hud-label>
          </hud-table-cell>
          <hud-table-cell class="value-cell">
            <hud-select
              class="setting-select"
              data-setting="difficulty"
              .options=${difficultyOptions}
              .value=${this.settings.difficulty}
              @value-change=${this.handleDifficultyChange}
            ></hud-select>
          </hud-table-cell>
        </hud-table-row>
        <hud-table-row>
          <hud-table-cell class="name-cell" align="left">
            <hud-label title="Refresh applies saved knobs immediately.">
              Auto start on refresh
            </hud-label>
          </hud-table-cell>
          <hud-table-cell class="value-cell">
            <hud-checkbox
              data-setting="autoStart"
              .checked=${this.settings.autoStart}
              @change=${this.handleAutoStartChange}
            ></hud-checkbox>
          </hud-table-cell>
        </hud-table-row>
      </hud-table>
    `;
  }

  private renderParameterControls() {
    const selectedDescriptors = this.selectedDescriptors();

    return html`
      <hud-table class="parameter-table">
        <hud-table-row>
          <hud-table-cell class="add-cell" align="left">
            <hud-select
              data-add-parameter
              .options=${this.addParameterOptions()}
              .value=${""}
              @value-change=${this.handleAddParameter}
            ></hud-select>
          </hud-table-cell>
        </hud-table-row>
        ${selectedDescriptors.map((descriptor) =>
          this.renderParameterRows(descriptor),
        )}
      </hud-table>
    `;
  }

  private renderParameterRows(descriptor: ParameterDescriptor) {
    const value = this.parameterValue(descriptor);
    const tooltip = `${descriptor.group}: ${descriptor.description}`;

    return html`
      <hud-table-row>
        <hud-table-cell class="name-cell" align="left">
          <hud-label class="parameter-label" title=${tooltip}>
            ${descriptor.label}
          </hud-label>
        </hud-table-cell>
        <hud-table-cell class="value-cell">
          ${this.renderParameterValueControl(descriptor, value)}
        </hud-table-cell>
        <hud-table-cell class="remove-cell">
          <hud-icon-button
            class="remove-button"
            data-remove-parameter=${descriptor.id}
            label=${`Remove ${descriptor.label}`}
            variant="danger"
            @click=${() => this.removeParameter(descriptor.id)}
            >×</hud-icon-button
          >
        </hud-table-cell>
      </hud-table-row>
      ${isNumberParameter(descriptor)
        ? this.renderParameterSliderRow(descriptor, Number(value))
        : null}
    `;
  }

  private renderParameterValueControl(
    descriptor: ParameterDescriptor,
    value: string | number,
  ) {
    if (isSelectParameter(descriptor)) {
      return html`
        <hud-select
          class="parameter-select"
          data-parameter-select=${descriptor.id}
          .options=${descriptor.options}
          .value=${String(value)}
          @value-change=${(event: CustomEvent<{ value: string }>) =>
            this.handleParameterValueChange(descriptor, event.detail.value)}
        ></hud-select>
      `;
    }

    return html`
      <hud-input
        class="parameter-input"
        data-parameter-input=${descriptor.id}
        type="number"
        min=${String(descriptor.min)}
        max=${String(descriptor.max)}
        step=${String(descriptor.step)}
        .value=${String(value)}
        @value-change=${(event: CustomEvent<{ value: string }>) =>
          this.handleParameterValueChange(descriptor, event.detail.value)}
      ></hud-input>
    `;
  }

  private renderParameterSliderRow(
    descriptor: NumberParameterDescriptor,
    value: number,
  ) {
    return html`
      <hud-table-row>
        <hud-table-cell class="slider-cell" align="left">
          <hud-range
            data-parameter-range=${descriptor.id}
            label=${descriptor.label}
            .min=${descriptor.min}
            .max=${descriptor.max}
            .step=${descriptor.step}
            .value=${value}
            @value-change=${(event: CustomEvent<{ value: number }>) =>
              this.handleParameterValueChange(descriptor, event.detail.value)}
          ></hud-range>
        </hud-table-cell>
        <hud-table-cell class="empty-cell"></hud-table-cell>
        <hud-table-cell class="empty-cell"></hud-table-cell>
      </hud-table-row>
    `;
  }

  private handleNationsInput = (event: CustomEvent<{ value: string }>) => {
    const next = cloneSettings(this.settings);
    next.nations = Math.round(clamp(Number(event.detail.value), 1, 400));
    this.setSettings(next);
  };

  private handleDifficultyChange = (event: CustomEvent<{ value: string }>) => {
    const next = cloneSettings(this.settings);
    next.difficulty = event.detail.value as Difficulty;
    this.setSettings(next);
  };

  private handleAutoStartChange = (event: Event) => {
    const input = event.currentTarget as HTMLElement & { checked: boolean };
    const next = cloneSettings(this.settings);
    next.autoStart = input.checked;
    this.setSettings(next);
  };

  private handleAddParameter = (event: CustomEvent<{ value: string }>) => {
    const descriptor = QUICK_GAME_PARAMETER_DESCRIPTORS.find(
      (candidate) => candidate.id === event.detail.value,
    );
    if (
      !descriptor ||
      this.settings.selectedParameterIds.includes(descriptor.id)
    ) {
      return;
    }
    const next = cloneSettings(this.settings);
    next.selectedParameterIds = validSelectedParameterIds([
      ...next.selectedParameterIds,
      descriptor.id,
    ]);
    this.setSettings(next);
  };

  private removeParameter(parameterId: string) {
    const next = cloneSettings(this.settings);
    next.selectedParameterIds = validSelectedParameterIds(
      next.selectedParameterIds.filter((id) => id !== parameterId),
    );
    this.setSettings(next);
  }

  private handleParameterValueChange(
    descriptor: ParameterDescriptor,
    rawValue: string | number,
  ) {
    const next = cloneSettings(this.settings);
    if (isSelectParameter(descriptor)) {
      const nextValue = String(rawValue);
      if (!descriptor.options.some((option) => option.value === nextValue)) {
        return;
      }
      setParameterValue(next.mechanics, descriptor, nextValue);
    } else {
      setParameterValue(
        next.mechanics,
        descriptor,
        clamp(Number(rawValue), descriptor.min, descriptor.max),
      );
    }
    this.setSettings(next);
  }

  private startRun = () => {
    const gameID = generateID();
    const clientID = generateID();
    const mechanics = resolveMechanicsConfig(this.settings.mechanics);
    const gameStartInfo = createQuickGameStartInfo({
      gameID,
      clientID,
      username: "Tuner",
      clanTag: null,
      difficulty: this.settings.difficulty,
      nations: this.settings.nations,
      mechanics,
      isSandbox: true,
    });

    GameStartInfoSchema.parse(gameStartInfo);
    this.running = true;
    this.lastGameID = gameID;
    this.dispatchEvent(
      new CustomEvent("join-lobby", {
        detail: {
          gameID,
          gameStartInfo,
          source: "sandbox",
        } satisfies JoinLobbyEvent,
        bubbles: true,
        composed: true,
      }),
    );
  };

  private resetSettings = () => {
    this.setSettings(defaultSettings());
  };

  private setSettings(settings: TuningSettings) {
    this.settings = settings;
    persistSettings(settings);
  }

  private selectedDescriptors(): ParameterDescriptor[] {
    const byId = new Map(
      QUICK_GAME_PARAMETER_DESCRIPTORS.map((descriptor) => [
        descriptor.id,
        descriptor,
      ]),
    );
    return this.settings.selectedParameterIds
      .map((id) => byId.get(id))
      .filter((descriptor): descriptor is ParameterDescriptor =>
        Boolean(descriptor),
      );
  }

  private addParameterOptions(): HudSelectOption[] {
    const selected = new Set(this.settings.selectedParameterIds);
    const options: HudSelectOption[] = [
      {
        label: "Add parameter...",
        value: "",
        disabled: true,
      },
    ];
    let group = "";

    for (const descriptor of QUICK_GAME_PARAMETER_DESCRIPTORS) {
      if (selected.has(descriptor.id)) {
        continue;
      }
      if (descriptor.group !== group) {
        group = descriptor.group;
        options.push({
          label: `-- ${group} --`,
          value: `group:${group}`,
          disabled: true,
        });
      }
      options.push({
        label: descriptor.label,
        value: descriptor.id,
      });
    }

    if (options.length === 1) {
      options.push({
        label: "All parameters added",
        value: "all",
        disabled: true,
      });
    }

    return options;
  }

  private parameterValue(descriptor: ParameterDescriptor): string | number {
    return getParameterValue(this.settings.mechanics, descriptor);
  }
}

function defaultSettings(): TuningSettings {
  return {
    mechanics: resolveMechanicsConfig(DEFAULT_MECHANICS_CONFIG),
    nations: 24,
    difficulty: Difficulty.Medium,
    autoStart: true,
    selectedParameterIds: [...DEFAULT_QUICK_GAME_PARAMETER_IDS],
  };
}

function cloneSettings(settings: TuningSettings): TuningSettings {
  return {
    mechanics: resolveMechanicsConfig(settings.mechanics),
    nations: settings.nations,
    difficulty: settings.difficulty,
    autoStart: settings.autoStart,
    selectedParameterIds: validSelectedParameterIds(
      settings.selectedParameterIds,
    ),
  };
}

function loadSettings(): TuningSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultSettings();
    }
    const parsed = JSON.parse(raw) as Partial<TuningSettings>;
    return {
      mechanics: resolveMechanicsConfig(parsed.mechanics),
      nations: clamp(Number(parsed.nations ?? 24), 1, 400),
      difficulty: Object.values(Difficulty).includes(
        parsed.difficulty as Difficulty,
      )
        ? (parsed.difficulty as Difficulty)
        : Difficulty.Medium,
      autoStart: parsed.autoStart ?? true,
      selectedParameterIds: validSelectedParameterIds(
        parsed.selectedParameterIds,
      ),
    };
  } catch {
    return defaultSettings();
  }
}

function persistSettings(settings: TuningSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage can be unavailable; current in-memory settings still work.
  }
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

function validSelectedParameterIds(value: unknown): string[] {
  const valid = new Set(
    QUICK_GAME_PARAMETER_DESCRIPTORS.map((descriptor) => descriptor.id),
  );
  if (!Array.isArray(value)) {
    return [...DEFAULT_QUICK_GAME_PARAMETER_IDS];
  }
  const ids = value.filter(
    (id): id is string => typeof id === "string" && valid.has(id),
  );
  return [...new Set(ids)];
}

function setParameterValue(
  mechanics: MechanicsConfig,
  descriptor: ParameterDescriptor,
  value: number | string,
) {
  const container = resolveParameterContainer(mechanics, descriptor);
  container[descriptor.path[descriptor.path.length - 1]] = value;
}

function getParameterValue(
  mechanics: MechanicsConfig,
  descriptor: ParameterDescriptor,
): string | number {
  const container = resolveParameterContainer(mechanics, descriptor);
  return container[descriptor.path[descriptor.path.length - 1]];
}

function resolveParameterContainer(
  mechanics: MechanicsConfig,
  descriptor: ParameterDescriptor,
): Record<string, number | string> {
  let current: unknown = mechanics;
  for (const segment of descriptor.path.slice(0, -1)) {
    current = (current as Record<string, unknown>)[segment];
  }
  return current as Record<string, number | string>;
}

function isNumberParameter(
  descriptor: ParameterDescriptor,
): descriptor is NumberParameterDescriptor {
  return descriptor.type !== "select";
}

function isSelectParameter(
  descriptor: ParameterDescriptor,
): descriptor is SelectParameterDescriptor {
  return descriptor.type === "select";
}

declare global {
  interface HTMLElementTagNameMap {
    "quick-game-tuning-sandbox": QuickGameTuningSandbox;
  }
}
