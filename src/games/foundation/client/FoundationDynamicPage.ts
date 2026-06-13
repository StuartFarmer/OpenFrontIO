import { customElement } from "lit/decorators.js";
import { FoundationPage } from "./FoundationPage";

@customElement("foundation-dynamic-page")
export class FoundationDynamicPage extends FoundationPage {
  protected override useDynamicSystemsTuning = true;
}

declare global {
  interface HTMLElementTagNameMap {
    "foundation-dynamic-page": FoundationDynamicPage;
  }
}
