import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";

type CatalogFont = "mono" | "sans";
type CatalogDensity = "compact" | "normal" | "touch";

@customElement("hud-ui-kit-catalog")
export class HudUiKitCatalog extends LitElement {
  @state()
  private font: CatalogFont = "mono";

  @state()
  private density: CatalogDensity = "compact";

  @state()
  private radius = 3;

  @state()
  private opacity = 88;

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: #0f172a;
      color: #f8fafc;
      font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    .kit {
      --hud-bg-rgb: 17, 24, 39;
      --hud-alpha: 0.88;
      --hud-bg: rgba(var(--hud-bg-rgb), var(--hud-alpha));
      --hud-border: rgba(255, 255, 255, 0.12);
      --hud-border-strong: rgba(255, 255, 255, 0.24);
      --hud-muted: rgba(226, 232, 240, 0.66);
      --hud-text: #f8fafc;
      --hud-radius: 3px;
      --hud-gap: 6px;
      --hud-pad-x: 8px;
      --hud-pad-y: 4px;
      --hud-font:
        ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        "Liberation Mono", "Courier New", monospace;
      --hud-accent: #3fa9f5;

      min-height: 100vh;
      padding: 24px;
      font-family: var(--hud-font);
      font-size: 12px;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0;
    }

    .kit[data-font="sans"] {
      --hud-font:
        Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
        "Segoe UI", sans-serif;
    }

    .kit[data-density="normal"] {
      --hud-gap: 8px;
      --hud-pad-x: 10px;
      --hud-pad-y: 6px;
      font-size: 13px;
    }

    .kit[data-density="touch"] {
      --hud-gap: 10px;
      --hud-pad-x: 12px;
      --hud-pad-y: 8px;
      font-size: 14px;
    }

    .topbar {
      display: flex;
      flex-wrap: wrap;
      align-items: end;
      justify-content: space-between;
      gap: 16px;
      max-width: 1280px;
      margin: 0 auto 18px;
    }

    h1,
    h2,
    h3,
    p {
      margin: 0;
    }

    h1 {
      font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
      font-size: 22px;
      font-weight: 650;
    }

    .subtle {
      color: var(--hud-muted);
    }

    .controls,
    .row,
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--hud-gap);
      align-items: center;
    }

    .control {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border: 1px solid var(--hud-border);
      border-radius: var(--hud-radius);
      background: rgba(15, 23, 42, 0.78);
    }

    .control label {
      color: var(--hud-muted);
      font-size: 11px;
    }

    .control select,
    .control input {
      height: 24px;
      border: 1px solid var(--hud-border);
      border-radius: max(2px, calc(var(--hud-radius) - 1px));
      background: #020617;
      color: var(--hud-text);
      font: inherit;
    }

    .control input[type="number"] {
      width: 56px;
      padding: 0 5px;
    }

    .catalog {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 14px;
      max-width: 1280px;
      margin: 0 auto;
    }

    .surface {
      color: var(--hud-text);
      border: 1px solid var(--hud-border);
      border-radius: var(--hud-radius);
      background: var(--hud-bg);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.28);
      backdrop-filter: blur(4px);
      overflow: hidden;
    }

    .surface-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-height: 26px;
      padding: var(--hud-pad-y) var(--hud-pad-x);
      border-bottom: 1px solid var(--hud-border);
      background: rgba(15, 23, 42, 0.5);
      font-weight: 600;
    }

    .surface-body {
      padding: var(--hud-pad-x);
    }

    .surface-body.flush {
      padding: 0;
    }

    .sample-title {
      color: var(--hud-muted);
      font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
      font-size: 11px;
      font-weight: 650;
      text-transform: uppercase;
    }

    button,
    .button,
    select {
      min-height: 24px;
      padding: 3px 7px;
      border: 1px solid var(--hud-border-strong);
      border-radius: max(2px, calc(var(--hud-radius) - 1px));
      background: rgba(2, 6, 23, 0.36);
      color: var(--hud-text);
      font: inherit;
      font-weight: 500;
      line-height: 1;
    }

    button.active,
    .button.active {
      border-color: color-mix(in srgb, var(--hud-accent) 80%, white);
      background: color-mix(in srgb, var(--hud-accent) 34%, transparent);
    }

    button.danger {
      border-color: rgba(248, 113, 113, 0.7);
      color: #fecaca;
    }

    .icon-button {
      display: inline-grid;
      width: 24px;
      min-width: 24px;
      height: 24px;
      padding: 0;
      place-items: center;
      font-weight: 650;
    }

    .pill,
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 18px;
      padding: 0 7px;
      border: 1px solid color-mix(in srgb, var(--hud-accent) 65%, white);
      border-radius: 999px;
      background: color-mix(in srgb, var(--hud-accent) 28%, transparent);
      color: #e0f2fe;
      font-size: 10px;
      font-weight: 700;
      white-space: nowrap;
    }

    .green {
      border-color: rgba(74, 222, 128, 0.7);
      background: rgba(34, 197, 94, 0.22);
      color: #86efac;
    }

    .gold {
      border-color: rgba(250, 204, 21, 0.72);
      background: rgba(234, 179, 8, 0.2);
      color: #fde68a;
    }

    .red {
      border-color: rgba(248, 113, 113, 0.7);
      background: rgba(239, 68, 68, 0.2);
      color: #fca5a5;
    }

    .segmented {
      display: inline-grid;
      grid-auto-flow: column;
      grid-auto-columns: minmax(0, 1fr);
      min-width: 0;
      overflow: hidden;
      border: 1px solid var(--hud-border-strong);
      border-radius: max(2px, calc(var(--hud-radius) - 1px));
      background: rgba(2, 6, 23, 0.3);
    }

    .segmented.fill {
      display: grid;
      width: 100%;
    }

    .segment {
      min-height: 22px;
      min-width: 0;
      padding: 0 8px;
      border: 0;
      border-left: 1px solid var(--hud-border);
      border-radius: 0;
      background: transparent;
      color: var(--hud-muted);
      font-size: 10px;
      font-weight: 600;
      line-height: 1;
    }

    .segment:first-child {
      border-left: 0;
    }

    .segment.active {
      background: color-mix(in srgb, var(--hud-accent) 32%, transparent);
      color: var(--hud-text);
    }

    .segment.icon {
      width: 24px;
      padding: 0;
    }

    .bar {
      position: relative;
      height: 24px;
      overflow: hidden;
      border: 1px solid var(--hud-border-strong);
      border-radius: max(2px, calc(var(--hud-radius) - 1px));
      background: rgba(2, 6, 23, 0.42);
    }

    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #22c55e, var(--hud-accent));
    }

    .bar-text {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      text-shadow: 0 1px 1px #000;
    }

    .blend {
      display: grid;
      grid-template-columns: 9ch 1fr;
      gap: var(--hud-gap);
      align-items: center;
      margin-top: 6px;
    }

    .blend-label {
      color: var(--hud-muted);
    }

    .blend-bar {
      display: grid;
      grid-template-columns: 34fr 33fr 33fr;
      height: 18px;
      overflow: hidden;
      border: 1px solid var(--hud-border-strong);
      border-radius: max(2px, calc(var(--hud-radius) - 1px));
      color: #fff;
      text-shadow: 0 1px 1px #000;
    }

    .blend-bar div {
      display: grid;
      place-items: center;
      min-width: 0;
      overflow: hidden;
      font-size: 10px;
    }

    .food {
      background: #22c55e;
    }

    .fuel {
      background: #06b6d4;
    }

    .metal {
      background: #d6d3d1;
      color: #111827;
      text-shadow: none;
    }

    .compact-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      line-height: 1.2;
    }

    .compact-table th,
    .compact-table td {
      height: calc(12px + var(--hud-pad-y) * 2);
      padding: var(--hud-pad-y) var(--hud-pad-x);
      border-bottom: 1px solid rgba(255, 255, 255, 0.09);
      text-align: right;
      vertical-align: middle;
      white-space: nowrap;
    }

    .compact-table th {
      color: var(--hud-muted);
      background: rgba(15, 23, 42, 0.28);
      font-weight: 650;
    }

    .compact-table th:first-child,
    .compact-table td:first-child,
    .compact-table td.text {
      text-align: left;
    }

    .compact-table tr:last-child td {
      border-bottom: 0;
    }

    .compact-table td.text {
      max-width: 28ch;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .compact-table .action-group {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      white-space: nowrap;
    }

    .compact-table button {
      min-height: 16px;
      padding: 1px 4px;
      font-size: 10px;
    }

    .event-table .meta {
      width: 7ch;
      color: var(--hud-muted);
    }

    .event-table .action-cell {
      width: 12ch;
    }

    input[type="range"] {
      width: 100%;
      accent-color: var(--hud-accent);
    }

    .form-grid {
      display: grid;
      grid-template-columns: 8ch 1fr;
      gap: 8px;
      align-items: center;
    }

    .form-grid label {
      color: var(--hud-muted);
    }

    .tooltip {
      display: inline-block;
      padding: 3px 6px;
      border: 1px solid var(--hud-border);
      border-radius: max(2px, calc(var(--hud-radius) - 1px));
      background: rgba(2, 6, 23, 0.82);
      color: var(--hud-text);
      font-size: 10px;
    }
  `;

  private get alpha() {
    return this.opacity / 100;
  }

  render() {
    return html`
      <main
        class="kit"
        data-font=${this.font}
        data-density=${this.density}
        style=${`--hud-radius:${this.radius}px; --hud-alpha:${this.alpha};`}
      >
        <div class="topbar">
          <div>
            <h1>HUD UI Kit Catalog</h1>
            <p class="subtle">
              Shared containers and primitives for HUD overlays.
            </p>
          </div>
          ${this.renderControls()}
        </div>
        <section class="catalog">
          ${this.renderSurfaces()} ${this.renderButtons()}
          ${this.renderTables()} ${this.renderEvents()}
          ${this.renderControlsSample()} ${this.renderPopover()}
          ${this.renderForms()} ${this.renderDialog()}
        </section>
      </main>
    `;
  }

  private renderControls() {
    return html`
      <div class="controls">
        <div class="control">
          <label>Font</label>
          <select
            .value=${this.font}
            @change=${(event: Event) =>
              (this.font = (event.target as HTMLSelectElement)
                .value as CatalogFont)}
          >
            <option value="mono">Mono</option>
            <option value="sans">Sans</option>
          </select>
        </div>
        <div class="control">
          <label>Density</label>
          <select
            .value=${this.density}
            @change=${(event: Event) =>
              (this.density = (event.target as HTMLSelectElement)
                .value as CatalogDensity)}
          >
            <option value="compact">Compact</option>
            <option value="normal">Normal</option>
            <option value="touch">Touch</option>
          </select>
        </div>
        <div class="control">
          <label>Radius</label>
          <input
            type="number"
            min="0"
            max="10"
            .value=${String(this.radius)}
            @input=${(event: Event) =>
              (this.radius = Number((event.target as HTMLInputElement).value))}
          />
        </div>
        <div class="control">
          <label>Opacity</label>
          <input
            type="number"
            min="65"
            max="100"
            .value=${String(this.opacity)}
            @input=${(event: Event) =>
              (this.opacity = Number((event.target as HTMLInputElement).value))}
          />
        </div>
      </div>
    `;
  }

  private renderSurfaces() {
    return html`
      <section class="surface">
        <div class="surface-header">
          <span>Surface Sections</span>
          <span class="subtle">header + body</span>
        </div>
        <div class="surface-body">
          <div class="sample-title">Body container</div>
          <p class="subtle">
            Every card-like HUD element should be built from surface, optional
            header, and surface-body.
          </p>
        </div>
      </section>
    `;
  }

  private renderButtons() {
    return html`
      <section class="surface">
        <div class="surface-header">
          <span>Buttons</span>
          <span class="subtle">text + icon</span>
        </div>
        <div class="surface-body">
          <div class="row">
            <button>Default</button>
            <button class="active">Active</button>
            <button class="danger">Danger</button>
            <button class="icon-button">S</button>
            <button class="icon-button active">P</button>
          </div>
          <div class="row" style="margin-top: 8px;">
            <span class="pill">Neutral pill</span>
            <span class="pill green">+18.4K/s</span>
            <span class="pill gold">92K</span>
            <span class="pill red">00:42</span>
          </div>
        </div>
      </section>
    `;
  }

  private renderTables() {
    return html`
      <section class="surface">
        <div class="surface-header">
          <span>Compact Table</span>
          <span class="subtle">10px</span>
        </div>
        <table class="compact-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Owned</th>
              <th>Gold</th>
              <th>Troops</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>You</td>
              <td>25.4%</td>
              <td>92K</td>
              <td>1.9M</td>
            </tr>
            <tr>
              <td>East March</td>
              <td>18.2%</td>
              <td>107K</td>
              <td>1.3M</td>
            </tr>
          </tbody>
        </table>
      </section>
    `;
  }

  private renderEvents() {
    return html`
      <section class="surface">
        <div class="surface-header">
          <span>Event Rows</span>
          <span class="actions">
            <span class="segmented">
              <button class="segment icon active">A</button>
              <button class="segment icon">N</button>
            </span>
            <button>Hide</button>
          </span>
        </div>
        <table class="compact-table event-table">
          <tbody>
            <tr>
              <td class="meta">00:42</td>
              <td class="text">Red requested attack on Delta.</td>
              <td class="action-cell">
                <div class="action-group">
                  <button>Focus</button><button>Accept</button>
                </div>
              </td>
            </tr>
            <tr>
              <td class="meta">00:36</td>
              <td class="text green">+12.4K gold from trade.</td>
              <td class="action-cell"></td>
            </tr>
          </tbody>
        </table>
      </section>
    `;
  }

  private renderControlsSample() {
    return html`
      <section class="surface">
        <div class="surface-header">
          <span>Controls</span>
          <span class="subtle">bars + sliders</span>
        </div>
        <div class="surface-body">
          <div class="segmented fill">
            <button class="segment active">Troops</button>
            <button class="segment">Biomass</button>
            <button class="segment">Metals</button>
          </div>
          <div class="bar" style="margin-top: 8px;">
            <div class="bar-fill" style="width: 68%;"></div>
            <div class="bar-text">1.8M / 2.6M</div>
          </div>
          <div class="row" style="margin-top: 8px;">
            <span class="pill">Attack</span>
            <input type="range" value="25" />
            <span class="pill">25%</span>
          </div>
          <div class="blend">
            <span class="blend-label">Import</span>
            <div class="blend-bar">
              <div class="food">20</div>
              <div class="fuel">50</div>
              <div class="metal">30</div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  private renderPopover() {
    return html`
      <section class="surface">
        <div class="surface-header">
          <span>Player Popover</span>
          <span class="subtle">top hover</span>
        </div>
        <table class="compact-table">
          <thead>
            <tr>
              <th>Nation</th>
              <th>Owned</th>
              <th>Gold</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>East March</td>
              <td>18.2%</td>
              <td>107K</td>
              <td><span class="pill green">Allied</span></td>
            </tr>
          </tbody>
        </table>
      </section>
    `;
  }

  private renderForms() {
    return html`
      <section class="surface">
        <div class="surface-header">
          <span>Form Inputs</span>
          <span class="subtle">settings</span>
        </div>
        <div class="surface-body form-grid">
          <label>Mode</label>
          <select>
            <option>Compact</option>
          </select>
          <label>Amount</label>
          <input type="range" value="60" />
          <label>Hint</label>
          <span class="tooltip">Tooltip / hover text</span>
        </div>
      </section>
    `;
  }

  private renderDialog() {
    return html`
      <section class="surface">
        <div class="surface-header">
          <span>Dialog</span>
          <span class="subtle">modal body</span>
        </div>
        <div class="surface-body">
          <p class="subtle">
            Confirmation and small modal surfaces should use the same body
            spacing and button scale.
          </p>
          <div class="actions" style="margin-top: 10px;">
            <button>Cancel</button>
            <button class="active">Confirm</button>
          </div>
        </div>
      </section>
    `;
  }
}
