import { LitElement, TemplateResult, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { translateText } from "../../Utils";
import "../ui/UiComponents";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "xs" | "sm" | "md" | "lg";
type ButtonWidth = "auto" | "block" | "blockDesktop" | "fill";
type IconPosition = "left" | "right" | "only";

@customElement("o-button")
export class OButton extends LitElement {
  @property() title = "";
  @property() translationKey = "";
  @property() variant: ButtonVariant = "primary";
  @property() size: ButtonSize = "md";
  @property() width: ButtonWidth = "auto";
  @property() iconPosition: IconPosition = "left";
  @property({ attribute: false }) icon?: TemplateResult;
  @property({ type: Boolean }) disable = false;
  @property({ type: Boolean }) submit = false;

  createRenderRoot() {
    return this;
  }

  private uiVariant(): "primary" | "secondary" | "danger" | "ghost" {
    switch (this.variant) {
      case "primary":
        return "primary";
      case "secondary":
        return "secondary";
      case "danger":
        return "danger";
      case "ghost":
        return "ghost";
    }
  }

  private uiWidth(): "auto" | "block" | "fill" {
    switch (this.width) {
      case "auto":
        return "auto";
      case "block":
      case "blockDesktop":
        return "block";
      case "fill":
        return "fill";
    }
  }

  render() {
    const label =
      this.translationKey === ""
        ? this.title
        : translateText(this.translationKey);
    const iconOnly = this.iconPosition === "only";
    const blockDesktopClass =
      this.width === "blockDesktop" ? "block w-full lg:w-1/2 lg:mx-auto" : "";

    if (iconOnly) {
      return html`
        <ui-icon-button
          class=${blockDesktopClass}
          variant=${this.uiVariant()}
          size=${this.size}
          label=${label}
          ?disabled=${this.disable}
        >
          ${this.icon ?? nothing}
        </ui-icon-button>
      `;
    }

    return html`
      <ui-button
        class=${blockDesktopClass}
        variant=${this.uiVariant()}
        size=${this.size}
        width=${this.uiWidth()}
        ?disabled=${this.disable}
        ?submit=${this.submit}
        label=${label}
      >
        ${this.icon && this.iconPosition !== "right"
          ? html`<span slot="icon">${this.icon}</span>`
          : nothing}
        ${label}
        ${this.icon && this.iconPosition === "right" ? this.icon : nothing}
      </ui-button>
    `;
  }
}
