import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { EventBus } from "../../../core/EventBus";
import { GameView } from "../../../core/game/GameView";
import { Controller } from "../../Controller";
import { ReplaySpeedChangeEvent } from "../../InputHandler";
import {
  defaultReplaySpeedMultiplier,
  ReplaySpeedMultiplier,
} from "../../utilities/ReplaySpeedMultiplier";
import { translateText } from "../../Utils";
import {
  HUD_SEGMENT,
  HUD_SEGMENT_ACTIVE,
  HUD_SEGMENTED,
  HUD_SURFACE,
  HUD_SURFACE_BODY,
  HUD_SURFACE_HEADER,
} from "../ui/HudTheme";

export class ShowReplayPanelEvent {
  constructor(
    public visible: boolean = true,
    public isSingleplayer: boolean = false,
  ) {}
}

@customElement("replay-panel")
export class ReplayPanel extends LitElement implements Controller {
  public game: GameView | undefined;
  public eventBus: EventBus | undefined;

  @property({ type: Boolean })
  visible: boolean = false;

  @state()
  private _replaySpeedMultiplier: number = defaultReplaySpeedMultiplier;

  @property({ type: Boolean })
  isSingleplayer = false;

  createRenderRoot() {
    return this; // Enable Tailwind CSS
  }

  init() {
    if (this.eventBus) {
      this.eventBus.on(ShowReplayPanelEvent, (event: ShowReplayPanelEvent) => {
        this.visible = event.visible;
        this.isSingleplayer = event.isSingleplayer;
      });
      this.eventBus.on(
        ReplaySpeedChangeEvent,
        (event: ReplaySpeedChangeEvent) => {
          this._replaySpeedMultiplier = event.replaySpeedMultiplier;
          this.requestUpdate();
        },
      );
    }
  }

  getTickIntervalMs() {
    return 1000;
  }

  tick() {
    if (!this.visible) return;
    this.requestUpdate();
  }

  onReplaySpeedChange(value: ReplaySpeedMultiplier) {
    this._replaySpeedMultiplier = value;
    this.eventBus?.emit(new ReplaySpeedChangeEvent(value));
  }

  render() {
    if (!this.visible) return html``;

    return html`
      <div
        class="overflow-hidden ${HUD_SURFACE}"
        @contextmenu=${(e: Event) => e.preventDefault()}
      >
        <label class="${HUD_SURFACE_HEADER}" translate="no">
          ${this.game?.config()?.isReplay()
            ? translateText("replay_panel.replay_speed")
            : translateText("replay_panel.game_speed")}
        </label>
        <div class="${HUD_SURFACE_BODY}">
          <div class="${HUD_SEGMENTED} w-full">
            ${this.renderSpeedButton(ReplaySpeedMultiplier.slow, "×0.5")}
            ${this.renderSpeedButton(ReplaySpeedMultiplier.normal, "×1")}
            ${this.renderSpeedButton(ReplaySpeedMultiplier.fast, "×2")}
            ${this.renderSpeedButton(
              ReplaySpeedMultiplier.fastest,
              translateText("replay_panel.fastest_game_speed"),
            )}
          </div>
        </div>
      </div>
    `;
  }

  private renderSpeedButton(value: ReplaySpeedMultiplier, label: string) {
    const isActive = this._replaySpeedMultiplier === value;

    return html`
      <button
        class="${HUD_SEGMENT} ${isActive ? HUD_SEGMENT_ACTIVE : ""}"
        @click=${() => this.onReplaySpeedChange(value)}
      >
        ${label}
      </button>
    `;
  }
}
