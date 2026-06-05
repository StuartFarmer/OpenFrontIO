import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  MarkerType,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { css, html, LitElement, svg, type TemplateResult } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { ChevronDown, ChevronRight, Plus, Save, Trash2 } from "lucide";
import "../../../client/hud/ui";
import type { HudSelectOption } from "../../../client/hud/ui/HudComponents";
import { renderLucideIcon } from "../../../client/hud/ui/LucideIcon";
import {
  applyInputActions,
  chartableNodes,
  cloneEdges,
  cloneNodes,
  connectionSummaries,
  createPrimitiveNode,
  currentNodeValue,
  formatNumber,
  FOUNDATION_DYNAMICS_BUILTIN_SYSTEMS,
  frameValue,
  hasEquivalentConnection,
  initialSimulationState,
  loadSavedDynamicsSystems,
  normalizeReadInputs,
  parseNumberInput,
  savedDynamicsSystem,
  saveDynamicsSystemLibrary,
  setCurrentSinkState,
  sinkNodes,
  stepSimulationState,
  tabLabel,
  type DynamicsInputKind,
  type DynamicsPrimitive,
  type FoundationDynamicsNode,
  type FoundationDynamicsNodeData,
  type InputRampAction,
  type SavedDynamicsSystem,
  type SimulationFrame,
  type SimulationState,
} from "../dynamics/FoundationDynamicsModel";
import {
  FoundationDynamicsReactBridge,
  type FoundationDynamicsReactBridgeProps,
} from "../dynamics/react/FoundationDynamicsReactBridge";

const DYNAMICS_CONTROL_TABS: readonly {
  readonly id: DynamicsPrimitive;
  readonly label: string;
}[] = [
  { id: "input", label: "Inputs" },
  { id: "operator", label: "Operators" },
  { id: "sink", label: "Sinks" },
];

const BUILTIN_SYSTEM_REF_PREFIX = "builtin:";
const SAVED_SYSTEM_REF_PREFIX = "saved:";

function builtinSystemRef(id: string): string {
  return `${BUILTIN_SYSTEM_REF_PREFIX}${id}`;
}

function savedSystemRef(id: string): string {
  return `${SAVED_SYSTEM_REF_PREFIX}${id}`;
}

@customElement("foundation-dynamics-page")
export class FoundationDynamicsPage extends LitElement {
  @query("#react-flow-host")
  private reactFlowHost?: HTMLDivElement;

  private reactBridge?: FoundationDynamicsReactBridge;
  private simulationTimer: number | undefined;

  @state()
  private nodes: FoundationDynamicsNode[] = [];

  @state()
  private edges: Edge[] = [];

  @state()
  private systemName = "Untitled system";

  @state()
  private savedSystems: readonly SavedDynamicsSystem[] =
    loadSavedDynamicsSystems();

  @state()
  private selectedSystemRef = "";

  @state()
  private activeControlTab: DynamicsPrimitive = "input";

  @state()
  private activeChartNodeId: string | null = null;

  @state()
  private inputActions: readonly InputRampAction[] = [];

  @state()
  private collapsedNodeIds: readonly string[] = [];

  @state()
  private simulation: SimulationState = initialSimulationState(
    this.nodes,
    this.edges,
  );

  render() {
    return html`
      <main class="app">
        <aside class="controls" aria-label="Foundation dynamics controls">
          <div class="brand">
            <h1>Foundation</h1>
            <p>Dynamics builder</p>
          </div>

          <div class="tab-tools">
            <hud-tabs
              class="control-tabs-kit"
              .items=${DYNAMICS_CONTROL_TABS}
              .selected=${this.activeControlTab}
              @selection-change=${this.handleControlTabChange}
              aria-label="Dynamics node groups"
            ></hud-tabs>
          </div>

          <div class="panel-scroll">
            ${this.renderPresetControls()}
            <div
              class="control-panel"
              ?hidden=${this.activeControlTab !== "input"}
            >
              ${this.renderNodeControls("input")}
            </div>
            <div
              class="control-panel"
              ?hidden=${this.activeControlTab !== "operator"}
            >
              ${this.renderNodeControls("operator")}
            </div>
            <div
              class="control-panel"
              ?hidden=${this.activeControlTab !== "sink"}
            >
              ${this.renderNodeControls("sink")}
            </div>
          </div>
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
              <div class="dynamics-workspace">
                <div
                  id="react-flow-host"
                  class="react-flow-host"
                  aria-label="Dynamics graph canvas"
                ></div>
                ${this.renderSimulator()}
              </div>
            </hud-surface-body>
          </hud-surface>
        </section>
      </main>
    `;
  }

  firstUpdated(): void {
    this.mountReactBridge();
  }

  protected updated(): void {
    this.updateReactBridge();
  }

  disconnectedCallback(): void {
    this.pauseSimulation();
    this.reactBridge?.unmount();
    this.reactBridge = undefined;
    super.disconnectedCallback();
  }

  private mountReactBridge(): void {
    if (this.reactFlowHost === undefined || this.reactBridge !== undefined) {
      return;
    }
    this.reactBridge = new FoundationDynamicsReactBridge(
      this.reactFlowHost,
      this.reactBridgeProps(),
    );
  }

  private updateReactBridge(): void {
    this.reactBridge?.update(this.reactBridgeProps());
  }

  private reactBridgeProps(): FoundationDynamicsReactBridgeProps {
    return {
      nodes: this.nodes,
      edges: this.edges,
      onNodesChange: this.handleNodesChange,
      onEdgesChange: this.handleEdgesChange,
      onConnect: this.handleConnect,
      onNodeClick: (node) => {
        this.activeControlTab = node.data.primitive;
      },
      onEdgeClick: this.handleEdgeClick,
      onPaneClick: this.clearEdgeSelection,
    };
  }

  private renderPresetControls(): TemplateResult {
    const selectedSaved = this.selectedSavedSystem();
    return html`
      <hud-surface class="preset-section">
        <hud-surface-header>
          <span class="section-title">System Presets</span>
        </hud-surface-header>
        <hud-surface-body>
          <div class="preset-tools">
            <hud-select
              .options=${this.savedSystemOptions()}
              .value=${this.selectedSystemRef}
              @value-change=${this.handleSystemSelection}
            ></hud-select>
            <hud-icon-button
              label="Create new system"
              title="Create new system"
              @click=${this.createNewSystem}
            >
              ${renderLucideIcon(Plus, "control-icon")}
            </hud-icon-button>
            <hud-icon-button
              label="Save current system preset"
              title="Save current system preset"
              @click=${this.saveCurrentSystem}
            >
              ${renderLucideIcon(Save, "control-icon")}
            </hud-icon-button>
            <hud-icon-button
              label="Delete system preset"
              title="Delete system preset"
              variant="danger"
              ?disabled=${!selectedSaved}
              @click=${this.deleteSelectedSystem}
            >
              ${renderLucideIcon(Trash2, "control-icon")}
            </hud-icon-button>
          </div>
          <label class="system-name-field">
            <span>Current name</span>
            <input
              .value=${this.systemName}
              @input=${(event: Event) => {
                this.systemName = (
                  event.currentTarget as HTMLInputElement
                ).value;
              }}
            />
          </label>
        </hud-surface-body>
      </hud-surface>
    `;
  }

  private renderNodeControls(primitive: DynamicsPrimitive): TemplateResult {
    const nodes = this.nodes.filter(
      (node) => node.data.primitive === primitive,
    );
    return html`
      <hud-button
        class="primary-action add-node-action"
        variant="primary"
        @click=${() => this.addPrimitive(primitive)}
      >
        Add
        ${primitive === "input"
          ? "Input"
          : primitive === "operator"
            ? "Operator"
            : "Sink"}
      </hud-button>
      ${nodes.length === 0
        ? this.controlSection(
            tabLabel(primitive),
            html`<p class="empty-control">No ${tabLabel(primitive)}.</p>`,
          )
        : nodes.map((node) => this.renderNodeCard(node))}
    `;
  }

  private renderNodeCard(node: FoundationDynamicsNode): TemplateResult {
    const value = currentNodeValue(node, this.simulation);
    const collapsed = this.collapsedNodeIds.includes(node.id);
    return html`
      <hud-surface class="control-section">
        <hud-surface-header>
          <div class="node-section-title">
            <button
              class="node-collapse-button"
              type="button"
              aria-expanded=${String(!collapsed)}
              @click=${() => this.toggleNodeCollapsed(node.id)}
            >
              ${renderLucideIcon(
                collapsed ? ChevronRight : ChevronDown,
                "control-icon",
              )}
              <span class="section-title">${node.data.name}</span>
            </button>
            <span>${formatNumber(value)}</span>
          </div>
        </hud-surface-header>
        <hud-surface-body ?hidden=${collapsed}>
          <div class="control-table" role="table" aria-label=${node.data.name}>
            <div class="control-table-head" role="row">
              <span role="columnheader">Setting</span>
              <span role="columnheader">Value</span>
            </div>
            ${this.nodeTextInput(node, "Name", "name")}
            ${node.data.primitive === "input"
              ? this.renderInputRows(node)
              : this.renderFunctionRows(node)}
            ${this.connectionRows(node)}
            <div class="control-row" role="row">
              <span class="control-name" role="cell">Delete</span>
              <span class="control-widget" role="cell">
                <hud-button
                  class="danger-action"
                  variant="danger"
                  @click=${() => this.deleteNode(node.id)}
                >
                  Delete node
                </hud-button>
              </span>
            </div>
          </div>
        </hud-surface-body>
      </hud-surface>
    `;
  }

  private renderInputRows(node: FoundationDynamicsNode): TemplateResult {
    const sinks = sinkNodes(this.nodes);
    const firstSinkId = sinks[0]?.id;
    const sliderMin = node.data.sliderMin ?? 0;
    const sliderMax = Math.max(sliderMin, node.data.sliderMax ?? 100);
    const value = Math.max(
      sliderMin,
      Math.min(sliderMax, node.data.value ?? 0),
    );
    const actionAmount = node.data.actionAmount ?? 1;
    const actionTicks = Math.max(1, Math.round(node.data.actionTicks ?? 10));
    const action = this.inputActions.find(
      (candidate) => candidate.nodeId === node.id,
    );
    return html`
      ${this.selectRow(
        node,
        "Source",
        "inputKind",
        [
          { label: "user", value: "user" },
          { label: "constant", value: "constant" },
          { label: "read sink", value: "read", disabled: sinks.length === 0 },
        ],
        (value) => {
          const inputKind = value as DynamicsInputKind;
          this.updateNodeData(node.id, {
            inputKind,
            readSinkId:
              inputKind === "read"
                ? (node.data.readSinkId ?? firstSinkId)
                : undefined,
          });
        },
      )}
      ${node.data.inputKind === "read"
        ? this.selectRow(
            node,
            "Sink",
            "readSinkId",
            sinks.map((sink) => ({
              label: sink.data.name,
              value: sink.id,
            })),
            (value) => this.updateNodeData(node.id, { readSinkId: value }),
          )
        : html`
            ${this.numberRow(node, "Value", "value", node.data.value ?? 0)}
            <div class="control-row" role="row">
              <span class="control-name" role="cell">Slider</span>
              <span class="control-widget" role="cell">
                <span class="slider-editor">
                  <input
                    class="native-range"
                    type="range"
                    min=${sliderMin}
                    max=${sliderMax}
                    step="any"
                    .value=${String(value)}
                    @input=${(event: Event) =>
                      this.updateNodeData(node.id, {
                        value: parseNumberInput(
                          (event.currentTarget as HTMLInputElement).value,
                        ),
                      })}
                  />
                  <span class="slider-limit-editor">
                    ${this.inlineNumberField(
                      "Min",
                      this.inlineNumberInput(
                        node,
                        "sliderMin",
                        sliderMin,
                        "Slider minimum",
                      ),
                    )}
                    ${this.inlineNumberField(
                      "Max",
                      this.inlineNumberInput(
                        node,
                        "sliderMax",
                        sliderMax,
                        "Slider maximum",
                      ),
                    )}
                  </span>
                </span>
              </span>
            </div>
            <div class="control-row" role="row">
              <span class="control-name" role="cell">Action</span>
              <span class="control-widget action-widget" role="cell">
                <span class="action-editor">
                  ${this.inlineNumberField(
                    "Change",
                    this.inlineNumberInput(
                      node,
                      "actionAmount",
                      actionAmount,
                      "Action change",
                    ),
                  )}
                  ${this.inlineNumberField(
                    "Ticks",
                    this.inlineNumberInput(
                      node,
                      "actionTicks",
                      actionTicks,
                      "Action ticks",
                    ),
                  )}
                </span>
                <hud-button
                  @click=${() =>
                    this.startInputAction(node.id, actionAmount, actionTicks)}
                >
                  Apply Action
                </hud-button>
                ${action === undefined
                  ? null
                  : html`<span class="action-status"
                      >${action.remainingTicks} ticks</span
                    >`}
              </span>
            </div>
          `}
    `;
  }

  private renderFunctionRows(node: FoundationDynamicsNode): TemplateResult {
    const inputs = connectionSummaries(
      node.id,
      "incoming",
      this.nodes,
      this.edges,
    );
    return html`
      ${node.data.primitive === "sink"
        ? html`
            ${this.numberRow(
              node,
              "Current",
              "state",
              currentNodeValue(node, this.simulation),
              (value) => {
                this.simulation = setCurrentSinkState(
                  this.simulation,
                  node.id,
                  value,
                );
              },
            )}
            ${this.numberRow(node, "Initial", "state", node.data.state ?? 0)}
          `
        : html`
            <div class="control-row" role="row">
              <span class="control-name" role="cell">Current</span>
              <span class="control-widget" role="cell">
                <span class="value-pill"
                  >${formatNumber(
                    currentNodeValue(node, this.simulation),
                  )}</span
                >
              </span>
            </div>
          `}
      <div class="control-row" role="row">
        <span class="control-name" role="cell">Function</span>
        <span class="control-widget" role="cell">
          <textarea
            .value=${node.data.expression ?? ""}
            @input=${(event: Event) =>
              this.updateNodeData(node.id, {
                expression: (event.currentTarget as HTMLTextAreaElement).value,
              })}
          ></textarea>
        </span>
      </div>
      <div class="control-row" role="row">
        <span class="control-name" role="cell">Provided</span>
        <span class="control-widget chip-list" role="cell">
          ${inputs.length === 0
            ? html`<em>none</em>`
            : inputs.map((input) => html`<code>${input}</code>`)}
        </span>
      </div>
    `;
  }

  private connectionRows(node: FoundationDynamicsNode): TemplateResult {
    const incoming = connectionSummaries(
      node.id,
      "incoming",
      this.nodes,
      this.edges,
    );
    const outgoing = connectionSummaries(
      node.id,
      "outgoing",
      this.nodes,
      this.edges,
    );
    return html`
      <div class="control-row" role="row">
        <span class="control-name" role="cell">Inputs</span>
        <span class="control-widget chip-list" role="cell">
          ${incoming.length === 0
            ? html`<em>none</em>`
            : incoming.map((name) => html`<code>${name}</code>`)}
        </span>
      </div>
      <div class="control-row" role="row">
        <span class="control-name" role="cell">Outputs</span>
        <span class="control-widget chip-list" role="cell">
          ${outgoing.length === 0
            ? html`<em>none</em>`
            : outgoing.map((name) => html`<code>${name}</code>`)}
        </span>
      </div>
    `;
  }

  private nodeTextInput(
    node: FoundationDynamicsNode,
    label: string,
    key: "name",
  ): TemplateResult {
    return html`
      <div class="control-row" role="row">
        <span class="control-name" role="cell">${label}</span>
        <span class="control-widget" role="cell">
          <input
            .value=${String(node.data[key] ?? "")}
            @input=${(event: Event) =>
              this.updateNodeData(node.id, {
                [key]: (event.currentTarget as HTMLInputElement).value,
              })}
          />
        </span>
      </div>
    `;
  }

  private numberRow(
    node: FoundationDynamicsNode,
    label: string,
    key: keyof FoundationDynamicsNodeData,
    value: number,
    onChange?: (value: number) => void,
  ): TemplateResult {
    return html`
      <div class="control-row" role="row">
        <span class="control-name" role="cell">${label}</span>
        <span class="control-widget" role="cell">
          <input
            type="number"
            .value=${String(value)}
            @input=${(event: Event) => {
              const next = parseNumberInput(
                (event.currentTarget as HTMLInputElement).value,
              );
              if (onChange !== undefined) {
                onChange(next);
              } else {
                this.updateNodeData(node.id, { [key]: next });
              }
            }}
          />
        </span>
      </div>
    `;
  }

  private inlineNumberField(
    label: string,
    control: TemplateResult,
  ): TemplateResult {
    return html`
      <label class="inline-number-field">
        <span>${label}</span>
        ${control}
      </label>
    `;
  }

  private inlineNumberInput(
    node: FoundationDynamicsNode,
    key: keyof FoundationDynamicsNodeData,
    value: number,
    label: string,
  ): TemplateResult {
    return html`
      <input
        class="inline-number-input"
        type="number"
        aria-label=${label}
        .value=${String(value)}
        @input=${(event: Event) =>
          this.updateNodeData(node.id, {
            [key]: parseNumberInput(
              (event.currentTarget as HTMLInputElement).value,
            ),
          })}
      />
    `;
  }

  private selectRow(
    node: FoundationDynamicsNode,
    label: string,
    key: keyof FoundationDynamicsNodeData,
    options: HudSelectOption[],
    onChange: (value: string) => void,
  ): TemplateResult {
    return html`
      <div class="control-row" role="row">
        <span class="control-name" role="cell">${label}</span>
        <span class="control-widget" role="cell">
          <hud-select
            .options=${options}
            .value=${String(node.data[key] ?? "")}
            @value-change=${(event: CustomEvent<{ value: string }>) =>
              onChange(event.detail.value)}
          ></hud-select>
        </span>
      </div>
    `;
  }

  private renderSimulator(): TemplateResult {
    const chartNodes = chartableNodes(this.nodes);
    const activeNode =
      chartNodes.find((node) => node.id === this.activeChartNodeId) ??
      chartNodes[0] ??
      null;
    return html`
      <section class="foundation-dynamics-simulator">
        <div class="foundation-dynamics-sim-panel">
          <div class="foundation-dynamics-sim-header">
            <div>
              <strong>Simulation</strong>
              <span>T${this.simulation.tick}</span>
            </div>
            <div class="foundation-dynamics-sim-controls">
              <button type="button" @click=${this.playSimulation}>Play</button>
              <button type="button" @click=${this.pauseSimulation}>
                Pause
              </button>
              <button type="button" @click=${this.resumeSimulation}>
                Resume
              </button>
              <button type="button" @click=${this.stepSimulation}>Step</button>
              <button type="button" @click=${this.resetSimulation}>
                Reset
              </button>
            </div>
          </div>
          <div class="foundation-dynamics-chart-tabs">
            ${chartNodes.length === 0
              ? html`<span>No sinks or operators</span>`
              : chartNodes.map(
                  (node) => html`
                    <button
                      type="button"
                      class=${node.id === activeNode?.id ? "is-active" : ""}
                      @click=${() => {
                        this.activeChartNodeId = node.id;
                      }}
                    >
                      ${node.data.name}
                    </button>
                  `,
                )}
          </div>
          ${this.renderChart(activeNode, this.simulation.frames)}
        </div>
      </section>
    `;
  }

  private renderChart(
    node: FoundationDynamicsNode | null,
    frames: readonly SimulationFrame[],
  ): TemplateResult {
    const width = 720;
    const height = 260;
    const chartLeft = 56;
    const chartRight = 16;
    const chartTop = 14;
    const chartBottom = 36;
    const chartWidth = width - chartLeft - chartRight;
    const chartHeight = height - chartTop - chartBottom;
    const values =
      node === null ? [] : frames.map((frame) => frameValue(frame, node));
    const seriesMin = values.length === 0 ? 0 : Math.min(...values);
    const seriesMax = values.length === 0 ? 1 : Math.max(...values);
    const minValue = Math.min(0, seriesMin);
    const maxValue = seriesMax === minValue ? minValue + 1 : seriesMax;
    const range = Math.max(1, maxValue - minValue);
    const firstTick = frames[0]?.tick ?? 0;
    const lastTick = frames[frames.length - 1]?.tick ?? firstTick + 1;
    const tickRange = Math.max(1, lastTick - firstTick);
    const linePoints =
      node === null
        ? []
        : frames.map((frame) => {
            const x =
              chartLeft + ((frame.tick - firstTick) / tickRange) * chartWidth;
            const y =
              chartTop +
              chartHeight -
              ((frameValue(frame, node) - minValue) / range) * chartHeight;
            return { x, y };
          });
    const pathData = linePoints
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");
    const grid = [0, 0.25, 0.5, 0.75, 1];
    const lineColor =
      node?.data.primitive === "sink"
        ? "rgb(125, 200, 166)"
        : "rgb(230, 191, 99)";
    const chartSvg = svg`
      <svg
        class="foundation-dynamics-chart"
        viewBox="0 0 ${width} ${height}"
        role="img"
        aria-label=${
          node === null ? "No chart selected" : `${node.data.name} over time`
        }
      >
        ${grid.map((ratio) => {
          const y = chartTop + ratio * chartHeight;
          return svg`<line
            class="foundation-dynamics-chart-grid"
            x1=${chartLeft}
            y1=${y}
            x2=${width - chartRight}
            y2=${y}
          />`;
        })}
        ${grid.map((ratio) => {
          const x = chartLeft + ratio * chartWidth;
          return svg`<line
            class="foundation-dynamics-chart-grid"
            x1=${x}
            y1=${chartTop}
            x2=${x}
            y2=${height - chartBottom}
          />`;
        })}
        <line
          class="foundation-dynamics-chart-axis"
          x1=${chartLeft}
          y1=${height - chartBottom}
          x2=${width - chartRight}
          y2=${height - chartBottom}
        />
        <line
          class="foundation-dynamics-chart-axis"
          x1=${chartLeft}
          y1=${chartTop}
          x2=${chartLeft}
          y2=${height - chartBottom}
        />
        <text
          class="foundation-dynamics-chart-tick"
          x=${chartLeft - 8}
          y=${chartTop + 4}
          text-anchor="end"
        >
          ${formatNumber(maxValue)}
        </text>
        <text
          class="foundation-dynamics-chart-tick"
          x=${chartLeft - 8}
          y=${height - chartBottom + 4}
          text-anchor="end"
        >
          ${formatNumber(minValue)}
        </text>
        <text
          class="foundation-dynamics-chart-label"
          x=${chartLeft + chartWidth / 2}
          y=${height - 8}
          text-anchor="middle"
        >
          Tick
        </text>
        <text
          class="foundation-dynamics-chart-label"
          x=${14}
          y=${chartTop + chartHeight / 2}
          text-anchor="middle"
          transform="rotate(-90 14 ${chartTop + chartHeight / 2})"
        >
          ${node?.data.name ?? "Value"}
        </text>
        ${
          node === null
            ? null
            : svg`<path
              class="foundation-dynamics-chart-line"
              d=${pathData}
              fill="none"
              stroke=${lineColor}
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />`
        }
        ${
          node === null || linePoints.length !== 1
            ? null
            : svg`<circle
              class="foundation-dynamics-chart-point"
              cx=${linePoints[0].x}
              cy=${linePoints[0].y}
              r="2.5"
              fill=${lineColor}
            />`
        }
      </svg>
    `;
    return html`
      <div class="foundation-dynamics-chart-wrap">
        ${chartSvg}
        <div class="foundation-dynamics-chart-legend">
          ${node === null
            ? html`<span>No node selected</span>`
            : html`<span
                >${node.data.name}:
                ${formatNumber(frameValue(frames[frames.length - 1], node))}
              </span>`}
        </div>
      </div>
    `;
  }

  private controlSection(
    title: string,
    content: TemplateResult,
  ): TemplateResult {
    return html`
      <hud-surface class="control-section">
        <hud-surface-header>
          <span class="section-title">${title}</span>
        </hud-surface-header>
        <hud-surface-body>${content}</hud-surface-body>
      </hud-surface>
    `;
  }

  private readonly handleControlTabChange = (
    event: CustomEvent<{ id: DynamicsPrimitive }>,
  ): void => {
    this.activeControlTab = event.detail.id;
  };

  private readonly handleNodesChange = (
    changes: NodeChange<FoundationDynamicsNode>[],
  ): void => {
    this.nodes = normalizeReadInputs(applyNodeChanges(changes, this.nodes));
  };

  private readonly handleEdgesChange = (changes: EdgeChange<Edge>[]): void => {
    this.edges = applyEdgeChanges(changes, this.edges);
  };

  private readonly handleConnect = (connection: Connection): void => {
    if (hasEquivalentConnection(this.edges, connection)) {
      return;
    }
    this.edges = addEdge(
      {
        ...connection,
        id: `edge-${connection.source}-${connection.target}-${this.edges.length}`,
        sourceHandle: connection.sourceHandle ?? "out",
        targetHandle: connection.targetHandle ?? "in",
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: "rgb(125, 200, 166)", strokeWidth: 2 },
      },
      this.edges,
    );
  };

  private readonly handleEdgeClick = (selectedEdge: Edge): void => {
    this.edges = this.edges.map((edge) => ({
      ...edge,
      selected: edge.id === selectedEdge.id,
    }));
  };

  private readonly clearEdgeSelection = (): void => {
    this.edges = this.edges.map((edge) =>
      edge.selected === true ? { ...edge, selected: false } : edge,
    );
  };

  private addPrimitive(primitive: DynamicsPrimitive): void {
    this.activeControlTab = primitive;
    const node = createPrimitiveNode(primitive, this.nodes.length);
    this.collapsedNodeIds = this.collapsedNodeIds.filter(
      (nodeId) => nodeId !== node.id,
    );
    this.nodes = [...this.nodes, node];
  }

  private updateNodeData(
    nodeId: string,
    data: Partial<FoundationDynamicsNodeData>,
  ): void {
    this.nodes = normalizeReadInputs(
      this.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node,
      ),
    );
  }

  private deleteNode(nodeId: string): void {
    this.edges = this.edges.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId,
    );
    this.nodes = normalizeReadInputs(
      this.nodes.filter((node) => node.id !== nodeId),
    );
    this.collapsedNodeIds = this.collapsedNodeIds.filter((id) => id !== nodeId);
    if (this.activeChartNodeId === nodeId) {
      this.activeChartNodeId = this.defaultChartNodeId();
    }
  }

  private toggleNodeCollapsed(nodeId: string): void {
    this.collapsedNodeIds = this.collapsedNodeIds.includes(nodeId)
      ? this.collapsedNodeIds.filter((id) => id !== nodeId)
      : [...this.collapsedNodeIds, nodeId];
  }

  private startInputAction(
    nodeId: string,
    amount: number,
    ticks: number,
  ): void {
    if (ticks <= 0 || amount === 0) {
      return;
    }
    this.inputActions = [
      ...this.inputActions.filter((action) => action.nodeId !== nodeId),
      {
        nodeId,
        remainingTicks: ticks,
        deltaPerTick: amount / ticks,
      },
    ];
  }

  private readonly stepSimulation = (): void => {
    if (this.inputActions.length > 0) {
      const applied = applyInputActions(this.nodes, this.inputActions);
      this.nodes = applied.nodes;
      this.inputActions = applied.actions;
    }
    this.simulation = stepSimulationState(
      this.simulation,
      this.nodes,
      this.edges,
    );
  };

  private readonly playSimulation = (): void => {
    this.pauseSimulation();
    this.simulation = {
      ...stepSimulationState(
        initialSimulationState(this.nodes, this.edges),
        this.nodes,
        this.edges,
      ),
      running: true,
    };
    this.simulationTimer = window.setInterval(this.stepSimulation, 100);
  };

  private readonly pauseSimulation = (): void => {
    if (this.simulationTimer !== undefined) {
      window.clearInterval(this.simulationTimer);
      this.simulationTimer = undefined;
    }
    if (this.simulation.running) {
      this.simulation = { ...this.simulation, running: false };
    }
  };

  private readonly resumeSimulation = (): void => {
    if (this.simulationTimer !== undefined) {
      return;
    }
    this.simulation = { ...this.simulation, running: true };
    this.simulationTimer = window.setInterval(this.stepSimulation, 100);
  };

  private readonly resetSimulation = (): void => {
    this.pauseSimulation();
    this.inputActions = [];
    this.simulation = initialSimulationState(this.nodes, this.edges);
  };

  private readonly createNewSystem = (): void => {
    this.pauseSimulation();
    this.systemName = "Untitled system";
    this.selectedSystemRef = "";
    this.nodes = [];
    this.edges = [];
    this.inputActions = [];
    this.collapsedNodeIds = [];
    this.activeChartNodeId = null;
    this.simulation = initialSimulationState([], []);
  };

  private readonly handleSystemSelection = (
    event: CustomEvent<{ value: string }>,
  ): void => {
    const ref = event.detail.value;
    this.selectedSystemRef = ref;
    if (ref === "") {
      this.createNewSystem();
      return;
    }
    const system = this.systemByRef(ref);
    if (system !== undefined) {
      this.loadSystem(system);
    }
  };

  private readonly saveCurrentSystem = (): void => {
    const system = savedDynamicsSystem(this.systemName, this.nodes, this.edges);
    this.savedSystems = [
      system,
      ...this.savedSystems.filter((candidate) => candidate.id !== system.id),
    ];
    this.selectedSystemRef = savedSystemRef(system.id);
    saveDynamicsSystemLibrary(this.savedSystems);
  };

  private loadSystem(system: SavedDynamicsSystem): void {
    this.pauseSimulation();
    this.nodes = normalizeReadInputs(cloneNodes(system.nodes));
    this.edges = cloneEdges(system.edges);
    this.systemName = system.name;
    this.inputActions = [];
    this.collapsedNodeIds = [];
    this.activeChartNodeId = this.defaultChartNodeId();
    this.simulation = initialSimulationState(this.nodes, this.edges);
  }

  private readonly deleteSelectedSystem = (): void => {
    const system = this.selectedSavedSystem();
    if (system === undefined) {
      return;
    }
    this.savedSystems = this.savedSystems.filter(
      (candidate) => candidate.id !== system.id,
    );
    this.createNewSystem();
    saveDynamicsSystemLibrary(this.savedSystems);
  };

  private systemByRef(ref: string): SavedDynamicsSystem | undefined {
    if (ref.startsWith(BUILTIN_SYSTEM_REF_PREFIX)) {
      const id = ref.slice(BUILTIN_SYSTEM_REF_PREFIX.length);
      return FOUNDATION_DYNAMICS_BUILTIN_SYSTEMS.find(
        (system) => system.id === id,
      );
    }
    if (ref.startsWith(SAVED_SYSTEM_REF_PREFIX)) {
      const id = ref.slice(SAVED_SYSTEM_REF_PREFIX.length);
      return this.savedSystems.find((system) => system.id === id);
    }
    return undefined;
  }

  private selectedSavedSystem(): SavedDynamicsSystem | undefined {
    if (!this.selectedSystemRef.startsWith(SAVED_SYSTEM_REF_PREFIX)) {
      return undefined;
    }
    const id = this.selectedSystemRef.slice(SAVED_SYSTEM_REF_PREFIX.length);
    return this.savedSystems.find((system) => system.id === id);
  }

  private savedSystemOptions(): HudSelectOption[] {
    return [
      { label: "Select preset...", value: "" },
      ...FOUNDATION_DYNAMICS_BUILTIN_SYSTEMS.map((system) => ({
        label: system.name,
        value: builtinSystemRef(system.id),
      })),
      ...this.savedSystems.map((system) => ({
        label: system.name,
        value: savedSystemRef(system.id),
      })),
    ];
  }

  private defaultChartNodeId(): string | null {
    return (
      sinkNodes(this.nodes)[0]?.id ?? chartableNodes(this.nodes)[0]?.id ?? null
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
      grid-template-rows: auto auto minmax(0, 1fr);
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

    .tab-tools {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      align-items: end;
      gap: 8px;
      margin-bottom: 14px;
    }

    .control-tabs-kit {
      display: block;
      --hud-color: var(--text);
    }

    .panel-scroll {
      min-height: 0;
      overflow-y: auto;
      padding-right: 2px;
    }

    .control-panel[hidden] {
      display: none;
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

    hud-button {
      --hud-button-width: 100%;
      --hud-button-min-height: 30px;
      --hud-button-radius: 6px;
      --hud-button-padding: 5px 8px;
    }

    hud-button.primary-action {
      --hud-button-background: var(--accent);
      --hud-button-border-color: rgb(125 200 166 / 0.55);
      --hud-button-color: #09100d;
      --hud-button-hover-background: #95d9bb;
    }

    hud-button.danger-action {
      --hud-button-background: rgb(120 36 36 / 0.34);
      --hud-button-border-color: rgb(222 120 107 / 0.72);
      --hud-button-color: #fecaca;
      --hud-button-hover-background: rgb(140 42 42 / 0.48);
    }

    hud-icon-button {
      --hud-icon-button-size: 24px;
      --hud-button-border-color: var(--line);
      --hud-button-background: rgb(32 38 42 / 0.82);
      --hud-button-hover-background: rgb(48 56 61 / 0.9);
      --hud-button-color: var(--text);
    }

    .control-icon {
      display: block;
      width: 14px;
      height: 14px;
      color: currentColor;
      stroke: currentColor;
    }

    .preset-section {
      display: block;
      margin-bottom: 14px;
      --hud-radius: 8px;
      --hud-surface-header-min-height: 36px;
      --hud-surface-header-padding: 9px 12px;
      --hud-surface-body-padding: 10px 12px;
    }

    .preset-section::part(surface) {
      border: 1px solid rgb(48 56 61 / 0.86);
      background: rgb(24 29 32 / 0.78);
    }

    .preset-tools {
      display: grid;
      grid-template-columns: minmax(0, 1fr) repeat(3, auto);
      align-items: center;
      gap: 6px;
    }

    .preset-tools hud-select {
      min-width: 0;
    }

    .system-name-field {
      display: grid;
      gap: 6px;
      margin-top: 10px;
      color: var(--muted);
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
    }

    .system-name-field input,
    .control-widget input,
    .control-widget textarea {
      width: 100%;
      min-width: 0;
      border: 1px solid rgb(157 170 177 / 0.28);
      border-radius: 6px;
      padding: 7px 8px;
      background: var(--panel-2);
      color: var(--text);
      font: inherit;
      font-size: 12px;
    }

    .control-widget textarea {
      min-height: 76px;
      resize: vertical;
      font-family:
        ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        "Liberation Mono", monospace;
      line-height: 1.35;
    }

    .add-node-action {
      display: block;
      margin-bottom: 14px;
    }

    .control-table {
      display: grid;
      grid-template-columns: minmax(84px, 0.8fr) minmax(154px, 1.45fr);
      align-items: center;
      gap: 7px 10px;
    }

    .control-table-head {
      display: contents;
      color: var(--muted);
      font-size: 9px;
      font-weight: 700;
      line-height: 1;
      text-transform: uppercase;
    }

    .control-row {
      display: contents;
    }

    .control-name {
      min-width: 0;
      color: var(--muted);
      font-size: 10px;
      font-weight: 700;
      line-height: 1.15;
    }

    .control-widget {
      min-width: 0;
      color: var(--text);
      font-size: 12px;
    }

    .node-section-title {
      display: flex;
      width: 100%;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .node-collapse-button {
      display: inline-flex;
      min-width: 0;
      align-items: center;
      gap: 6px;
      border: 0;
      padding: 0;
      background: transparent;
      color: inherit;
      cursor: pointer;
      font: inherit;
    }

    .node-collapse-button .section-title {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    hud-surface-body[hidden] {
      display: none;
    }

    .node-section-title > span:last-child,
    .value-pill {
      color: var(--accent);
      font-size: 12px;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
    }

    .native-range {
      width: 100%;
      accent-color: var(--accent);
    }

    .slider-editor {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 6px;
    }

    .slider-limit-editor {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 7px;
    }

    .inline-number-input {
      min-width: 0;
      height: 28px;
      padding: 5px 6px;
      font-size: 11px;
      text-align: right;
    }

    .action-widget {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 7px;
    }

    .action-editor {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 7px;
    }

    .inline-number-field {
      display: grid;
      gap: 4px;
      min-width: 0;
    }

    .inline-number-field span {
      color: var(--muted);
      font-size: 9px;
      font-weight: 800;
      line-height: 1;
      text-transform: uppercase;
    }

    .action-status {
      color: var(--accent);
      font-size: 11px;
      font-weight: 800;
    }

    .chip-list {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }

    .chip-list code,
    .chip-list em {
      border: 1px solid rgb(157 170 177 / 0.2);
      border-radius: 999px;
      padding: 3px 7px;
      background: rgb(16 20 22 / 0.72);
      color: var(--text);
      font-style: normal;
      font-size: 10px;
    }

    .empty-control {
      margin: 0;
      color: var(--muted);
      font-size: 12px;
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
      background: #111719;
      overflow: hidden;
    }

    .dynamics-workspace {
      display: grid;
      grid-template-rows: minmax(320px, 1fr) auto;
      min-height: 0;
      height: 100%;
      overflow: hidden;
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

    .foundation-dynamics-system-panel {
      display: grid;
      gap: 9px;
      border: 1px solid rgb(157 170 177 / 0.16);
      border-radius: 8px;
      padding: 10px;
      background: rgb(16 20 22 / 0.58);
    }

    .foundation-dynamics-system-panel label {
      display: grid;
      gap: 5px;
      color: var(--muted);
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
    }

    .foundation-dynamics-system-panel input,
    .foundation-dynamics-system-panel select {
      width: 100%;
      min-width: 0;
      border: 1px solid rgb(157 170 177 / 0.28);
      border-radius: 6px;
      padding: 7px 8px;
      background: var(--panel-2);
      color: var(--text);
      font: inherit;
      font-size: 12px;
      text-transform: none;
    }

    .foundation-dynamics-sidebar-actions {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .foundation-dynamics-system-actions {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 8px;
    }

    .foundation-dynamics-saved-list {
      display: grid;
      gap: 6px;
    }

    .foundation-dynamics-saved-list > em {
      color: var(--muted);
      font-size: 12px;
      font-style: normal;
    }

    .foundation-dynamics-saved-list div {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 6px;
    }

    .foundation-dynamics-saved-list div button:first-child {
      min-width: 0;
      overflow: hidden;
      text-align: left;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .foundation-dynamics-system-actions button,
    .foundation-dynamics-saved-list button,
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

    .foundation-dynamics-system-actions button:hover,
    .foundation-dynamics-saved-list button:hover,
    .foundation-dynamics-sidebar-actions button:hover,
    .foundation-dynamics-sidebar-tabs button:hover,
    .foundation-dynamics-sidebar-tabs button.is-active {
      border-color: rgb(125 200 166 / 0.72);
      background: rgb(30 47 42);
    }

    .foundation-dynamics-saved-list div button:last-child {
      border-color: rgb(222 120 107 / 0.62);
      background: rgb(84 33 32 / 0.72);
      color: rgb(255 210 205);
    }

    .foundation-dynamics-saved-list div button:last-child:hover {
      background: rgb(116 41 38 / 0.86);
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
      min-height: 0;
      max-height: 380px;
      overflow: auto;
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

    .foundation-dynamics-chart-line {
      fill: none;
      stroke-width: 2;
      vector-effect: non-scaling-stroke;
    }

    .foundation-dynamics-chart-point {
      vector-effect: non-scaling-stroke;
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
