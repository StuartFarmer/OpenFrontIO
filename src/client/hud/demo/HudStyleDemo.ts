import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";

type DemoFont = "mono" | "sans";
type DemoDensity = "compact" | "normal" | "touch";

interface LeaderboardRow {
  rank: number;
  name: string;
  owned: string;
  gold: string;
  troops: string;
  relation: "self" | "ally" | "neutral";
}

interface EventRow {
  tone: "attack" | "trade" | "alliance" | "system";
  text: string;
  meta: string;
  actions?: string[];
}

const leaderboardRows: LeaderboardRow[] = [
  {
    rank: 1,
    name: "Fracture",
    owned: "31.8%",
    gold: "148K",
    troops: "2.4M",
    relation: "neutral",
  },
  {
    rank: 2,
    name: "You",
    owned: "25.4%",
    gold: "92K",
    troops: "1.9M",
    relation: "self",
  },
  {
    rank: 3,
    name: "East March",
    owned: "18.2%",
    gold: "107K",
    troops: "1.3M",
    relation: "ally",
  },
  {
    rank: 4,
    name: "Narrow Coast Federation",
    owned: "9.7%",
    gold: "41K",
    troops: "812K",
    relation: "neutral",
  },
  {
    rank: 5,
    name: "Delta",
    owned: "6.1%",
    gold: "18K",
    troops: "430K",
    relation: "neutral",
  },
];

const events: EventRow[] = [
  {
    tone: "attack",
    text: "Red requested attack on Delta.",
    meta: "00:42",
    actions: ["Focus", "Accept"],
  },
  {
    tone: "trade",
    text: "+12.4K gold received from trade route.",
    meta: "00:36",
  },
  {
    tone: "alliance",
    text: "Alliance with East March expires in 24s.",
    meta: "00:21",
    actions: ["Renew", "Ignore"],
  },
  {
    tone: "system",
    text: "Missile silo captured near the capital.",
    meta: "00:07",
  },
];

@customElement("hud-style-demo")
export class HudStyleDemo extends LitElement {
  @state()
  private font: DemoFont = "mono";

  @state()
  private density: DemoDensity = "compact";

  @state()
  private radius = 3;

  @state()
  private opacity = 88;

  @state()
  private accent = "#3fa9f5";

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background:
        linear-gradient(rgba(3, 7, 18, 0.35), rgba(3, 7, 18, 0.75)),
        radial-gradient(circle at 22% 20%, #1e3a5f 0, transparent 26%),
        radial-gradient(circle at 80% 16%, #214334 0, transparent 26%),
        linear-gradient(135deg, #101827, #18202a 48%, #111827);
      color: #e5edf6;
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

    .demo {
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

    .demo[data-font="sans"] {
      --hud-font:
        Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
        "Segoe UI", sans-serif;
    }

    .demo[data-density="normal"] {
      --hud-gap: 8px;
      --hud-pad-x: 10px;
      --hud-pad-y: 6px;
      font-size: 13px;
    }

    .demo[data-density="touch"] {
      --hud-gap: 10px;
      --hud-pad-x: 12px;
      --hud-pad-y: 8px;
      font-size: 14px;
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin: 0 auto 20px;
      max-width: 1320px;
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
      font-size: 20px;
      font-weight: 650;
    }

    .subtle {
      color: var(--hud-muted);
    }

    .controls {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 8px;
    }

    .control {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border: 1px solid var(--hud-border);
      border-radius: var(--hud-radius);
      background: rgba(15, 23, 42, 0.78);
      color: var(--hud-text);
    }

    .control label {
      color: var(--hud-muted);
      font-size: 11px;
      white-space: nowrap;
    }

    .control select,
    .control input[type="number"],
    .control input[type="color"] {
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

    .control input[type="range"] {
      width: 94px;
      accent-color: var(--hud-accent);
    }

    .stage {
      position: relative;
      max-width: 1320px;
      min-height: 760px;
      margin: 0 auto;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      background:
        linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
        linear-gradient(135deg, #1e293b, #0f172a);
      background-size:
        28px 28px,
        28px 28px,
        auto;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.36);
    }

    .map-label {
      position: absolute;
      padding: 3px 6px;
      border-radius: 2px;
      background: rgba(0, 0, 0, 0.38);
      color: rgba(255, 255, 255, 0.68);
      font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
      font-size: 12px;
    }

    .map-label.one {
      left: 18%;
      top: 38%;
    }

    .map-label.two {
      right: 24%;
      top: 30%;
    }

    .map-label.three {
      left: 48%;
      bottom: 28%;
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

    .section-label {
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

    .leaderboard {
      position: absolute;
      top: 18px;
      left: 18px;
      width: 368px;
      font-size: 10px;
      line-height: 1.2;
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
      vertical-align: middle;
      white-space: nowrap;
    }

    .compact-table tr:last-child td {
      border-bottom: 0;
    }

    .compact-table th {
      color: var(--hud-muted);
      background: rgba(15, 23, 42, 0.28);
      font-size: 10px;
      font-weight: 650;
      text-align: right;
    }

    .compact-table th.name,
    .compact-table td.name,
    .compact-table td.text {
      text-align: left;
    }

    .compact-table td {
      text-align: right;
    }

    .compact-table td.rank {
      width: 4ch;
      color: var(--hud-muted);
      text-align: right;
    }

    .compact-table td.name,
    .compact-table td.text {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .compact-table td.name {
      max-width: 18ch;
    }

    .compact-table td.text {
      max-width: 30ch;
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
      text-align: left;
    }

    .event-table .action-cell {
      width: 12ch;
    }

    .event-table .empty-actions {
      display: inline-block;
      width: 12ch;
    }

    .event-table tr.attack .text {
      color: #fca5a5;
    }

    .event-table tr.trade .text {
      color: #86efac;
    }

    .event-table tr.alliance .text {
      color: #93c5fd;
    }

    .event-table tr.system .text {
      color: var(--hud-text);
    }

    td.name {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    tr.self td {
      color: #dbeafe;
      background: color-mix(in srgb, var(--hud-accent) 20%, transparent);
    }

    tr.ally td.name::before {
      content: "";
      display: inline-block;
      width: 6px;
      height: 6px;
      margin-right: 6px;
      border-radius: 50%;
      background: #34d399;
      vertical-align: middle;
    }

    .sort {
      display: inline-block;
      width: 1ch;
      color: var(--hud-accent);
      text-align: center;
    }

    .events {
      position: absolute;
      right: 18px;
      bottom: 18px;
      width: 430px;
    }

    .actions {
      display: flex;
      gap: 4px;
    }

    .top-right {
      position: absolute;
      top: 18px;
      right: 18px;
      display: flex;
      flex-direction: column;
      align-items: end;
      gap: var(--hud-gap);
    }

    .timebar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: var(--hud-pad-y) var(--hud-pad-x);
    }

    .time {
      min-width: 7ch;
      text-align: right;
      color: #f8fafc;
    }

    .replay {
      width: 290px;
    }

    button,
    .button {
      min-height: 24px;
      padding: 3px 7px;
      border: 1px solid var(--hud-border-strong);
      border-radius: max(2px, calc(var(--hud-radius) - 1px));
      background: rgba(2, 6, 23, 0.36);
      color: var(--hud-text);
      font: inherit;
      font-weight: 500;
      line-height: 1;
      cursor: pointer;
    }

    button:hover,
    .button:hover {
      border-color: rgba(255, 255, 255, 0.45);
      background: rgba(255, 255, 255, 0.08);
    }

    button.active,
    .button.active {
      border-color: color-mix(in srgb, var(--hud-accent) 80%, white);
      background: color-mix(in srgb, var(--hud-accent) 34%, transparent);
      color: #ffffff;
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

    .segment-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      min-width: 0;
    }

    .segment-content span {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .control-panel {
      position: absolute;
      left: 50%;
      bottom: 18px;
      width: min(560px, calc(100% - 48px));
      transform: translateX(-50%);
    }

    .panel-row {
      display: flex;
      align-items: center;
      gap: var(--hud-gap);
      margin-bottom: var(--hud-gap);
    }

    .pill {
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
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

    .pill.green {
      border-color: rgba(74, 222, 128, 0.7);
      background: rgba(34, 197, 94, 0.22);
      color: #86efac;
    }

    .pill.gold {
      border-color: rgba(250, 204, 21, 0.72);
      background: rgba(234, 179, 8, 0.2);
      color: #fde68a;
    }

    .bar {
      position: relative;
      flex: 1;
      min-width: 130px;
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
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      text-shadow: 0 1px 1px rgba(0, 0, 0, 0.9);
    }

    .slider-row {
      display: flex;
      align-items: center;
      gap: var(--hud-gap);
    }

    .slider-row label {
      width: 9ch;
      color: var(--hud-muted);
    }

    input[type="range"] {
      width: 100%;
      accent-color: var(--hud-accent);
    }

    .blend {
      display: grid;
      grid-template-columns: 9ch 1fr;
      gap: var(--hud-gap);
      align-items: center;
      margin-top: 4px;
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
      background: rgba(2, 6, 23, 0.42);
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

    .player-popover {
      position: absolute;
      top: 18px;
      left: 50%;
      width: 430px;
      transform: translateX(-50%);
    }

    .left-tools {
      position: absolute;
      left: 18px;
      bottom: 18px;
      display: flex;
      flex-direction: column;
      gap: var(--hud-gap);
    }

    .tool-strip {
      display: flex;
      gap: 4px;
      padding: 5px;
    }

    .mini-modal {
      width: 260px;
    }

    .mini-modal p {
      margin: 8px 0;
      color: var(--hud-muted);
      line-height: 1.35;
    }

    @media (max-width: 980px) {
      .stage {
        display: flex;
        min-height: auto;
        flex-direction: column;
        gap: 12px;
        padding: 12px;
      }

      .leaderboard,
      .events,
      .top-right,
      .control-panel,
      .player-popover,
      .left-tools {
        position: static;
        width: 100%;
        transform: none;
      }

      .top-right {
        align-items: stretch;
      }
    }
  `;

  private get alpha() {
    return this.opacity / 100;
  }

  private updateRadius(event: Event) {
    this.radius = Number((event.target as HTMLInputElement).value);
  }

  private updateOpacity(event: Event) {
    this.opacity = Number((event.target as HTMLInputElement).value);
  }

  private updateAccent(event: Event) {
    this.accent = (event.target as HTMLInputElement).value;
  }

  render() {
    return html`
      <main
        class="demo"
        data-font=${this.font}
        data-density=${this.density}
        style=${`--hud-radius:${this.radius}px; --hud-alpha:${this.alpha}; --hud-accent:${this.accent};`}
      >
        <div class="topbar">
          <div>
            <h1>HUD Style Demo</h1>
            <p class="subtle">
              Isolated styling sandbox for leaderboard, log, controls, popovers,
              and HUD inputs.
            </p>
          </div>
          <div class="controls">
            <div class="control">
              <label for="font">Font</label>
              <select
                id="font"
                .value=${this.font}
                @change=${(event: Event) =>
                  (this.font = (event.target as HTMLSelectElement)
                    .value as DemoFont)}
              >
                <option value="mono">Mono</option>
                <option value="sans">Sans</option>
              </select>
            </div>
            <div class="control">
              <label for="density">Density</label>
              <select
                id="density"
                .value=${this.density}
                @change=${(event: Event) =>
                  (this.density = (event.target as HTMLSelectElement)
                    .value as DemoDensity)}
              >
                <option value="compact">Compact</option>
                <option value="normal">Normal</option>
                <option value="touch">Touch</option>
              </select>
            </div>
            <div class="control">
              <label for="radius">Radius</label>
              <input
                id="radius"
                type="range"
                min="0"
                max="10"
                .value=${String(this.radius)}
                @input=${this.updateRadius}
              />
              <input
                type="number"
                min="0"
                max="10"
                .value=${String(this.radius)}
                @input=${this.updateRadius}
              />
            </div>
            <div class="control">
              <label for="opacity">Opacity</label>
              <input
                id="opacity"
                type="range"
                min="65"
                max="100"
                .value=${String(this.opacity)}
                @input=${this.updateOpacity}
              />
              <input
                type="number"
                min="65"
                max="100"
                .value=${String(this.opacity)}
                @input=${this.updateOpacity}
              />
            </div>
            <div class="control">
              <label for="accent">Accent</label>
              <input
                id="accent"
                type="color"
                .value=${this.accent}
                @input=${this.updateAccent}
              />
            </div>
          </div>
        </div>

        <section class="stage" aria-label="HUD component preview">
          <div class="map-label one">West Reach</div>
          <div class="map-label two">North Gate</div>
          <div class="map-label three">Harbor Line</div>

          ${this.renderLeaderboard()} ${this.renderPlayerPopover()}
          ${this.renderTopRightControls()} ${this.renderEventLog()}
          ${this.renderControlPanel()} ${this.renderLeftTools()}
        </section>
      </main>
    `;
  }

  private renderLeaderboard() {
    return html`
      <section class="surface leaderboard">
        <div class="surface-header">
          <span>Leaderboard</span>
          <span class="subtle">tiles <span class="sort">v</span></span>
        </div>
        <table class="compact-table">
          <thead>
            <tr>
              <th>#</th>
              <th class="name">Player</th>
              <th>Owned</th>
              <th>Gold</th>
              <th>Troops</th>
            </tr>
          </thead>
          <tbody>
            ${leaderboardRows.map(
              (row) => html`
                <tr class=${row.relation}>
                  <td class="rank">${row.rank}</td>
                  <td class="name">${row.name}</td>
                  <td>${row.owned}</td>
                  <td>${row.gold}</td>
                  <td>${row.troops}</td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      </section>
    `;
  }

  private renderPlayerPopover() {
    return html`
      <section class="surface player-popover">
        <table class="compact-table">
          <thead>
            <tr>
              <th class="name">Nation</th>
              <th>Owned</th>
              <th>Gold</th>
              <th>Troops</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="name">East March</td>
              <td>18.2%</td>
              <td>107K</td>
              <td>1.3M</td>
              <td><span class="pill green">Allied</span></td>
            </tr>
          </tbody>
        </table>
      </section>
    `;
  }

  private renderTopRightControls() {
    return html`
      <div class="top-right">
        <section class="surface timebar">
          <span class="time">12:48</span>
          <button class="icon-button" aria-label="Replay">R</button>
          <button class="icon-button" aria-label="Pause">II</button>
          <button class="icon-button" aria-label="Settings">S</button>
          <button class="icon-button" aria-label="Fullscreen">F</button>
          <button class="icon-button" aria-label="Exit">X</button>
        </section>
        <section class="surface replay">
          <div class="surface-header">
            <span>Replay Speed</span>
            <span class="subtle">active x2</span>
          </div>
          <div class="surface-body">
            <div class="segmented fill">
              <button class="segment">x0.5</button>
              <button class="segment">x1</button>
              <button class="segment active">x2</button>
              <button class="segment">Max</button>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  private renderEventLog() {
    return html`
      <section class="surface events">
        <div class="surface-header">
          <span>Events</span>
          <div class="actions">
            <div class="segmented">
              <button class="segment icon active" aria-label="Attacks">
                A
              </button>
              <button class="segment icon" aria-label="Nukes">N</button>
              <button class="segment icon active" aria-label="Trade">G</button>
              <button class="segment icon active" aria-label="Alliances">
                L
              </button>
            </div>
            <button>Hide</button>
          </div>
        </div>
        <table class="compact-table event-table">
          <tbody>
            ${events.map(
              (event) => html`
                <tr class=${event.tone}>
                  <td class="meta">${event.meta}</td>
                  <td class="text">${event.text}</td>
                  <td class="action-cell">
                    ${event.actions
                      ? html`<div class="action-group">
                          ${event.actions.map(
                            (action) => html`<button>${action}</button>`,
                          )}
                        </div>`
                      : html`<span class="empty-actions"></span>`}
                  </td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      </section>
    `;
  }

  private renderControlPanel() {
    return html`
      <section class="surface control-panel">
        <div class="surface-body">
          <div class="segmented fill" style="margin-bottom: var(--hud-gap);">
            <button class="segment active">
              <span class="segment-content"
                ><span>Troops</span><b>1.8M</b></span
              >
            </button>
            <button class="segment">
              <span class="segment-content"
                ><span>Biomass</span><b>76K</b></span
              >
            </button>
            <button class="segment">
              <span class="segment-content"><span>Fuels</span><b>42K</b></span>
            </button>
            <button class="segment">
              <span class="segment-content"><span>Metals</span><b>64K</b></span>
            </button>
          </div>
          <div class="panel-row">
            <span class="pill green">+18.4K/s</span>
            <div class="bar">
              <div class="bar-fill" style="width: 68%;"></div>
              <div class="bar-text">1.8M / 2.6M</div>
            </div>
            <span class="pill gold">92K</span>
          </div>
          <div class="slider-row">
            <label>Attack</label>
            <span class="pill">25%</span>
            <input type="range" min="1" max="100" value="25" />
          </div>
          <div class="blend">
            <span class="blend-label">Production</span>
            <div class="blend-bar">
              <div class="food">34</div>
              <div class="fuel">33</div>
              <div class="metal">33</div>
            </div>
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

  private renderLeftTools() {
    return html`
      <div class="left-tools">
        <section class="surface tool-strip">
          <button class="icon-button active" aria-label="Leaderboard">L</button>
          <button class="icon-button" aria-label="Team stats">T</button>
          <button class="icon-button" aria-label="Build">B</button>
          <button class="icon-button" aria-label="Emoji">E</button>
        </section>
        <section class="surface mini-modal">
          <div class="surface-body">
            <div class="section-label">Dialog Surface</div>
            <p>
              Compact modal, tooltip, and confirmation styling should use the
              same base radius and typography without forcing bold text.
            </p>
            <div class="actions">
              <button>Cancel</button>
              <button class="active">Confirm</button>
            </div>
          </div>
        </section>
      </div>
    `;
  }
}
