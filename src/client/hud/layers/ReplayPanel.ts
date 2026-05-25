import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { Gauge } from "lucide";
import { EventBus } from "../../../core/EventBus";
import { GameView } from "../../../core/game/GameView";
import { Controller } from "../../Controller";
import { ReplaySpeedChangeEvent } from "../../InputHandler";
import {
  defaultReplaySpeedMultiplier,
  ReplaySpeedMultiplier,
} from "../../utilities/ReplaySpeedMultiplier";
import "../ui/HudComponents";
import { renderLucideIcon } from "../ui/LucideIcon";

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
      <hud-surface
        class="overflow-hidden"
        @contextmenu=${(e: Event) => e.preventDefault()}
      >
        <hud-surface-header translate="no">
          <span class="flex items-center gap-1">
            ${renderLucideIcon(Gauge, "h-3.5 w-3.5")}
            <span>
              ${this.game?.config()?.isReplay() ? "Replay Speed" : "Game Speed"}
            </span>
          </span>
        </hud-surface-header>
        <hud-surface-body>
          <hud-segmented-control
            .items=${[
              { id: String(ReplaySpeedMultiplier.slow), label: "×0.5" },
              { id: String(ReplaySpeedMultiplier.normal), label: "×1" },
              { id: String(ReplaySpeedMultiplier.fast), label: "×2" },
              { id: String(ReplaySpeedMultiplier.fastest), label: "Max" },
            ]}
            .selected=${String(this._replaySpeedMultiplier)}
            @selection-change=${(event: CustomEvent<{ id: string }>) =>
              this.onReplaySpeedChange(
                Number(event.detail.id) as ReplaySpeedMultiplier,
              )}
          ></hud-segmented-control>
        </hud-surface-body>
      </hud-surface>
    `;
  }
}
