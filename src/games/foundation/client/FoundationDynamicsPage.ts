import { css, html, LitElement, type PropertyValues } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import {
  runDynamicsSimulation,
  SIMPLE_FOOD_STOCK_TEMPLATE,
  type DynamicsScenario,
  type DynamicsSystemDefinition,
  type DynamicsTraceFrame,
} from "../../../core/systems/dynamics";
import {
  deleteFoundationDynamicsSystem,
  duplicateFoundationDynamicsSystem,
  EMPTY_FOUNDATION_DYNAMICS_LIBRARY,
  exportFoundationDynamicsLibrary,
  loadFoundationDynamicsLibrary,
  parseFoundationDynamicsLibrary,
  saveFoundationDynamicsLibrary,
  upsertFoundationDynamicsScenario,
  upsertFoundationDynamicsSystem,
  type FoundationDynamicsLibrary,
} from "../dynamics";
import { FoundationDynamicsReactBridge } from "../dynamics/react/FoundationDynamicsReactBridge";

@customElement("foundation-dynamics-page")
export class FoundationDynamicsPage extends LitElement {
  @query("#react-flow-host")
  private reactFlowHost?: HTMLDivElement;

  private reactBridge?: FoundationDynamicsReactBridge;

  @state()
  private library = loadInitialLibrary();

  @state()
  private activeSystemId = this.library.systems[0]?.id ?? "";

  @state()
  private systemNameDraft = this.activeSystem()?.name ?? "";

  @state()
  private importDraft = "";

  @state()
  private exportDraft = exportFoundationDynamicsLibrary(this.library);

  @state()
  private status = "Loaded dynamics workspace.";

  @state()
  private simulationTickCount = 1;

  @state()
  private simulationRunning = false;

  private simulationTimer: number | undefined;

  render() {
    const system = this.activeSystem() ?? SIMPLE_FOOD_STOCK_TEMPLATE.system;
    const scenario = this.activeScenario(system.id);
    const simulationScenario = {
      ...scenario,
      tickCount: Math.max(
        1,
        Math.min(scenario.tickCount, this.simulationTickCount),
      ),
    };
    const preview = runDynamicsSimulation(system, simulationScenario);
    const latestFrame = preview.frames[preview.frames.length - 1];
    return html`
      <main class="page-shell">
        <header>
          <div>
            <p class="eyebrow">Foundation Dynamics</p>
            <h1>${system.name}</h1>
          </div>
          <span class="route-chip">/foundation/dynamics</span>
        </header>
        <section class="workspace">
          <aside class="panel">
            <h2>System</h2>
            <label class="field">
              <span>Load system</span>
              <select data-system-select @change=${this.handleSystemSelect}>
                ${this.library.systems.map(
                  (stored) => html`
                    <option
                      value=${stored.id}
                      ?selected=${stored.id === system.id}
                    >
                      ${stored.name}
                    </option>
                  `,
                )}
              </select>
            </label>
            <label class="field">
              <span>System name</span>
              <input
                data-system-name
                .value=${this.systemNameDraft}
                @input=${this.handleSystemNameInput}
              />
            </label>
            <div class="button-grid">
              <button data-action="save" @click=${this.saveActiveSystem}>
                Save
              </button>
              <button
                data-action="duplicate"
                @click=${this.duplicateActiveSystem}
              >
                Duplicate
              </button>
              <button data-action="delete" @click=${this.deleteActiveSystem}>
                Delete
              </button>
              <button data-action="reset-template" @click=${this.resetTemplate}>
                Template
              </button>
            </div>
            <dl>
              <dt>Nodes</dt>
              <dd>${system.nodes.length}</dd>
              <dt>Edges</dt>
              <dd>${system.edges.length}</dd>
              <dt>Ticks</dt>
              <dd>${scenario.tickCount}</dd>
              <dt>Current</dt>
              <dd>T${latestFrame?.tick ?? 0}</dd>
            </dl>
            <p class="status" role="status">${this.status}</p>
          </aside>
          <section
            class="canvas-placeholder"
            aria-label="Dynamics graph canvas"
          >
            <div class="formula-strip" data-template-formula>
              ${FOOD_STOCK_TEMPLATE_FORMULA}
            </div>
            <div id="react-flow-host" class="react-flow-host"></div>
            <div class="node-list">
              ${system.nodes.map(
                (node) => html`
                  <article class="node-card" data-node-type=${node.type}>
                    <strong>${node.name}</strong>
                    <span>${node.type}</span>
                  </article>
                `,
              )}
            </div>
          </section>
          <aside class="panel">
            <h2>Preview</h2>
            <div class="button-grid">
              <button data-action="step" @click=${this.stepSimulation}>
                Step
              </button>
              <button data-action="run" @click=${this.runSimulation}>
                Run
              </button>
              <button data-action="pause" @click=${this.pauseSimulation}>
                Pause
              </button>
              <button data-action="reset" @click=${this.resetSimulation}>
                Reset
              </button>
            </div>
            <dl>
              <dt>Food stock</dt>
              <dd>${latestFrame?.stocks.foodStock ?? 0}</dd>
              <dt>Delta</dt>
              <dd>${latestFrame?.stockDeltas.foodStock ?? 0}</dd>
              <dt>Overflow</dt>
              <dd>${latestFrame?.stockOverflows.foodStock ?? 0}</dd>
            </dl>
            <table class="trace-table">
              <thead>
                <tr>
                  <th>Tick</th>
                  <th>Stock</th>
                  <th>Delta</th>
                  <th>Overflow</th>
                </tr>
              </thead>
              <tbody>
                ${preview.frames
                  .slice(-6)
                  .map((frame) => this.renderTraceRow(frame))}
              </tbody>
            </table>
            <label class="field">
              <span>Export JSON</span>
              <textarea
                data-export
                .value=${this.exportDraft}
                readonly
              ></textarea>
            </label>
            <label class="field">
              <span>Import JSON</span>
              <textarea
                data-import
                .value=${this.importDraft}
                @input=${this.handleImportInput}
              ></textarea>
            </label>
            <button data-action="import" @click=${this.importLibrary}>
              Import
            </button>
          </aside>
        </section>
      </main>
    `;
  }

  firstUpdated(): void {
    this.mountReactBridge();
  }

  protected updated(changedProperties: PropertyValues): void {
    if (
      changedProperties.has("library") ||
      changedProperties.has("activeSystemId")
    ) {
      this.updateReactBridge();
    }
  }

  disconnectedCallback(): void {
    this.pauseSimulation();
    this.reactBridge?.unmount();
    this.reactBridge = undefined;
    super.disconnectedCallback();
  }

  private activeSystem(): DynamicsSystemDefinition | undefined {
    return this.library.systems.find(
      (system) => system.id === this.activeSystemId,
    );
  }

  private activeScenario(systemId: string): DynamicsScenario {
    return (
      this.library.scenarios.find(
        (scenario) => scenario.systemId === systemId,
      ) ?? {
        ...SIMPLE_FOOD_STOCK_TEMPLATE.scenario,
        systemId,
      }
    );
  }

  private handleSystemSelect(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;
    this.activeSystemId = select.value;
    this.systemNameDraft = this.activeSystem()?.name ?? "";
    this.resetSimulation();
    this.status = "Loaded saved system.";
  }

  private handleSystemNameInput(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    this.systemNameDraft = input.value;
  }

  private handleImportInput(event: Event) {
    const input = event.currentTarget as HTMLTextAreaElement;
    this.importDraft = input.value;
  }

  private saveActiveSystem() {
    const system = this.activeSystem();
    if (system === undefined) {
      return;
    }
    const nextSystem = {
      ...system,
      name: this.systemNameDraft.trim() || system.name,
    };
    this.library = upsertFoundationDynamicsSystem(this.library, nextSystem);
    this.persist("Saved system.");
  }

  private duplicateActiveSystem() {
    const system = this.activeSystem();
    if (system === undefined) {
      return;
    }
    this.library = duplicateFoundationDynamicsSystem(this.library, system.id);
    const duplicate = this.library.systems[this.library.systems.length - 1];
    this.activeSystemId = duplicate.id;
    this.systemNameDraft = duplicate.name;
    this.resetSimulation();
    this.persist("Duplicated system.");
  }

  private deleteActiveSystem() {
    const system = this.activeSystem();
    if (system === undefined) {
      return;
    }
    this.library = deleteFoundationDynamicsSystem(this.library, system.id);
    if (this.library.systems.length === 0) {
      this.library = defaultLibrary();
    }
    this.activeSystemId = this.library.systems[0]?.id ?? "";
    this.systemNameDraft = this.activeSystem()?.name ?? "";
    this.resetSimulation();
    this.persist("Deleted system.");
  }

  private resetTemplate() {
    this.library = defaultLibrary();
    this.activeSystemId = SIMPLE_FOOD_STOCK_TEMPLATE.system.id;
    this.systemNameDraft = SIMPLE_FOOD_STOCK_TEMPLATE.system.name;
    this.resetSimulation();
    this.persist("Reset to template.");
  }

  private importLibrary() {
    try {
      this.library = parseFoundationDynamicsLibrary(this.importDraft);
      this.activeSystemId = this.library.systems[0]?.id ?? "";
      this.systemNameDraft = this.activeSystem()?.name ?? "";
      this.resetSimulation();
      this.persist("Imported library.");
    } catch (error) {
      this.status = error instanceof Error ? error.message : "Import failed.";
    }
  }

  private persist(status: string) {
    saveFoundationDynamicsLibrary(this.library);
    this.exportDraft = exportFoundationDynamicsLibrary(this.library);
    this.status = status;
  }

  private stepSimulation() {
    const system = this.activeSystem();
    if (system === undefined) {
      return;
    }
    const scenario = this.activeScenario(system.id);
    this.simulationTickCount = Math.min(
      scenario.tickCount,
      this.simulationTickCount + 1,
    );
    this.status = `Stepped to T${this.simulationTickCount}.`;
  }

  private runSimulation() {
    if (this.simulationRunning) {
      return;
    }
    this.simulationRunning = true;
    this.status = "Running simulation.";
    this.simulationTimer = window.setInterval(() => {
      const system = this.activeSystem();
      if (system === undefined) {
        this.pauseSimulation();
        return;
      }
      const scenario = this.activeScenario(system.id);
      if (this.simulationTickCount >= scenario.tickCount) {
        this.pauseSimulation();
        return;
      }
      this.simulationTickCount += 1;
    }, 250);
  }

  private pauseSimulation() {
    if (this.simulationTimer !== undefined) {
      window.clearInterval(this.simulationTimer);
      this.simulationTimer = undefined;
    }
    if (this.simulationRunning) {
      this.status = "Paused simulation.";
    }
    this.simulationRunning = false;
  }

  private resetSimulation() {
    this.pauseSimulation();
    this.simulationTickCount = 1;
    this.status = "Reset simulation.";
  }

  private renderTraceRow(frame: DynamicsTraceFrame) {
    return html`
      <tr>
        <td>T${frame.tick}</td>
        <td>${frame.stocks.foodStock ?? 0}</td>
        <td>${frame.stockDeltas.foodStock ?? 0}</td>
        <td>${frame.stockOverflows.foodStock ?? 0}</td>
      </tr>
    `;
  }

  private mountReactBridge() {
    if (this.reactFlowHost === undefined || this.reactBridge !== undefined) {
      return;
    }
    const system = this.activeSystem() ?? SIMPLE_FOOD_STOCK_TEMPLATE.system;
    this.reactBridge = new FoundationDynamicsReactBridge(this.reactFlowHost, {
      system,
      onSystemChange: (nextSystem) => {
        this.library = upsertFoundationDynamicsSystem(this.library, nextSystem);
        this.persist("Updated graph.");
      },
    });
  }

  private updateReactBridge() {
    const system = this.activeSystem() ?? SIMPLE_FOOD_STOCK_TEMPLATE.system;
    this.reactBridge?.update({
      system,
      onSystemChange: (nextSystem) => {
        this.library = upsertFoundationDynamicsSystem(this.library, nextSystem);
        this.persist("Updated graph.");
      },
    });
  }

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      color: #17211f;
      background: #f4f1ea;
      font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
    }

    .page-shell {
      display: grid;
      grid-template-rows: auto 1fr;
      min-height: 100vh;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      padding: 20px 24px;
      border-bottom: 1px solid rgb(20 35 31 / 0.14);
      background: #fffaf0;
    }

    h1,
    h2,
    p {
      margin: 0;
    }

    h1 {
      font-size: 22px;
      font-weight: 700;
    }

    h2 {
      font-size: 14px;
      font-weight: 700;
    }

    .eyebrow {
      margin-bottom: 4px;
      color: #61706a;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0;
    }

    .route-chip {
      padding: 6px 8px;
      border: 1px solid rgb(20 35 31 / 0.18);
      border-radius: 6px;
      color: #40504b;
      background: white;
      font-size: 12px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }

    .workspace {
      display: grid;
      grid-template-columns: 260px minmax(360px, 1fr) 260px;
      min-height: 0;
    }

    .panel {
      padding: 16px;
      border-right: 1px solid rgb(20 35 31 / 0.14);
      background: #fbf8f0;
    }

    .panel:last-child {
      border-right: 0;
      border-left: 1px solid rgb(20 35 31 / 0.14);
    }

    dl {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px 12px;
      margin: 16px 0 0;
      font-size: 13px;
    }

    dt {
      color: #61706a;
    }

    dd {
      margin: 0;
      font-weight: 700;
    }

    .field {
      display: grid;
      gap: 6px;
      margin-top: 14px;
      color: #61706a;
      font-size: 12px;
      font-weight: 700;
    }

    input,
    select,
    textarea {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid rgb(20 35 31 / 0.18);
      border-radius: 6px;
      padding: 8px;
      color: #17211f;
      background: white;
      font: inherit;
      font-weight: 500;
    }

    textarea {
      min-height: 120px;
      resize: vertical;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 11px;
    }

    button {
      border: 1px solid rgb(20 35 31 / 0.18);
      border-radius: 6px;
      padding: 8px 10px;
      color: #17211f;
      background: white;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }

    .button-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      margin-top: 12px;
    }

    .status {
      margin-top: 14px;
      color: #40504b;
      font-size: 12px;
    }

    .trace-table {
      width: 100%;
      margin-top: 14px;
      border-collapse: collapse;
      font-size: 12px;
    }

    .trace-table th,
    .trace-table td {
      padding: 6px 4px;
      border-bottom: 1px solid rgb(20 35 31 / 0.12);
      text-align: right;
    }

    .trace-table th:first-child,
    .trace-table td:first-child {
      text-align: left;
    }

    .canvas-placeholder {
      min-height: 0;
      padding: 24px;
      background: #f4f1ea;
      overflow: auto;
    }

    .formula-strip {
      margin-bottom: 12px;
      padding: 10px 12px;
      border: 1px solid rgb(20 35 31 / 0.14);
      border-radius: 6px;
      color: #40504b;
      background: #fffdf7;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      line-height: 1.4;
    }

    .react-flow-host {
      height: 420px;
      min-height: 320px;
      margin-bottom: 16px;
      border: 1px solid rgb(20 35 31 / 0.16);
      border-radius: 6px;
      background: #fffdf7;
      overflow: hidden;
    }

    .foundation-dynamics-react-editor {
      display: grid;
      grid-template-rows: auto 1fr;
      height: 100%;
    }

    .foundation-dynamics-editor-body {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 180px;
      min-height: 0;
    }

    .foundation-dynamics-palette {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 8px;
      border-bottom: 1px solid rgb(20 35 31 / 0.12);
      background: #fbf8f0;
    }

    .foundation-dynamics-palette button {
      padding: 6px 8px;
      font-size: 12px;
    }

    .foundation-dynamics-node {
      display: grid;
      gap: 4px;
      min-width: 120px;
      padding: 8px;
      border: 1px solid rgb(20 35 31 / 0.2);
      border-radius: 6px;
      background: white;
      color: #17211f;
      box-shadow: 0 1px 2px rgb(20 35 31 / 0.08);
    }

    .foundation-dynamics-node span {
      color: #61706a;
      font-size: 11px;
    }

    .foundation-dynamics-inspector {
      display: grid;
      align-content: start;
      gap: 10px;
      padding: 10px;
      border-left: 1px solid rgb(20 35 31 / 0.12);
      background: #fbf8f0;
      font-size: 12px;
    }

    .foundation-dynamics-inspector label {
      display: grid;
      gap: 4px;
      color: #61706a;
      font-weight: 700;
    }

    .foundation-dynamics-inspector .inline-field {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .foundation-dynamics-inspector input,
    .foundation-dynamics-inspector select {
      padding: 6px;
      font-size: 12px;
    }

    .node-id {
      color: #61706a;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 11px;
    }

    .node-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      align-content: start;
    }

    .node-card {
      display: grid;
      gap: 8px;
      min-height: 72px;
      padding: 12px;
      border: 1px solid rgb(20 35 31 / 0.16);
      border-radius: 6px;
      background: #fffdf7;
      box-shadow: 0 1px 2px rgb(20 35 31 / 0.08);
    }

    .node-card span {
      color: #61706a;
      font-size: 12px;
    }

    @media (max-width: 920px) {
      .workspace {
        grid-template-columns: 1fr;
      }

      .panel,
      .panel:last-child {
        border-right: 0;
        border-left: 0;
        border-bottom: 1px solid rgb(20 35 31 / 0.14);
      }
    }
  `;
}

function loadInitialLibrary(): FoundationDynamicsLibrary {
  const loaded = loadFoundationDynamicsLibrary();
  return loaded.systems.length > 0 ? loaded : defaultLibrary();
}

function defaultLibrary(): FoundationDynamicsLibrary {
  return upsertFoundationDynamicsScenario(
    upsertFoundationDynamicsSystem(
      EMPTY_FOUNDATION_DYNAMICS_LIBRARY,
      SIMPLE_FOOD_STOCK_TEMPLATE.system,
    ),
    SIMPLE_FOOD_STOCK_TEMPLATE.scenario,
  );
}

const FOOD_STOCK_TEMPLATE_FORMULA =
  "foodStock = clamp(foodStock + foodProduction - foodDemand, 0, foodStockCapacity)";

declare global {
  interface HTMLElementTagNameMap {
    "foundation-dynamics-page": FoundationDynamicsPage;
  }
}
