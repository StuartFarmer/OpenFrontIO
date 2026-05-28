import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { EventBus } from "../../../core/EventBus";
import { GameView, PlayerView } from "../../../core/game/GameView";
import { within } from "../../../core/Util";
import {
  SendDonateGoldIntentEvent,
  SendDonateTroopsIntentEvent,
} from "../../Transport";
import { UIState } from "../../UIState";
import { renderTroops, translateText } from "../../Utils";
import "../ui";

@customElement("send-resource-modal")
export class SendResourceModal extends LitElement {
  @property({ attribute: false }) eventBus: EventBus | null = null;

  @property({ type: Boolean }) open: boolean = false;
  @property({ type: Boolean }) inline: boolean = false;
  @property({ type: String }) mode: "troops" | "gold" = "troops";

  @property({ type: Object }) total: number | bigint = 0;
  @property({ type: Object }) uiState: UIState | null = null; // to seed initial %
  @property({ attribute: false }) format: (n: number) => string = renderTroops;

  @property({ attribute: false }) myPlayer: PlayerView | null = null;
  @property({ attribute: false }) target: PlayerView | null = null;
  @property({ attribute: false }) gameView: GameView | null = null;

  @property({ type: String }) heading: string | null = null;

  @state() private sendAmount: number = 0;
  @state() private selectedPercent: number | null = null;

  private PRESETS = [10, 25, 50, 75, 100] as const;

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    const initPct =
      this.uiState && typeof this.uiState.attackRatio === "number"
        ? Math.round(this.uiState.attackRatio * 100)
        : 100;
    this.selectedPercent = this.sanitizePercent(initPct);

    const basis = this.getPercentBasis();
    this.sendAmount = this.clampSend(
      Math.floor((basis * this.selectedPercent) / 100),
    );
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has("open") && this.open) {
      // If either side is dead, just close and do nothing
      if (!this.isSenderAlive() || !this.isTargetAlive()) {
        this.closeModal();
        return;
      }
      queueMicrotask(() =>
        (this.querySelector('[role="dialog"]') as HTMLElement | null)?.focus(),
      );
    }

    if (
      changed.has("total") ||
      changed.has("mode") ||
      changed.has("target") ||
      changed.has("gameView")
    ) {
      const basis = this.getPercentBasis();
      if (this.selectedPercent !== null) {
        const pct = this.sanitizePercent(this.selectedPercent);
        const raw = Math.floor((basis * pct) / 100);
        this.sendAmount = this.clampSend(raw);
      } else {
        this.sendAmount = this.clampSend(this.sendAmount);
      }
    }
  }

  private closeModal() {
    this.dispatchEvent(new CustomEvent("close"));
  }

  private confirm() {
    if (!this.isSenderAlive() || !this.isTargetAlive() || !this.eventBus) {
      return;
    }

    const myPlayer = this.myPlayer;
    const target = this.target;
    const amount = this.limitAmount(this.sendAmount);

    if (!myPlayer || !target || amount <= 0) return;

    if (this.mode === "troops") {
      const myTroops = Number(myPlayer.troops());
      if (amount > myTroops) return;
      this.eventBus.emit(new SendDonateTroopsIntentEvent(target, amount));
    } else {
      const myGold = Number(myPlayer.gold());
      if (amount > myGold) return;
      this.eventBus.emit(new SendDonateGoldIntentEvent(target, BigInt(amount)));
    }

    this.dispatchEvent(
      new CustomEvent("confirm", {
        detail: { amount, closePanel: true, success: true },
      }),
    );

    this.closeModal();
  }

  private handleKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      this.closeModal();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      this.confirm();
    }
  };

  private toNum(x: unknown): number {
    if (typeof x === "bigint") return Number(x);
    return Number(x ?? 0);
  }

  private getTotalNumber(): number {
    const base = this.toNum(this.total);
    return this.isSenderAlive() ? base : 0;
  }

  private sanitizePercent(p: number) {
    return within(p, 0, 100);
  }

  /** Internal capacity only for troops; gold is unlimited. */
  private getCapacityLeft(): number | null {
    if (!this.isTargetAlive()) return 0;
    if (this.mode !== "troops") return null;
    if (!this.gameView || !this.target) return null;
    const current = this.toNum(this.target.troops());
    const max = this.toNum(this.gameView.config().maxTroops(this.target));
    return Math.max(0, max - current);
  }

  private getPercentBasis(): number {
    return this.getTotalNumber();
  }

  private limitAmount(proposed: number): number {
    const cap = this.getCapacityLeft();
    const total = this.getTotalNumber();
    const hardMax = cap === null ? total : Math.min(total, cap);
    return within(proposed, 0, hardMax);
  }

  private clampSend(n: number) {
    const total = this.getTotalNumber();
    const byTotal = within(n, 0, total);
    return this.limitAmount(byTotal);
  }

  private percentOfBasis(n: number): number {
    const basis = this.getPercentBasis();
    return basis ? Math.round((n / basis) * 100) : 0;
  }

  private keepAfter(allowed: number): number {
    const total = this.getTotalNumber();
    return Math.max(0, total - allowed);
  }

  private isTargetAlive(): boolean {
    return this.target?.isAlive() ?? false;
  }

  private isSenderAlive(): boolean {
    return this.myPlayer?.isAlive() ?? false;
  }

  private i18n = {
    title: (name: string) =>
      this.mode === "troops"
        ? translateText("send_troops_modal.title_with_name", { name })
        : translateText("send_gold_modal.title_with_name", { name }),

    availableChip: () => translateText("common.available"),

    availableTooltip: () =>
      this.mode === "troops"
        ? translateText("send_troops_modal.available_tooltip")
        : translateText("send_gold_modal.available_tooltip"),

    max: () => translateText("common.preset_max"),

    ariaSlider: () =>
      this.mode === "troops"
        ? translateText("send_troops_modal.aria_slider")
        : translateText("send_gold_modal.aria_slider"),

    summarySend: () => translateText("common.summary_send"),
    summaryKeep: () => translateText("common.summary_keep"),

    closeLabel: () => translateText("common.close"),
    cancel: () => translateText("common.cancel"),
    send: () => translateText("common.send"),

    cap: () => translateText("common.cap_label"),
    capTooltip: () => translateText("common.cap_tooltip"),

    capacityNote: (amountStr: string) =>
      translateText("send_troops_modal.capacity_note", { amount: amountStr }),

    targetDeadTitle: () => translateText("common.target_dead"),
    targetDeadNote: () => translateText("common.target_dead_note"),
  };

  private renderHeader() {
    const name = this.target?.name?.() ?? "";
    return html`
      <hud-modal-header>
        <hud-label id="send-title">
          ${this.heading ?? this.i18n.title(name)}
        </hud-label>
        <hud-icon-button
          variant="danger"
          label=${this.i18n.closeLabel()}
          @click=${() => this.closeModal()}
          title=${this.i18n.closeLabel()}
        >
          x
        </hud-icon-button>
      </hud-modal-header>
    `;
  }

  private renderAvailable() {
    const total = this.getTotalNumber();
    const cap = this.getCapacityLeft();

    return html`
      <hud-stat-grid .columns=${cap === null ? 3 : 4}>
        <hud-stat
          label=${this.i18n.availableChip()}
          value=${this.format(total)}
          tone="active"
          title=${this.i18n.availableTooltip()}
        ></hud-stat>
        <hud-stat
          label=${this.i18n.summarySend()}
          value=${this.format(this.limitAmount(this.sendAmount))}
        ></hud-stat>
        <hud-stat
          label=${this.i18n.summaryKeep()}
          value=${this.format(
            this.keepAfter(this.limitAmount(this.sendAmount)),
          )}
        ></hud-stat>
        ${cap === null
          ? html``
          : html`<hud-stat
              label=${this.i18n.cap()}
              value=${this.format(cap)}
              tone="orange"
              title=${this.i18n.capTooltip()}
            ></hud-stat>`}
      </hud-stat-grid>
    `;
  }

  private renderPresets(percentNow: number) {
    const basis = this.getTotalNumber();
    const dead = !this.isSenderAlive() || !this.isTargetAlive();

    return html`
      <hud-action-group style="--hud-action-group-gap: 6px">
        ${this.PRESETS.map((p) => {
          const pct = this.sanitizePercent(p);
          const active = (this.selectedPercent ?? percentNow) === pct;
          const label = pct === 100 ? this.i18n.max() : `${pct}%`;
          return html`
            <hud-button
              variant=${active ? "active" : "default"}
              style="--hud-button-min-width: 3.25rem"
              ?disabled=${dead}
              @click=${() => {
                if (dead) return;
                this.selectedPercent = pct;
                const raw = Math.floor((basis * pct) / 100);
                this.sendAmount = this.clampSend(raw);
              }}
              ?aria-pressed=${active}
              title="${pct}%"
            >
              ${label}
            </hud-button>
          `;
        })}
      </hud-action-group>
    `;
  }

  private renderSlider(percentNow: number) {
    const basis = this.getTotalNumber();
    const cap = this.getCapacityLeft();
    const hardMax = cap === null ? basis : Math.min(basis, cap);
    const dead = !this.isSenderAlive() || !this.isTargetAlive();
    const disabled = basis <= 0 || dead;

    return html`
      <hud-form-row
        label=${this.i18n.summarySend()}
        style="--hud-form-label-width: 4.75rem"
      >
        <hud-range
          min="0"
          .max=${hardMax}
          .value=${this.limitAmount(this.sendAmount)}
          ?disabled=${disabled}
          label=${this.i18n.ariaSlider()}
          @input=${(e: Event) => {
            if (dead) return;
            const raw = Number(
              (e.target as HTMLElement & { value?: number }).value ?? 0,
            );
            const pctRaw = basis ? Math.round((raw / basis) * 100) : 0;
            this.selectedPercent = this.sanitizePercent(pctRaw);
            this.sendAmount = this.clampSend(raw);
          }}
        ></hud-range>
      </hud-form-row>
      <hud-row justify="between">
        <hud-pill tone="blue">
          ${percentNow}% · ${this.format(this.limitAmount(this.sendAmount))}
        </hud-pill>
        ${cap === null
          ? html``
          : html`<hud-label tone="warning" title=${this.i18n.capTooltip()}>
              ${this.i18n.cap()} ${this.format(cap)}
            </hud-label>`}
      </hud-row>
    `;
  }

  private renderBody(percent: number, allowed: number) {
    return html`
      <hud-modal-body>
        <hud-stack>
          ${this.renderAvailable()}
          ${!this.isTargetAlive() ? this.renderDeadNote() : html``}
          ${this.renderPresets(percent)} ${this.renderSlider(percent)}
          ${this.mode === "troops" ? this.renderCapacityNote(allowed) : html``}
        </hud-stack>
      </hud-modal-body>
    `;
  }

  private renderActions() {
    const total = this.getTotalNumber();
    const dead = !this.isSenderAlive() || !this.isTargetAlive();
    const disabled = total <= 0 || this.clampSend(this.sendAmount) <= 0 || dead;
    return html`
      <hud-modal-footer>
        <hud-button
          variant="default"
          style="--hud-button-min-width: 6rem"
          @click=${() => this.closeModal()}
        >
          ${this.i18n.cancel()}
        </hud-button>
        <hud-button
          variant="active"
          style="--hud-button-min-width: 6rem"
          ?disabled=${disabled}
          @click=${() => this.confirm()}
        >
          ${this.i18n.send()}
        </hud-button>
      </hud-modal-footer>
    `;
  }

  private renderCapacityNote(allowed: number) {
    const capped = allowed !== this.sendAmount;
    if (!capped) return html``;
    return html`<hud-alert compact tone="orange">
      ${this.i18n.capacityNote(this.format(allowed))}
    </hud-alert>`;
  }

  private renderDeadNote() {
    return html`
      <hud-alert tone="orange" compact>
        <hud-label tone="warning">${this.i18n.targetDeadTitle()}</hud-label>
        ${this.i18n.targetDeadNote()}
      </hud-alert>
    `;
  }

  render() {
    if (!this.open) return html``;

    const percent = this.percentOfBasis(this.sendAmount);
    const allowed = this.limitAmount(this.sendAmount);

    return html`
      <div tabindex="0" @keydown=${this.handleKeydown}>
        <hud-modal-shell
          .open=${this.open}
          .inline=${this.inline}
          hideCloseButton
          label=${this.heading ?? this.i18n.title(this.target?.name?.() ?? "")}
          maxWidth="34rem"
          @close=${() => this.closeModal()}
        >
          ${this.renderHeader()} ${this.renderBody(percent, allowed)}
          ${this.renderActions()}
        </hud-modal-shell>
      </div>
    `;
  }
}
