import { css, html, LitElement } from "lit";
import { customElement, query } from "lit/decorators.js";
import "../../../client/hud/ui";
import { FoundationDynamicsReactBridge } from "../dynamics/react/FoundationDynamicsReactBridge";

@customElement("foundation-dynamics-page")
export class FoundationDynamicsPage extends LitElement {
  @query("#react-flow-host")
  private reactFlowHost?: HTMLDivElement;

  @query("#dynamics-left-panel")
  private dynamicsLeftPanel?: HTMLDivElement;

  private reactBridge?: FoundationDynamicsReactBridge;

  render() {
    return html`
      <main class="app">
        <aside class="controls" aria-label="Foundation dynamics controls">
          <div class="brand">
            <h1>Foundation</h1>
            <p>Dynamics builder</p>
          </div>

          <div id="dynamics-left-panel" class="dynamics-left-panel"></div>
        </aside>

        <section class="workspace" aria-label="Foundation dynamics workspace">
          <header class="statusbar">
            <div>
              <strong>/foundation/dynamics</strong>
              <span>systems builder</span>
            </div>
            <div>
              <span>React Flow canvas</span>
            </div>
          </header>

          <hud-surface class="map-panel">
            <hud-surface-header>
              <div class="panel-head-content">
                <h2>Dynamics</h2>
                <span>stock and flow workspace</span>
              </div>
            </hud-surface-header>
            <hud-surface-body class="canvas-frame-host">
              <div
                id="react-flow-host"
                class="react-flow-host"
                aria-label="Dynamics graph canvas"
              ></div>
            </hud-surface-body>
          </hud-surface>
        </section>
      </main>
    `;
  }

  firstUpdated(): void {
    this.mountReactBridge();
  }

  disconnectedCallback(): void {
    this.reactBridge?.unmount();
    this.reactBridge = undefined;
    super.disconnectedCallback();
  }

  private mountReactBridge(): void {
    if (
      this.reactFlowHost === undefined ||
      this.dynamicsLeftPanel === undefined ||
      this.reactBridge !== undefined
    ) {
      return;
    }
    this.reactBridge = new FoundationDynamicsReactBridge(
      this.reactFlowHost,
      this.dynamicsLeftPanel,
    );
  }

  static styles = css`
    :host {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 50000;
      overflow: auto;
      color-scheme: dark;
      --bg: #101416;
      --panel: #181d20;
      --panel-2: #20262a;
      --line: #30383d;
      --text: #e7ecef;
      --muted: #9daab1;
      --accent: #7dc8a6;
      background: var(--bg);
      color: var(--text);
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

    .app {
      height: 100vh;
      min-height: 0;
      display: grid;
      grid-template-columns: 320px minmax(0, 1fr);
    }

    .controls {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      border-right: 1px solid var(--line);
      background: var(--panel);
      padding: 20px;
      overflow: hidden;
      max-height: 100vh;
    }

    .brand {
      margin-bottom: 22px;
    }

    .brand h1 {
      margin: 0;
      font-size: 24px;
      line-height: 1.1;
    }

    .brand p {
      margin: 6px 0 0;
      color: var(--muted);
      font-size: 14px;
    }

    .dynamics-left-panel {
      min-height: 0;
      overflow-y: auto;
      padding-right: 2px;
    }

    .control-section {
      display: block;
      margin-bottom: 14px;
      --hud-radius: 8px;
      --hud-surface-header-min-height: 42px;
      --hud-surface-header-padding: 10px 12px;
      --hud-surface-body-padding: 12px;
    }

    .control-section::part(surface) {
      border: 1px solid rgb(48 56 61 / 0.86);
      background: rgb(24 29 32 / 0.92);
    }

    .section-title {
      color: var(--accent);
      font-size: 13px;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    .control-copy {
      display: grid;
      gap: 6px;
    }

    .control-copy strong {
      font-size: 13px;
    }

    .control-copy span {
      color: var(--muted);
      font-size: 12px;
      line-height: 1.35;
    }

    .workspace {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      min-width: 0;
      min-height: 0;
      height: 100vh;
      padding: 18px;
      gap: 14px;
    }

    .statusbar {
      min-height: 44px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px 14px;
      background: var(--panel);
      color: var(--muted);
      font-size: 13px;
    }

    .statusbar div {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .statusbar strong {
      color: var(--text);
    }

    hud-surface.map-panel {
      min-height: 0;
      height: 100%;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      --hud-radius: 8px;
      --hud-surface-header-min-height: 50px;
      --hud-surface-header-padding: 12px 14px;
      --hud-surface-body-padding: 0;
    }

    hud-surface.map-panel::part(surface) {
      display: grid;
      min-height: 0;
      height: 100%;
      grid-template-rows: auto minmax(0, 1fr);
      border: 1px solid var(--line);
      background: var(--panel);
    }

    .panel-head-content {
      display: flex;
      width: 100%;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .panel-head-content h2 {
      margin: 0;
      font-size: 16px;
    }

    .panel-head-content span {
      color: var(--muted);
      font-size: 13px;
    }

    .canvas-frame-host {
      display: block;
      min-height: 0;
      height: 100%;
    }

    .canvas-frame-host::part(body) {
      display: block;
      min-height: 0;
      height: 100%;
      padding: 0;
    }

    .react-flow-host {
      min-height: 0;
      width: 100%;
      height: 100%;
      min-height: 520px;
      background: #111719;
      overflow: hidden;
    }

    .foundation-dynamics-react-shell {
      display: grid;
      grid-template-rows: minmax(320px, 1fr) auto;
      width: 100%;
      height: 100%;
      min-height: 0;
    }

    .foundation-dynamics-flow {
      min-height: 0;
      position: relative;
    }

    .react-flow {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      direction: ltr;
      z-index: 0;
      --xy-edge-stroke-default: rgb(125 200 166);
      --xy-edge-stroke-width-default: 2;
      --xy-edge-stroke-selected-default: rgb(230 191 99);
      --xy-edge-label-background-color-default: var(--panel);
      --xy-edge-label-color-default: var(--text);
    }

    .react-flow__background {
      pointer-events: none;
      z-index: -1;
    }

    .react-flow__container {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
    }

    .react-flow__renderer,
    .react-flow__pane,
    .react-flow__viewport,
    .react-flow__selectionpane,
    .react-flow__edges,
    .react-flow__nodes {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
    }

    .react-flow__viewport {
      transform-origin: 0 0;
      z-index: 2;
      pointer-events: none;
    }

    .react-flow__renderer {
      z-index: 4;
    }

    .react-flow__pane,
    .react-flow__selectionpane {
      z-index: 1;
      touch-action: none;
    }

    .react-flow__edges {
      overflow: visible;
      pointer-events: none;
    }

    .react-flow .react-flow__edges {
      position: absolute;
    }

    .react-flow .react-flow__edges svg {
      position: absolute;
      overflow: visible;
      pointer-events: none;
    }

    .react-flow__edge {
      pointer-events: visibleStroke;
    }

    .react-flow__edge-path {
      stroke: var(--xy-edge-stroke, var(--xy-edge-stroke-default));
      stroke-width: var(
        --xy-edge-stroke-width,
        var(--xy-edge-stroke-width-default)
      );
      fill: none;
    }

    .react-flow__edge.selected .react-flow__edge-path,
    .react-flow__edge:focus .react-flow__edge-path,
    .react-flow__edge:focus-visible .react-flow__edge-path {
      stroke: var(--xy-edge-stroke-selected-default);
      stroke-width: 3;
    }

    .react-flow__arrowhead polyline {
      stroke: var(--xy-edge-stroke, var(--xy-edge-stroke-default));
    }

    .react-flow__arrowhead polyline.arrowclosed {
      fill: var(--xy-edge-stroke, var(--xy-edge-stroke-default));
    }

    .react-flow__edgelabel-renderer {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      pointer-events: none;
      user-select: none;
    }

    .react-flow__panel {
      position: absolute;
      z-index: 5;
      margin: 15px;
    }

    .react-flow__panel.top {
      top: 0;
    }

    .react-flow__panel.left {
      left: 0;
    }

    .react-flow__edge-text {
      fill: var(--xy-edge-label-color-default);
      font-size: 11px;
      font-weight: 700;
    }

    .react-flow__edge-textbg {
      fill: var(--xy-edge-label-background-color-default);
    }

    .react-flow__node {
      position: absolute;
      transform-origin: 0 0;
      pointer-events: all;
      visibility: visible;
      user-select: none;
      box-sizing: border-box;
    }

    .react-flow__handle {
      position: absolute;
      pointer-events: all;
      width: 12px;
      height: 12px;
      border: 2px solid rgb(16 20 22);
      border-radius: 999px;
      background: rgb(157 170 177);
      cursor: crosshair;
      box-shadow:
        0 0 0 2px rgb(157 170 177 / 0.2),
        0 3px 10px rgb(0 0 0 / 0.3);
      z-index: 4;
    }

    .react-flow__handle:hover,
    .react-flow__handle.valid {
      background: rgb(125 200 166);
      box-shadow:
        0 0 0 4px rgb(125 200 166 / 0.3),
        0 3px 10px rgb(0 0 0 / 0.3);
    }

    .react-flow__handle-left {
      left: 0;
      top: 50%;
      transform: translate(-50%, -50%);
    }

    .react-flow__handle-right {
      top: 50%;
      right: 0;
      transform: translate(50%, -50%);
    }

    .foundation-dynamics-handle--output.react-flow__handle-right {
      transform: translate(50%, -50%);
    }

    .react-flow__controls {
      display: flex;
      flex-direction: column;
      position: absolute;
      left: 12px;
      bottom: 12px;
      z-index: 5;
      box-shadow: 0 8px 24px rgb(0 0 0 / 0.28);
    }

    .react-flow__controls-button {
      width: 26px;
      height: 26px;
      border: 1px solid var(--line);
      background: var(--panel-2);
      color: var(--text);
    }

    .foundation-dynamics-sidebar {
      display: grid;
      align-content: start;
      gap: 12px;
      min-height: 0;
      color: var(--text);
    }

    .foundation-dynamics-sidebar-actions {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .foundation-dynamics-sidebar-actions button,
    .foundation-dynamics-sidebar-tabs button,
    .foundation-dynamics-sidebar-card-header button {
      min-height: 28px;
      border: 1px solid rgb(157 170 177 / 0.32);
      border-radius: 6px;
      padding: 5px 9px;
      background: var(--panel-2);
      color: var(--text);
      cursor: pointer;
      font: inherit;
      font-size: 11px;
      font-weight: 800;
    }

    .foundation-dynamics-sidebar-actions button:hover,
    .foundation-dynamics-sidebar-tabs button:hover,
    .foundation-dynamics-sidebar-tabs button.is-active {
      border-color: rgb(125 200 166 / 0.72);
      background: rgb(30 47 42);
    }

    .foundation-dynamics-sidebar-tabs {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 6px;
    }

    .foundation-dynamics-sidebar-list {
      display: grid;
      gap: 10px;
    }

    .foundation-dynamics-sidebar-list > em {
      color: var(--muted);
      font-size: 12px;
      font-style: normal;
    }

    .foundation-dynamics-sidebar-card {
      display: grid;
      gap: 9px;
      border: 1px solid rgb(157 170 177 / 0.16);
      border-radius: 8px;
      padding: 10px;
      background: rgb(16 20 22 / 0.58);
    }

    .foundation-dynamics-sidebar-card-header {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 8px;
    }

    .foundation-dynamics-sidebar-card-header div {
      display: grid;
      gap: 3px;
      min-width: 0;
    }

    .foundation-dynamics-sidebar-card-header strong {
      min-width: 0;
      overflow: hidden;
      font-size: 13px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .foundation-dynamics-sidebar-card-header span {
      color: var(--accent);
      font-size: 12px;
      font-weight: 800;
    }

    .foundation-dynamics-sidebar-card-header button {
      flex: 0 0 auto;
      border-color: rgb(222 120 107 / 0.62);
      background: rgb(84 33 32 / 0.72);
      color: rgb(255 210 205);
    }

    .foundation-dynamics-sidebar-card-header button:hover {
      background: rgb(116 41 38 / 0.86);
    }

    .foundation-dynamics-sidebar-card label {
      display: grid;
      gap: 5px;
      min-width: 0;
      color: var(--muted);
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
    }

    .foundation-dynamics-sidebar-card input,
    .foundation-dynamics-sidebar-card select,
    .foundation-dynamics-sidebar-card textarea {
      width: 100%;
      border: 1px solid rgb(157 170 177 / 0.28);
      border-radius: 6px;
      padding: 7px 8px;
      background: var(--panel-2);
      color: var(--text);
      font: inherit;
      font-size: 12px;
      text-transform: none;
    }

    .foundation-dynamics-sidebar-card textarea {
      min-height: 76px;
      resize: vertical;
      font-family:
        ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        "Liberation Mono", monospace;
      line-height: 1.35;
    }

    .foundation-dynamics-slider-row,
    .foundation-dynamics-action-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .foundation-dynamics-action-row {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
      align-items: end;
    }

    .foundation-dynamics-action-row button {
      min-height: 32px;
      border: 1px solid rgb(125 200 166 / 0.5);
      border-radius: 6px;
      padding: 6px 9px;
      background: rgb(30 47 42);
      color: var(--text);
      cursor: pointer;
      font: inherit;
      font-size: 11px;
      font-weight: 800;
    }

    .foundation-dynamics-action-row button:hover {
      border-color: rgb(125 200 166 / 0.86);
      background: rgb(37 61 53);
    }

    .foundation-dynamics-action-status {
      color: var(--accent);
      font-size: 11px;
      font-weight: 800;
    }

    .foundation-dynamics-inspector-inputs {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 12px;
      color: var(--muted);
      font-size: 11px;
    }

    .foundation-dynamics-inspector-inputs span {
      width: 100%;
      font-weight: 800;
      text-transform: uppercase;
    }

    .foundation-dynamics-inspector-connections {
      display: grid;
      gap: 6px;
      margin-top: 12px;
      color: var(--muted);
      font-size: 11px;
    }

    .foundation-dynamics-inspector-connections span {
      font-weight: 800;
      text-transform: uppercase;
    }

    .foundation-dynamics-inspector-inputs code,
    .foundation-dynamics-inspector-inputs em,
    .foundation-dynamics-inspector-connections code,
    .foundation-dynamics-inspector-connections em {
      border: 1px solid rgb(157 170 177 / 0.2);
      border-radius: 999px;
      padding: 3px 7px;
      background: rgb(16 20 22 / 0.72);
      color: var(--text);
      font-style: normal;
    }

    .foundation-dynamics-simulator {
      border-top: 1px solid var(--line);
      padding: 12px 14px;
      background: rgb(24 29 32 / 0.96);
    }

    .foundation-dynamics-sim-panel {
      display: grid;
      gap: 10px;
      min-width: 0;
      border: 1px solid rgb(157 170 177 / 0.14);
      border-radius: 8px;
      padding: 10px;
      background: rgb(16 20 22 / 0.46);
    }

    .foundation-dynamics-sim-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .foundation-dynamics-sim-header div {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .foundation-dynamics-sim-header strong {
      font-size: 13px;
    }

    .foundation-dynamics-sim-header span {
      color: var(--muted);
      font-size: 12px;
    }

    .foundation-dynamics-sim-controls button {
      min-height: 28px;
      border: 1px solid rgb(157 170 177 / 0.32);
      border-radius: 6px;
      padding: 5px 9px;
      background: var(--panel-2);
      color: var(--text);
      cursor: pointer;
      font: inherit;
      font-size: 11px;
      font-weight: 700;
    }

    .foundation-dynamics-sim-controls button:hover {
      border-color: rgb(125 200 166 / 0.72);
      background: rgb(48 56 61);
    }

    .foundation-dynamics-chart-wrap {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(180px, auto);
      gap: 12px;
      align-items: center;
      min-height: 260px;
    }

    .foundation-dynamics-chart-tabs {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .foundation-dynamics-chart-tabs button {
      min-height: 26px;
      border: 1px solid rgb(157 170 177 / 0.28);
      border-radius: 999px;
      padding: 4px 10px;
      background: rgb(16 20 22 / 0.72);
      color: var(--muted);
      cursor: pointer;
      font: inherit;
      font-size: 11px;
      font-weight: 800;
    }

    .foundation-dynamics-chart-tabs button:hover,
    .foundation-dynamics-chart-tabs button.is-active {
      border-color: rgb(125 200 166 / 0.72);
      background: rgb(30 47 42);
      color: var(--text);
    }

    .foundation-dynamics-chart-tabs span {
      color: var(--muted);
      font-size: 12px;
    }

    .foundation-dynamics-chart {
      width: 100%;
      height: 260px;
      border: 1px solid rgb(157 170 177 / 0.16);
      border-radius: 6px;
      background: rgb(16 20 22);
    }

    .foundation-dynamics-chart-grid {
      stroke: rgb(157 170 177 / 0.14);
      stroke-width: 1;
    }

    .foundation-dynamics-chart-axis {
      stroke: rgb(157 170 177 / 0.28);
      stroke-width: 1;
    }

    .foundation-dynamics-chart-label {
      fill: var(--muted);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    .foundation-dynamics-chart-tick {
      fill: rgb(157 170 177 / 0.78);
      font-size: 10px;
    }

    .foundation-dynamics-chart-legend {
      display: grid;
      gap: 6px;
      color: var(--muted);
      font-size: 12px;
    }

    .foundation-dynamics-chart-legend span {
      display: flex;
      align-items: center;
      gap: 7px;
      white-space: nowrap;
    }

    .foundation-dynamics-chart-legend i {
      width: 9px;
      height: 9px;
      border-radius: 999px;
      display: inline-block;
      flex: 0 0 auto;
    }

    .foundation-dynamics-node {
      display: grid;
      gap: 5px;
      position: relative;
      isolation: isolate;
      min-width: 150px;
      max-width: 230px;
      padding: 12px 14px;
      border: 1px solid rgb(125 200 166 / 0.52);
      border-radius: 6px;
      background: rgb(24 29 32 / 0.96);
      color: var(--text);
      box-shadow: 0 8px 24px rgb(0 0 0 / 0.24);
      overflow: visible;
    }

    .foundation-dynamics-node > :not(.react-flow__handle) {
      position: relative;
      z-index: 2;
    }

    .foundation-dynamics-node > .react-flow__handle {
      position: absolute;
      z-index: 4;
    }

    .foundation-dynamics-node--input {
      border: 0;
      background: transparent;
      padding-right: 34px;
    }

    .foundation-dynamics-node--operator {
      border: 0;
      background: transparent;
      padding-left: 32px;
      padding-right: 36px;
    }

    .foundation-dynamics-node--input::before,
    .foundation-dynamics-node--input::after,
    .foundation-dynamics-node--operator::before,
    .foundation-dynamics-node--operator::after {
      position: absolute;
      pointer-events: none;
      content: "";
    }

    .foundation-dynamics-node--input::after,
    .foundation-dynamics-node--operator::after {
      inset: -1px;
      z-index: 0;
    }

    .foundation-dynamics-node--input::before,
    .foundation-dynamics-node--operator::before {
      inset: 1px;
      z-index: 1;
    }

    .foundation-dynamics-node--input::after {
      background: rgb(92 173 255 / 0.86);
      clip-path: polygon(
        0 0,
        calc(100% - 24px) 0,
        100% 50%,
        calc(100% - 24px) 100%,
        0 100%
      );
    }

    .foundation-dynamics-node--input::before {
      background: linear-gradient(135deg, rgb(22 38 52), rgb(19 30 39));
      clip-path: polygon(
        0 0,
        calc(100% - 24px) 0,
        100% 50%,
        calc(100% - 24px) 100%,
        0 100%
      );
    }

    .foundation-dynamics-node--operator::after {
      background: rgb(230 191 99 / 0.9);
      clip-path: polygon(
        0 0,
        calc(100% - 28px) 0,
        100% 50%,
        calc(100% - 28px) 100%,
        0 100%,
        24px 50%
      );
    }

    .foundation-dynamics-node--operator::before {
      background: linear-gradient(135deg, rgb(54 44 22), rgb(31 29 22));
      clip-path: polygon(
        0 0,
        calc(100% - 28px) 0,
        100% 50%,
        calc(100% - 28px) 100%,
        0 100%,
        24px 50%
      );
    }

    .foundation-dynamics-node--sink {
      min-width: 190px;
      border: 2px solid rgb(222 120 107 / 0.9);
      border-radius: 50% / 18px;
      background:
        linear-gradient(rgb(33 24 24), rgb(33 24 24)) padding-box,
        linear-gradient(135deg, rgb(222 120 107), rgb(125 200 166)) border-box;
      box-shadow:
        inset 0 0 0 2px rgb(222 120 107 / 0.22),
        0 8px 24px rgb(0 0 0 / 0.24);
    }

    .foundation-dynamics-node--sink::before,
    .foundation-dynamics-node--sink::after {
      position: absolute;
      left: 9px;
      right: 9px;
      height: 20px;
      border: 2px solid rgb(222 120 107 / 0.38);
      border-radius: 50%;
      content: "";
      pointer-events: none;
      z-index: 0;
    }

    .foundation-dynamics-node--sink::before {
      top: -2px;
      background: rgb(45 28 28);
    }

    .foundation-dynamics-node--sink::after {
      bottom: -2px;
      border-top: 0;
    }

    .foundation-dynamics-node-kind {
      width: fit-content;
      border: 1px solid rgb(157 170 177 / 0.24);
      border-radius: 999px;
      padding: 2px 6px;
      color: var(--muted);
      background: rgb(16 20 22 / 0.72);
      font-size: 9px;
      font-weight: 800;
      line-height: 1;
      text-transform: uppercase;
    }

    .foundation-dynamics-node strong {
      font-size: 12px;
    }

    .foundation-dynamics-node span {
      color: var(--muted);
      font-size: 11px;
    }

    .foundation-dynamics-node code {
      display: block;
      min-width: 0;
      overflow: hidden;
      color: var(--text);
      font-family:
        ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        "Liberation Mono", monospace;
      font-size: 10px;
      line-height: 1.3;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    @media (max-width: 920px) {
      .app {
        grid-template-columns: 1fr;
      }

      .controls {
        max-height: none;
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }

      .workspace {
        min-height: 70vh;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "foundation-dynamics-page": FoundationDynamicsPage;
  }
}
