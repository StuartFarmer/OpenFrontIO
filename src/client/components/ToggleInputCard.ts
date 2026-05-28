import { LitElement, PropertyValues, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import "../hud/ui";
import { translateText } from "../Utils";

const CARD_LABEL_CLASS =
  "text-xs uppercase font-bold tracking-wider leading-tight break-words hyphens-auto";

@customElement("toggle-input-card")
export class ToggleInputCard extends LitElement {
  @property({ attribute: false }) labelKey = "";
  @property({ type: Boolean, attribute: false }) checked = false;
  @property({ attribute: false }) inputId?: string;
  @property({ attribute: false }) inputType = "number";
  @property({ attribute: false }) inputMin?: number | string;
  @property({ attribute: false }) inputMax?: number | string;
  @property({ attribute: false }) inputStep?: number | string;
  @property({ attribute: false }) inputValue?: number | string;
  @property({ attribute: false }) inputAriaLabel?: string;
  @property({ attribute: false }) inputPlaceholder?: string;
  @property({ attribute: false }) defaultInputValue?: number | string;
  @property({ attribute: false }) minValidOnEnable?: number;
  @property({ attribute: false }) onToggle?: (
    checked: boolean,
    value: number | string | undefined,
  ) => void;
  @property({ attribute: false }) onInput?: (e: Event) => void;
  @property({ attribute: false }) onChange?: (e: Event) => void;
  @property({ attribute: false }) onKeyDown?: (e: KeyboardEvent) => void;

  createRenderRoot() {
    return this;
  }

  protected updated(changedProperties: PropertyValues<this>) {
    if (!changedProperties.has("checked")) return;
    const previousChecked = changedProperties.get("checked");
    if (previousChecked === false && this.checked) {
      const input = this.querySelector("hud-input") as
        | (HTMLElement & { shadowRoot: ShadowRoot | null })
        | null;
      if (input) {
        const nativeInput = input.shadowRoot?.querySelector("input");
        nativeInput?.focus();
        nativeInput?.select();
      }
    }
  }

  private toOptionalNumber(
    value: number | string | undefined,
  ): number | undefined {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : undefined;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      const numeric = Number(trimmed);
      return Number.isFinite(numeric) ? numeric : undefined;
    }
    return undefined;
  }

  private resolveValueOnEnable(): number | string | undefined {
    const currentValue = this.inputValue;

    if (
      currentValue === undefined ||
      currentValue === null ||
      currentValue === ""
    ) {
      return this.defaultInputValue;
    }

    if (this.minValidOnEnable === undefined) {
      return currentValue;
    }

    const numericValue = this.toOptionalNumber(currentValue);
    if (numericValue === undefined || numericValue < this.minValidOnEnable) {
      return this.defaultInputValue;
    }

    return numericValue;
  }

  private emitToggle() {
    const nextChecked = !this.checked;
    const nextValue = nextChecked ? this.resolveValueOnEnable() : undefined;
    this.onToggle?.(nextChecked, nextValue);
  }

  private handleCardClick = () => {
    this.emitToggle();
  };

  render() {
    return html`
      <hud-list-row
        interactive
        ?selected=${this.checked}
        class="relative overflow-hidden"
        style="height: 100%; --hud-list-row-padding: 10px; grid-template-columns: minmax(0, 1fr); align-items: stretch;"
        role="button"
        aria-pressed=${this.checked}
        @click=${this.handleCardClick}
      >
        <div
          class="w-full h-full flex flex-col items-center justify-between gap-2"
        >
          <hud-checkbox
            .checked=${this.checked}
            @click=${(event: Event) => event.stopPropagation()}
            @change=${() => this.emitToggle()}
          ></hud-checkbox>

          ${this.checked
            ? html`<div class="h-[30px] my-1"></div>`
            : html`<div class="h-[2px] w-4 rounded my-3 bg-white/10"></div>`}

          <span
            class="${CARD_LABEL_CLASS} text-center ${this.checked
              ? "text-white"
              : "text-white/60"}"
          >
            ${translateText(this.labelKey)}
          </span>
        </div>

        ${this.checked
          ? html`
              <div
                class="absolute left-3 right-3 top-1/2 -translate-y-1/2 z-10"
                @click=${(event: Event) => event.stopPropagation()}
              >
                <hud-input
                  type=${this.inputType}
                  id=${this.inputId ?? nothing}
                  min=${this.inputMin ?? nothing}
                  max=${this.inputMax ?? nothing}
                  step=${this.inputStep ?? nothing}
                  .value=${String(this.inputValue ?? "")}
                  label=${this.inputAriaLabel ?? ""}
                  placeholder=${this.inputPlaceholder ?? nothing}
                  @input=${this.onInput}
                  @change=${this.onChange}
                  @keydown=${this.onKeyDown}
                  style="--hud-input-radius: 4px; --hud-input-padding: 4px 6px;"
                ></hud-input>
              </div>
            `
          : nothing}
      </hud-list-row>
    `;
  }
}
