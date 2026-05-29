import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { PlayerType } from "../../../core/game/Game";
import "../../hud/layers/PlayerModerationModal";
import "../../hud/layers/SendResourceModal";
import "../../hud/ui";
import "../baseComponents/Button";
import "../baseComponents/Modal";
import { actionButton } from "./ActionButton";

@customElement("hud-ui-review-page")
export class HudUiReviewPage extends LitElement {
  @state() private modalOpen = false;
  @state() private rangeValue = 62;
  @state() private toggleOn = true;
  @state() private checkboxOn = true;
  @state() private selectValue = "balanced";

  static styles = css`
    :host {
      display: block;
      height: 100vh;
      height: 100dvh;
      overflow-y: auto;
      overflow-x: hidden;
      background: #111827;
      color: #fff;
      font-family:
        ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        "Liberation Mono", "Courier New", monospace;
      font-variant-numeric: tabular-nums;
      overscroll-behavior: contain;
      scrollbar-gutter: stable;
    }

    main {
      width: min(1280px, calc(100vw - 24px));
      margin: 0 auto;
      padding: 16px 0 40px;
    }

    header {
      display: grid;
      gap: 8px;
      margin-bottom: 16px;
    }

    h1,
    h2,
    h3,
    p {
      margin: 0;
    }

    h1 {
      font-size: clamp(22px, 3vw, 34px);
      line-height: 1;
    }

    h2 {
      font-size: 16px;
    }

    h3 {
      color: #e2e8f0;
      font-size: 11px;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    p {
      color: #94a3b8;
      font-size: 12px;
      line-height: 1.5;
    }

    .links {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 4px;
    }

    .section {
      display: grid;
      gap: 8px;
      margin-top: 12px;
    }

    .stage {
      display: grid;
      gap: 8px;
      padding: 8px;
    }

    .swatch {
      min-height: 120px;
    }

    .inline-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 8px;
    }

    .button-row,
    .tone-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }

    .icon {
      width: 16px;
      height: 16px;
      display: inline-block;
    }

    .table {
      --hud-table-columns: 1.1fr 0.8fr 0.8fr;
    }

    .compat-card {
      display: grid;
      gap: 10px;
    }

    .small-copy {
      font-size: 12px;
    }

    .preview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 8px;
    }

    .preview-frame {
      position: relative;
      min-height: 330px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      background:
        linear-gradient(rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.72)),
        repeating-linear-gradient(
          45deg,
          rgba(255, 255, 255, 0.035) 0,
          rgba(255, 255, 255, 0.035) 8px,
          transparent 8px,
          transparent 16px
        );
    }

    .preview-frame.short {
      min-height: 190px;
    }

    .converted-card {
      display: grid;
      gap: 8px;
      height: 100%;
    }
  `;

  private readonly fakeEventBus = {
    emit: () => undefined,
    on: () => undefined,
    off: () => undefined,
  };

  private readonly fakeGameView = {
    config: () => ({
      maxTroops: () => 125_000,
    }),
  };

  private readonly fakeMe = this.createFakePlayer({
    id: "player-local",
    displayName: "Local Tester",
    troops: 92_000,
    gold: 8_400n,
    lobbyCreator: true,
    clientID: "local-client",
  });

  private readonly fakeTarget = this.createFakePlayer({
    id: "player-target",
    displayName: "Converted Target",
    troops: 108_000,
    gold: 2_100n,
    lobbyCreator: false,
    clientID: "target-client",
  });

  private createFakePlayer(config: {
    id: string;
    displayName: string;
    troops: number;
    gold: bigint;
    lobbyCreator: boolean;
    clientID: string;
  }) {
    return {
      id: () => config.id,
      isAlive: () => true,
      isLobbyCreator: () => config.lobbyCreator,
      type: () => PlayerType.Human,
      clientID: () => config.clientID,
      displayName: () => config.displayName,
      name: () => config.displayName,
      troops: () => config.troops,
      gold: () => config.gold,
    };
  }

  private renderSection(title: string, detail: string, content: unknown) {
    return html`
      <section class="section">
        <div>
          <h2>${title}</h2>
          <p class="small-copy">${detail}</p>
        </div>
        <hud-surface>
          <hud-surface-body>
            <div class="stage">${content}</div>
          </hud-surface-body>
        </hud-surface>
      </section>
    `;
  }

  render() {
    return html`
      <main>
        <header>
          <h1>HUD-Compatible UI Review</h1>
          <p>
            Converted app and overlay components composed from
            <code>src/client/components/ui</code>. This page should look like it
            belongs beside the HUD kit: compact, monospace, gray translucent
            surfaces, tight controls, and 3px panel radii.
          </p>
          <div class="links">
            <hud-button variant="active" @click=${() => (location.href = "/")}>
              Home
            </hud-button>
            <hud-button
              variant="default"
              @click=${() => (location.href = "/hud-kit")}
            >
              HUD Kit
            </hud-button>
            <hud-button
              variant="default"
              @click=${() => (location.href = "/sandbox")}
            >
              Mechanics Sandbox
            </hud-button>
            <hud-button
              variant="default"
              @click=${() => (location.href = "/sandbox/war")}
            >
              War Sandbox
            </hud-button>
          </div>
        </header>

        ${this.renderSection(
          "Converted Components",
          "Actual migrated overlays plus the converted composition patterns used by homepage, lobby, settings, clan, leaderboard, and HUD utility surfaces.",
          html`
            <div class="preview-grid">
              <hud-surface>
                <hud-surface-header>
                  <h3>send-resource-modal</h3>
                  <hud-pill tone="green">actual</hud-pill>
                </hud-surface-header>
                <hud-surface-body>
                  <div class="preview-frame">
                    <send-resource-modal
                      open
                      inline
                      mode="troops"
                      .eventBus=${this.fakeEventBus as never}
                      .myPlayer=${this.fakeMe as never}
                      .target=${this.fakeTarget as never}
                      .gameView=${this.fakeGameView as never}
                      .uiState=${{ attackRatio: 0.5 } as never}
                      .total=${92000}
                      .format=${(value: number) =>
                        Intl.NumberFormat("en", {
                          notation: "compact",
                        }).format(value)}
                    ></send-resource-modal>
                  </div>
                </hud-surface-body>
              </hud-surface>

              <hud-surface>
                <hud-surface-header>
                  <h3>player-moderation-modal</h3>
                  <hud-pill tone="green">actual</hud-pill>
                </hud-surface-header>
                <hud-surface-body>
                  <div class="preview-frame">
                    <player-moderation-modal
                      open
                      inline
                      alreadyKicked
                      .eventBus=${this.fakeEventBus as never}
                      .myPlayer=${this.fakeMe as never}
                      .target=${this.fakeTarget as never}
                    ></player-moderation-modal>
                  </div>
                </hud-surface-body>
              </hud-surface>

              <hud-surface>
                <hud-surface-header>
                  <h3>converted modal shell</h3>
                  <hud-pill tone="blue">settings / win / multitab</hud-pill>
                </hud-surface-header>
                <hud-surface-body>
                  <div class="preview-frame short">
                    <hud-kit-frame
                      shell
                      style="--hud-kit-frame-width: 320px; margin: 16px"
                    >
                      <hud-modal-header>
                        <hud-label>Modal shell</hud-label>
                        <hud-icon-button label="Close">x</hud-icon-button>
                      </hud-modal-header>
                      <hud-modal-body>
                        <hud-label tone="muted">
                          Header, body, and footer can be used inside
                          hud-modal-shell.
                        </hud-label>
                      </hud-modal-body>
                      <hud-modal-footer>
                        <hud-button>Cancel</hud-button>
                        <hud-button variant="active">Confirm</hud-button>
                      </hud-modal-footer>
                    </hud-kit-frame>
                  </div>
                </hud-surface-body>
              </hud-surface>

              <hud-surface>
                <hud-surface-header>
                  <h3>converted feed/list shell</h3>
                  <hud-pill tone="blue">chat / lobby / leaderboard</hud-pill>
                </hud-surface-header>
                <hud-surface-body>
                  <div class="preview-frame short">
                    <hud-surface style="margin: 16px">
                      <hud-list-row>
                        <span>Local Tester</span>
                        <hud-pill tone="gold">92K</hud-pill>
                      </hud-list-row>
                      <hud-list-row>
                        <span>Converted Target</span>
                        <hud-pill tone="blue">108K</hud-pill>
                      </hud-list-row>
                      <hud-list-row>
                        <span>Food allocation</span>
                        <hud-pill tone="green">62%</hud-pill>
                      </hud-list-row>
                    </hud-surface>
                  </div>
                </hud-surface-body>
              </hud-surface>
            </div>
          `,
        )}
        ${this.renderSection(
          "Shared Subcomponents",
          "Surface, header, body, footer, rows, stacks, grids.",
          html`
            <hud-grid columns="2">
              <hud-surface tone="muted">
                <hud-surface-header>
                  <h3>Surface Header</h3>
                  <hud-pill tone="blue">Live</hud-pill>
                </hud-surface-header>
                <hud-surface-body>
                  <hud-stack>
                    <p>Surface body content with a row and nested controls.</p>
                    <hud-row justify="between">
                      <hud-label tone="green">Ready</hud-label>
                      <hud-button size="sm">Action</hud-button>
                    </hud-row>
                  </hud-stack>
                </hud-surface-body>
                <hud-surface-footer>
                  <hud-button size="sm" variant="default">Dismiss</hud-button>
                  <hud-button size="sm" variant="active">Apply</hud-button>
                </hud-surface-footer>
              </hud-surface>

              <hud-stack>
                <hud-alert tone="default">Default alert</hud-alert>
                <hud-alert tone="green">Success alert</hud-alert>
                <hud-alert tone="orange">Warning alert</hud-alert>
                <hud-alert tone="red">Danger alert</hud-alert>
              </hud-stack>
            </hud-grid>
          `,
        )}
        ${this.renderSection(
          "Buttons And Actions",
          "Button variants, icon buttons, grouped actions, and compatibility action helper.",
          html`
            <div class="button-row">
              <hud-button variant="default">Default</hud-button>
              <hud-button variant="active">Primary</hud-button>
              <hud-button variant="default">Secondary</hud-button>
              <hud-button variant="default">Ghost</hud-button>
              <hud-button variant="danger">Danger</hud-button>
              <hud-button disabled>Disabled</hud-button>
              <hud-icon-button label="Close" variant="danger"
                >x</hud-icon-button
              >
              <hud-icon-button label="Settings" variant="default"
                >...</hud-icon-button
              >
            </div>
            <hud-action-group>
              <hud-button size="sm" variant="default">Reset</hud-button>
              <hud-button size="sm" variant="active">Save</hud-button>
            </hud-action-group>
            <div style="max-width: 160px">
              ${actionButton({
                icon: "/images/SoldierIcon.svg",
                iconAlt: "",
                title: "Action helper",
                label: "Action",
                type: "sky",
                onClick: () => undefined,
              })}
            </div>
          `,
        )}
        ${this.renderSection(
          "Labels, Pills, And Stats",
          "Tone variants and compact data display.",
          html`
            <div class="tone-row">
              ${[
                { label: "default", labelTone: "default", pillTone: "" },
                { label: "muted", labelTone: "muted", pillTone: "" },
                { label: "active", labelTone: "active", pillTone: "blue" },
                { label: "success", labelTone: "success", pillTone: "green" },
                { label: "warning", labelTone: "warning", pillTone: "orange" },
                { label: "danger", labelTone: "danger", pillTone: "red" },
                { label: "gold", labelTone: "gold", pillTone: "gold" },
              ].map(
                (tone) => html`
                  <hud-label tone=${tone.labelTone}>${tone.label}</hud-label>
                  <hud-pill tone=${tone.pillTone}>${tone.label}</hud-pill>
                `,
              )}
            </div>
            <hud-stat-grid columns="4">
              <hud-stat label="Food" value="2.4K" tone="green"></hud-stat>
              <hud-stat label="Population" value="44K"></hud-stat>
              <hud-stat label="Shortage" value="12%" tone="orange"></hud-stat>
              <hud-stat label="Gold" value="9.8K" tone="gold"></hud-stat>
            </hud-stat-grid>
          `,
        )}
        ${this.renderSection(
          "Forms",
          "Inputs, textarea, select, range, toggle, and checkbox with live values.",
          html`
            <hud-stack>
              <hud-form-row
                label="Text input"
                description="Generic text or number field."
              >
                <hud-input value="OpenFront" label="Text input"></hud-input>
              </hud-form-row>
              <hud-form-row label="Textarea">
                <hud-textarea
                  rows="3"
                  value="A longer form field for notes."
                  label="Textarea"
                ></hud-textarea>
              </hud-form-row>
              <hud-form-row label="Select">
                <hud-select
                  label="Strategy"
                  .value=${this.selectValue}
                  .options=${[
                    { value: "growth", label: "Growth" },
                    { value: "balanced", label: "Balanced" },
                    { value: "war", label: "War" },
                  ]}
                  @change=${(event: Event) => {
                    this.selectValue = (
                      event.target as HTMLElement & { value: string }
                    ).value;
                  }}
                ></hud-select>
              </hud-form-row>
              <hud-form-row label="Range">
                <hud-range
                  min="0"
                  max="100"
                  .value=${this.rangeValue}
                  label="Allocation"
                  @input=${(event: Event) => {
                    this.rangeValue = (
                      event.target as HTMLElement & { value: number }
                    ).value;
                  }}
                >
                  <span slot="value">${this.rangeValue}%</span>
                </hud-range>
              </hud-form-row>
              <hud-row>
                <hud-toggle
                  label="Toggle"
                  .checked=${this.toggleOn}
                  @change=${(event: Event) => {
                    this.toggleOn = (
                      event.target as HTMLElement & { checked: boolean }
                    ).checked;
                  }}
                ></hud-toggle>
                <hud-checkbox
                  label="Checkbox"
                  .checked=${this.checkboxOn}
                  @change=${(event: Event) => {
                    this.checkboxOn = (
                      event.target as HTMLElement & { checked: boolean }
                    ).checked;
                  }}
                ></hud-checkbox>
              </hud-row>
            </hud-stack>
          `,
        )}
        ${this.renderSection(
          "Rows, Tables, Menus, And States",
          "Repeated row structures, tables, menus, empty states, and loading states.",
          html`
            <div class="inline-grid">
              <hud-surface>
                <hud-surface-header><h3>List Rows</h3></hud-surface-header>
                <hud-list-row>
                  <span>#1 Player</span>
                  <hud-pill tone="gold">12K</hud-pill>
                </hud-list-row>
                <hud-list-row>
                  <span>#2 Player</span>
                  <hud-pill tone="blue">9K</hud-pill>
                </hud-list-row>
              </hud-surface>

              <hud-table>
                <hud-table-row class="table" tone="muted">
                  <hud-table-cell>Name</hud-table-cell>
                  <hud-table-cell align="right">Food</hud-table-cell>
                  <hud-table-cell align="right">Pop</hud-table-cell>
                </hud-table-row>
                <hud-table-row class="table">
                  <hud-table-cell>North</hud-table-cell>
                  <hud-table-cell align="right">2.1K</hud-table-cell>
                  <hud-table-cell align="right">44K</hud-table-cell>
                </hud-table-row>
                <hud-table-row class="table" tone="orange">
                  <hud-table-cell>South</hud-table-cell>
                  <hud-table-cell align="right">340</hud-table-cell>
                  <hud-table-cell align="right">18K</hud-table-cell>
                </hud-table-row>
              </hud-table>

              <hud-menu>
                <hud-menu-item>Tile square ruler</hud-menu-item>
                <hud-menu-item>Copy JSON</hud-menu-item>
                <hud-menu-item disabled>Disabled item</hud-menu-item>
              </hud-menu>

              <hud-stack>
                <hud-empty-state
                  label="No rows"
                  description="Empty state copy stays inside its surface."
                ></hud-empty-state>
                <hud-loading-state label="Loading values"></hud-loading-state>
              </hud-stack>
            </div>
          `,
        )}
        ${this.renderSection(
          "Modals",
          "Modal shell primitives composed from HUD controls.",
          html`
            <hud-row>
              <hud-button
                variant="active"
                @click=${() => (this.modalOpen = true)}
              >
                Open Modal
              </hud-button>
              <hud-divider></hud-divider>
            </hud-row>
            <hud-kit-frame shell style="--hud-kit-frame-width: 320px">
              <hud-modal-header>
                <hud-label>Modal shell</hud-label>
                <hud-icon-button label="Close">x</hud-icon-button>
              </hud-modal-header>
              <hud-modal-body>
                <hud-label tone="muted">
                  Header, body, and footer can be used inside hud-modal-shell.
                </hud-label>
              </hud-modal-body>
              <hud-modal-footer>
                <hud-button size="sm" variant="default">Cancel</hud-button>
                <hud-button size="sm" variant="active">Confirm</hud-button>
              </hud-modal-footer>
            </hud-kit-frame>
          `,
        )}

        <hud-modal-shell
          .open=${this.modalOpen}
          label="Shared UI modal"
          maxWidth="520px"
          @close=${() => (this.modalOpen = false)}
        >
          <hud-modal-header>
            <hud-label>Interactive Modal</hud-label>
            <hud-icon-button
              label="Close"
              @click=${() => (this.modalOpen = false)}
              >x</hud-icon-button
            >
          </hud-modal-header>
          <hud-modal-body>
            <hud-stack>
              <hud-alert tone="green"
                >Modal open/close behavior works.</hud-alert
              >
              <hud-form-row label="Amount">
                <hud-input type="number" value="42" label="Amount"></hud-input>
              </hud-form-row>
            </hud-stack>
          </hud-modal-body>
          <hud-modal-footer>
            <hud-button
              variant="default"
              @click=${() => (this.modalOpen = false)}
            >
              Cancel
            </hud-button>
            <hud-button
              variant="active"
              @click=${() => (this.modalOpen = false)}
            >
              Done
            </hud-button>
          </hud-modal-footer>
        </hud-modal-shell>
      </main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hud-ui-review-page": HudUiReviewPage;
  }
}
