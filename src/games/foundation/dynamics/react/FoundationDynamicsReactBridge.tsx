import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Connection,
  type ConnectionLineComponentProps,
  type Edge,
  type EdgeChange,
  type IsValidConnection,
  type Node,
  type NodeChange,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createRoot, type Root } from "react-dom/client";

type DynamicsPrimitive = "input" | "operator" | "sink";
type DynamicsInputKind = "read" | "constant" | "user";

interface FoundationDynamicsNodeData extends Record<string, unknown> {
  readonly primitive: DynamicsPrimitive;
  readonly name: string;
  readonly inputKind?: DynamicsInputKind;
  readonly value?: number;
  readonly sliderMin?: number;
  readonly sliderMax?: number;
  readonly actionAmount?: number;
  readonly actionTicks?: number;
  readonly readSinkId?: string;
  readonly expression?: string;
  readonly state?: number;
}

type FoundationDynamicsNode = Node<FoundationDynamicsNodeData>;

interface SimulationFrame {
  readonly tick: number;
  readonly operatorValues: Readonly<Record<string, number>>;
  readonly sinkStates: Readonly<Record<string, number>>;
}

interface SimulationState {
  readonly running: boolean;
  readonly tick: number;
  readonly sinkStates: Readonly<Record<string, number>>;
  readonly frames: readonly SimulationFrame[];
}

interface InputRampAction {
  readonly nodeId: string;
  readonly remainingTicks: number;
  readonly deltaPerTick: number;
}

const FOUNDATION_DYNAMICS_NODES: FoundationDynamicsNode[] = [
  inputNode("tiles-owned", "tilesOwned", "user", 10, undefined, 0, 40),
  inputNode("yield-per-tile", "yieldPerTile", "constant", 2, undefined, 0, 170),
  operatorNode(
    "food-production",
    "foodProduction",
    "tilesOwned * yieldPerTile",
    290,
    96,
  ),
  inputNode("population", "population", "user", 10, undefined, 0, 330),
  inputNode(
    "food-per-population",
    "foodPerPopulation",
    "constant",
    1,
    undefined,
    0,
    460,
  ),
  operatorNode(
    "food-demand",
    "foodDemand",
    "population * foodPerPopulation",
    290,
    370,
  ),
  inputNode(
    "capacity",
    "foodStockCapacity",
    "constant",
    20000,
    undefined,
    620,
    60,
  ),
  sinkNode(
    "food-stock",
    "foodStock",
    0,
    "clamp(state + foodProduction - foodDemand, 0, foodStockCapacity)",
    620,
    245,
  ),
];

const FOUNDATION_DYNAMICS_EDGES: Edge[] = [
  edge("tiles-to-production", "tiles-owned", "food-production"),
  edge("yield-to-production", "yield-per-tile", "food-production"),
  edge("production-to-stock", "food-production", "food-stock", "+"),
  edge("population-to-demand", "population", "food-demand"),
  edge("food-per-population-to-demand", "food-per-population", "food-demand"),
  edge("demand-to-stock", "food-demand", "food-stock", "-"),
  edge("capacity-to-stock", "capacity", "food-stock", "max"),
];

const nodeTypes = {
  foundationDynamics: FoundationDynamicsNodeView,
};

export class FoundationDynamicsReactBridge {
  private readonly root: Root;
  private readonly sidebarContainer: HTMLElement;

  constructor(container: HTMLElement, sidebarContainer: HTMLElement) {
    this.root = createRoot(container);
    this.sidebarContainer = sidebarContainer;
    this.render();
  }

  unmount(): void {
    this.root.unmount();
  }

  private render(): void {
    this.root.render(
      <FoundationDynamicsCanvas sidebarContainer={this.sidebarContainer} />,
    );
  }
}

function FoundationDynamicsCanvas({
  sidebarContainer,
}: {
  readonly sidebarContainer: HTMLElement;
}) {
  const [nodes, setNodes] = useState<FoundationDynamicsNode[]>(
    FOUNDATION_DYNAMICS_NODES,
  );
  const [edges, setEdges] = useState<Edge[]>(FOUNDATION_DYNAMICS_EDGES);
  const [inputActions, setInputActions] = useState<readonly InputRampAction[]>(
    [],
  );
  const [activeSidebarTab, setActiveSidebarTab] =
    useState<DynamicsPrimitive>("input");
  const [activeChartNodeId, setActiveChartNodeId] = useState<string | null>(
    "food-stock",
  );
  const [simulation, setSimulation] = useState<SimulationState>(() =>
    initialSimulationState(
      FOUNDATION_DYNAMICS_NODES,
      FOUNDATION_DYNAMICS_EDGES,
    ),
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange<FoundationDynamicsNode>[]) =>
      setNodes((current) =>
        normalizeReadInputs(applyNodeChanges(changes, current)),
      ),
    [],
  );
  const handleEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) =>
      setEdges((current) => applyEdgeChanges(changes, current)),
    [],
  );
  const handleConnect = useCallback(
    (connection: Connection) =>
      setEdges((current) =>
        hasEquivalentConnection(current, connection)
          ? current
          : addEdge(
              {
                ...connection,
                id: `edge-${connection.source}-${connection.target}-${current.length}`,
                sourceHandle: connection.sourceHandle ?? "out",
                targetHandle: connection.targetHandle ?? "in",
                type: "smoothstep",
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { stroke: "rgb(125, 200, 166)", strokeWidth: 2 },
              },
              current,
            ),
      ),
    [],
  );
  const isValidConnection = useCallback<IsValidConnection>(
    (connection) =>
      connection.source !== null &&
      connection.target !== null &&
      connection.source !== connection.target &&
      (connection.sourceHandle ?? "out") === "out" &&
      (connection.targetHandle ?? "in") === "in" &&
      !hasEquivalentConnection(edges, connection),
    [edges],
  );
  const addPrimitive = useCallback((primitive: DynamicsPrimitive) => {
    setActiveSidebarTab(primitive);
    setNodes((current) => [
      ...current,
      createPrimitiveNode(primitive, current.length),
    ]);
  }, []);
  const clearSelection = useCallback(() => {
    setEdges((current) =>
      current.map((edge) =>
        edge.selected === true ? { ...edge, selected: false } : edge,
      ),
    );
  }, []);
  const handleEdgeClick = useCallback((_: unknown, selectedEdge: Edge) => {
    setEdges((current) =>
      current.map((edge) => ({
        ...edge,
        selected: edge.id === selectedEdge.id,
      })),
    );
  }, []);
  const updateNodeData = useCallback(
    (nodeId: string, data: Partial<FoundationDynamicsNodeData>) =>
      setNodes((current) =>
        normalizeReadInputs(
          current.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...data } }
              : node,
          ),
        ),
      ),
    [],
  );
  const deleteNode = useCallback((nodeId: string) => {
    setEdges((current) =>
      current.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId,
      ),
    );
    setNodes((current) =>
      normalizeReadInputs(current.filter((node) => node.id !== nodeId)),
    );
    setActiveChartNodeId((current) => (current === nodeId ? null : current));
  }, []);
  const setSinkCurrentState = useCallback((nodeId: string, value: number) => {
    setSimulation((current) => setCurrentSinkState(current, nodeId, value));
  }, []);
  const startInputAction = useCallback(
    (nodeId: string, amount: number, ticks: number) => {
      if (ticks <= 0 || amount === 0) {
        return;
      }
      setInputActions((current) => [
        ...current.filter((action) => action.nodeId !== nodeId),
        {
          nodeId,
          remainingTicks: ticks,
          deltaPerTick: amount / ticks,
        },
      ]);
    },
    [],
  );
  const stepSimulation = useCallback(() => {
    setInputActions((currentActions) => {
      if (currentActions.length === 0) {
        setSimulation((current) => stepSimulationState(current, nodes, edges));
        return currentActions;
      }
      const applied = applyInputActions(nodes, currentActions);
      setNodes(applied.nodes);
      setSimulation((current) =>
        stepSimulationState(current, applied.nodes, edges),
      );
      return applied.actions;
    });
  }, [edges, nodes]);
  const playSimulation = useCallback(() => {
    setSimulation({
      ...stepSimulationState(
        initialSimulationState(nodes, edges),
        nodes,
        edges,
      ),
      running: true,
    });
  }, [edges, nodes]);
  const pauseSimulation = useCallback(() => {
    setSimulation((current) => ({ ...current, running: false }));
  }, []);
  const resumeSimulation = useCallback(() => {
    setSimulation((current) => ({ ...current, running: true }));
  }, []);
  const resetSimulation = useCallback(() => {
    setSimulation(initialSimulationState(nodes, edges));
  }, [edges, nodes]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }
      setEdges((current) => {
        const next = current.filter((edge) => edge.selected !== true);
        if (next.length !== current.length) {
          event.preventDefault();
        }
        return next;
      });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!simulation.running) {
      return;
    }
    const timer = window.setInterval(() => {
      setInputActions((currentActions) => {
        if (currentActions.length === 0) {
          setSimulation((current) =>
            current.running
              ? stepSimulationState(current, nodes, edges)
              : current,
          );
          return currentActions;
        }
        const applied = applyInputActions(nodes, currentActions);
        setNodes(applied.nodes);
        setSimulation((current) =>
          current.running
            ? stepSimulationState(current, applied.nodes, edges)
            : current,
        );
        return applied.actions;
      });
    }, 100);
    return () => window.clearInterval(timer);
  }, [edges, nodes, simulation.running]);

  return (
    <>
      {createPortal(
        <FoundationDynamicsSidebar
          nodes={nodes}
          edges={edges}
          simulation={simulation}
          activeTab={activeSidebarTab}
          onTabChange={setActiveSidebarTab}
          onAdd={addPrimitive}
          onChange={updateNodeData}
          onDelete={deleteNode}
          onSetSinkState={setSinkCurrentState}
          inputActions={inputActions}
          onStartInputAction={startInputAction}
        />,
        sidebarContainer,
      )}
      <div className="foundation-dynamics-react-shell">
        <div className="foundation-dynamics-flow">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            isValidConnection={isValidConnection}
            connectionLineComponent={FoundationDynamicsConnectionLine}
            onNodeClick={(_, node) => setActiveSidebarTab(node.data.primitive)}
            onEdgeClick={handleEdgeClick}
            onPaneClick={clearSelection}
            defaultEdgeOptions={{
              type: "smoothstep",
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { stroke: "rgb(125, 200, 166)", strokeWidth: 2 },
            }}
            fitView
            nodesDraggable
            nodesConnectable
            elementsSelectable
            edgesFocusable
            edgesReconnectable={false}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="rgba(157, 170, 177, 0.22)" gap={24} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
        <FoundationDynamicsSimulatorPanel
          nodes={nodes}
          simulation={simulation}
          activeChartNodeId={activeChartNodeId}
          onChartNodeChange={setActiveChartNodeId}
          onPause={pauseSimulation}
          onPlay={playSimulation}
          onReset={resetSimulation}
          onResume={resumeSimulation}
          onStep={stepSimulation}
        />
      </div>
    </>
  );
}

function FoundationDynamicsSimulatorPanel({
  nodes,
  simulation,
  activeChartNodeId,
  onChartNodeChange,
  onPause,
  onPlay,
  onReset,
  onResume,
  onStep,
}: {
  readonly nodes: readonly FoundationDynamicsNode[];
  readonly simulation: SimulationState;
  readonly activeChartNodeId: string | null;
  readonly onChartNodeChange: (nodeId: string) => void;
  readonly onPause: () => void;
  readonly onPlay: () => void;
  readonly onReset: () => void;
  readonly onResume: () => void;
  readonly onStep: () => void;
}) {
  const chartNodes = chartableNodes(nodes);
  const activeNode =
    chartNodes.find((node) => node.id === activeChartNodeId) ??
    chartNodes[0] ??
    null;
  return (
    <section className="foundation-dynamics-simulator">
      <div className="foundation-dynamics-sim-panel">
        <div className="foundation-dynamics-sim-header">
          <div>
            <strong>Simulation</strong>
            <span>T{simulation.tick}</span>
          </div>
          <div className="foundation-dynamics-sim-controls">
            <button type="button" onClick={onPlay}>
              Play
            </button>
            <button type="button" onClick={onPause}>
              Pause
            </button>
            <button type="button" onClick={onResume}>
              Resume
            </button>
            <button type="button" onClick={onStep}>
              Step
            </button>
            <button type="button" onClick={onReset}>
              Reset
            </button>
          </div>
        </div>
        <div className="foundation-dynamics-chart-tabs">
          {chartNodes.length === 0 ? (
            <span>No sinks or operators</span>
          ) : (
            chartNodes.map((node) => (
              <button
                key={node.id}
                type="button"
                className={node.id === activeNode?.id ? "is-active" : ""}
                onClick={() => onChartNodeChange(node.id)}
              >
                {node.data.name}
              </button>
            ))
          )}
        </div>
        <DynamicsValueChart node={activeNode} frames={simulation.frames} />
      </div>
    </section>
  );
}

function FoundationDynamicsSidebar({
  nodes,
  edges,
  simulation,
  activeTab,
  onTabChange,
  onAdd,
  onChange,
  onDelete,
  onSetSinkState,
  inputActions,
  onStartInputAction,
}: {
  readonly nodes: readonly FoundationDynamicsNode[];
  readonly edges: readonly Edge[];
  readonly simulation: SimulationState;
  readonly activeTab: DynamicsPrimitive;
  readonly onTabChange: (tab: DynamicsPrimitive) => void;
  readonly onAdd: (primitive: DynamicsPrimitive) => void;
  readonly onChange: (
    nodeId: string,
    data: Partial<FoundationDynamicsNodeData>,
  ) => void;
  readonly onDelete: (nodeId: string) => void;
  readonly onSetSinkState: (nodeId: string, value: number) => void;
  readonly inputActions: readonly InputRampAction[];
  readonly onStartInputAction: (
    nodeId: string,
    amount: number,
    ticks: number,
  ) => void;
}) {
  const visibleNodes = nodes.filter(
    (node) => node.data.primitive === activeTab,
  );
  return (
    <div className="foundation-dynamics-sidebar">
      <div className="foundation-dynamics-sidebar-actions">
        <button type="button" onClick={() => onAdd("input")}>
          Add Input
        </button>
        <button type="button" onClick={() => onAdd("operator")}>
          Add Operator
        </button>
        <button type="button" onClick={() => onAdd("sink")}>
          Add Sink
        </button>
      </div>
      <div className="foundation-dynamics-sidebar-tabs">
        {(["input", "operator", "sink"] as const).map((primitive) => (
          <button
            key={primitive}
            type="button"
            className={primitive === activeTab ? "is-active" : ""}
            onClick={() => onTabChange(primitive)}
          >
            {tabLabel(primitive)} {primitiveCount(nodes, primitive)}
          </button>
        ))}
      </div>
      <div className="foundation-dynamics-sidebar-list">
        {visibleNodes.length === 0 ? (
          <em>No {tabLabel(activeTab).toLowerCase()}</em>
        ) : (
          visibleNodes.map((node) => (
            <FoundationDynamicsSidebarCard
              key={node.id}
              node={node}
              nodes={nodes}
              edges={edges}
              simulation={simulation}
              onChange={onChange}
              onDelete={onDelete}
              onSetSinkState={onSetSinkState}
              inputAction={inputActions.find(
                (action) => action.nodeId === node.id,
              )}
              onStartInputAction={onStartInputAction}
            />
          ))
        )}
      </div>
    </div>
  );
}

function FoundationDynamicsSidebarCard({
  node,
  nodes,
  edges,
  simulation,
  onChange,
  onDelete,
  onSetSinkState,
  inputAction,
  onStartInputAction,
}: {
  readonly node: FoundationDynamicsNode;
  readonly nodes: readonly FoundationDynamicsNode[];
  readonly edges: readonly Edge[];
  readonly simulation: SimulationState;
  readonly onChange: (
    nodeId: string,
    data: Partial<FoundationDynamicsNodeData>,
  ) => void;
  readonly onDelete: (nodeId: string) => void;
  readonly onSetSinkState: (nodeId: string, value: number) => void;
  readonly inputAction: InputRampAction | undefined;
  readonly onStartInputAction: (
    nodeId: string,
    amount: number,
    ticks: number,
  ) => void;
}) {
  const sinks = sinkNodes(nodes);
  const inputs = incomingNames(node.id, nodes, edges);
  const incomingConnections = connectionSummaries(
    node.id,
    "incoming",
    nodes,
    edges,
  );
  const outgoingConnections = connectionSummaries(
    node.id,
    "outgoing",
    nodes,
    edges,
  );
  const value = currentNodeValue(node, simulation);
  return (
    <article className="foundation-dynamics-sidebar-card">
      <div className="foundation-dynamics-sidebar-card-header">
        <div>
          <strong>{node.data.name}</strong>
          <span>{formatNumber(value)}</span>
        </div>
        <button type="button" onClick={() => onDelete(node.id)}>
          Delete
        </button>
      </div>
      <label>
        Name
        <input
          value={node.data.name}
          onChange={(event) =>
            onChange(node.id, { name: event.currentTarget.value })
          }
        />
      </label>
      {node.data.primitive === "input" ? (
        <SidebarInputFields
          node={node}
          sinks={sinks}
          inputAction={inputAction}
          onChange={onChange}
          onStartInputAction={onStartInputAction}
        />
      ) : (
        <SidebarFunctionFields
          node={node}
          inputs={inputs}
          currentValue={value}
          onChange={onChange}
          onSetSinkState={onSetSinkState}
        />
      )}
      <ConnectionList title="Inputs" connections={incomingConnections} />
      <ConnectionList title="Outputs" connections={outgoingConnections} />
    </article>
  );
}

function SidebarInputFields({
  node,
  sinks,
  inputAction,
  onChange,
  onStartInputAction,
}: {
  readonly node: FoundationDynamicsNode;
  readonly sinks: readonly FoundationDynamicsNode[];
  readonly inputAction: InputRampAction | undefined;
  readonly onChange: (
    nodeId: string,
    data: Partial<FoundationDynamicsNodeData>,
  ) => void;
  readonly onStartInputAction: (
    nodeId: string,
    amount: number,
    ticks: number,
  ) => void;
}) {
  const firstSinkId = sinks[0]?.id;
  const sliderMin = node.data.sliderMin ?? 0;
  const sliderMax = Math.max(sliderMin, node.data.sliderMax ?? 100);
  const value = clamp(node.data.value ?? 0, sliderMin, sliderMax);
  const actionAmount = node.data.actionAmount ?? 1;
  const actionTicks = Math.max(1, Math.round(node.data.actionTicks ?? 10));
  return (
    <>
      <label>
        Source
        <select
          value={node.data.inputKind ?? "user"}
          onChange={(event) => {
            const inputKind = event.currentTarget.value as DynamicsInputKind;
            onChange(node.id, {
              inputKind,
              readSinkId:
                inputKind === "read"
                  ? (node.data.readSinkId ?? firstSinkId)
                  : undefined,
            });
          }}
        >
          <option value="user">user</option>
          <option value="constant">constant</option>
          <option value="read" disabled={sinks.length === 0}>
            read sink
          </option>
        </select>
      </label>
      {node.data.inputKind === "read" ? (
        <label>
          Sink
          <select
            value={node.data.readSinkId ?? firstSinkId ?? ""}
            onChange={(event) =>
              onChange(node.id, { readSinkId: event.currentTarget.value })
            }
          >
            {sinks.map((sink) => (
              <option key={sink.id} value={sink.id}>
                {sink.data.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <>
          <label>
            Value
            <input
              type="number"
              value={node.data.value ?? 0}
              onChange={(event) =>
                onChange(node.id, {
                  value: parseNumberInput(event.currentTarget.value),
                })
              }
            />
          </label>
          <div className="foundation-dynamics-slider-row">
            <label>
              Min
              <input
                type="number"
                value={sliderMin}
                onChange={(event) =>
                  onChange(node.id, {
                    sliderMin: parseNumberInput(event.currentTarget.value),
                  })
                }
              />
            </label>
            <label>
              Max
              <input
                type="number"
                value={sliderMax}
                onChange={(event) =>
                  onChange(node.id, {
                    sliderMax: parseNumberInput(event.currentTarget.value),
                  })
                }
              />
            </label>
          </div>
          <label>
            Slider
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              step="any"
              value={value}
              onChange={(event) =>
                onChange(node.id, {
                  value: parseNumberInput(event.currentTarget.value),
                })
              }
            />
          </label>
          <div className="foundation-dynamics-action-row">
            <label>
              Change
              <input
                type="number"
                value={actionAmount}
                onChange={(event) =>
                  onChange(node.id, {
                    actionAmount: parseNumberInput(event.currentTarget.value),
                  })
                }
              />
            </label>
            <label>
              Ticks
              <input
                type="number"
                min={1}
                value={actionTicks}
                onChange={(event) =>
                  onChange(node.id, {
                    actionTicks: Math.max(
                      1,
                      Math.round(parseNumberInput(event.currentTarget.value)),
                    ),
                  })
                }
              />
            </label>
            <button
              type="button"
              onClick={() =>
                onStartInputAction(node.id, actionAmount, actionTicks)
              }
            >
              Apply
            </button>
          </div>
          {inputAction === undefined ? null : (
            <span className="foundation-dynamics-action-status">
              {inputAction.remainingTicks} ticks remaining
            </span>
          )}
        </>
      )}
    </>
  );
}

function SidebarFunctionFields({
  node,
  inputs,
  currentValue,
  onChange,
  onSetSinkState,
}: {
  readonly node: FoundationDynamicsNode;
  readonly inputs: readonly string[];
  readonly currentValue: number;
  readonly onChange: (
    nodeId: string,
    data: Partial<FoundationDynamicsNodeData>,
  ) => void;
  readonly onSetSinkState: (nodeId: string, value: number) => void;
}) {
  return (
    <>
      <label>
        Current
        <input
          type="number"
          value={currentValue}
          readOnly={node.data.primitive !== "sink"}
          onChange={(event) =>
            node.data.primitive === "sink"
              ? onSetSinkState(
                  node.id,
                  parseNumberInput(event.currentTarget.value),
                )
              : undefined
          }
        />
      </label>
      {node.data.primitive === "sink" ? (
        <label>
          Initial
          <input
            type="number"
            value={node.data.state ?? 0}
            onChange={(event) =>
              onChange(node.id, {
                state: parseNumberInput(event.currentTarget.value),
              })
            }
          />
        </label>
      ) : null}
      <label>
        Function
        <textarea
          value={node.data.expression ?? ""}
          onChange={(event) =>
            onChange(node.id, { expression: event.currentTarget.value })
          }
        />
      </label>
      <div className="foundation-dynamics-inspector-inputs">
        <span>Provided inputs</span>
        {inputs.length === 0 ? (
          <em>none</em>
        ) : (
          inputs.map((input) => <code key={input}>{input}</code>)
        )}
      </div>
    </>
  );
}

function DynamicsValueChart({
  node,
  frames,
}: {
  readonly node: FoundationDynamicsNode | null;
  readonly frames: readonly SimulationFrame[];
}) {
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
  const horizontalGrid = [0, 0.25, 0.5, 0.75, 1];
  const verticalGrid = [0, 0.25, 0.5, 0.75, 1];
  const points =
    node === null
      ? ""
      : frames
          .map((frame) => {
            const x =
              chartLeft + ((frame.tick - firstTick) / tickRange) * chartWidth;
            const y =
              chartTop +
              chartHeight -
              ((frameValue(frame, node) - minValue) / range) * chartHeight;
            return `${x},${y}`;
          })
          .join(" ");
  return (
    <div className="foundation-dynamics-chart-wrap">
      <svg
        className="foundation-dynamics-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={
          node === null ? "No chart selected" : `${node.data.name} over time`
        }
      >
        {horizontalGrid.map((ratio) => {
          const y = chartTop + ratio * chartHeight;
          return (
            <line
              key={`h-${ratio}`}
              className="foundation-dynamics-chart-grid"
              x1={chartLeft}
              y1={y}
              x2={width - chartRight}
              y2={y}
            />
          );
        })}
        {verticalGrid.map((ratio) => {
          const x = chartLeft + ratio * chartWidth;
          return (
            <line
              key={`v-${ratio}`}
              className="foundation-dynamics-chart-grid"
              x1={x}
              y1={chartTop}
              x2={x}
              y2={height - chartBottom}
            />
          );
        })}
        <line
          className="foundation-dynamics-chart-axis"
          x1={chartLeft}
          y1={height - chartBottom}
          x2={width - chartRight}
          y2={height - chartBottom}
        />
        <line
          className="foundation-dynamics-chart-axis"
          x1={chartLeft}
          y1={chartTop}
          x2={chartLeft}
          y2={height - chartBottom}
        />
        <text
          className="foundation-dynamics-chart-tick"
          x={chartLeft - 8}
          y={chartTop + 4}
          textAnchor="end"
        >
          {formatNumber(maxValue)}
        </text>
        <text
          className="foundation-dynamics-chart-tick"
          x={chartLeft - 8}
          y={height - chartBottom + 4}
          textAnchor="end"
        >
          {formatNumber(minValue)}
        </text>
        <text
          className="foundation-dynamics-chart-label"
          x={chartLeft + chartWidth / 2}
          y={height - 8}
          textAnchor="middle"
        >
          Tick
        </text>
        <text
          className="foundation-dynamics-chart-label"
          x={14}
          y={chartTop + chartHeight / 2}
          textAnchor="middle"
          transform={`rotate(-90 14 ${chartTop + chartHeight / 2})`}
        >
          {node?.data.name ?? "Value"}
        </text>
        {node === null ? null : (
          <polyline
            points={points}
            fill="none"
            stroke={chartColor(node.data.primitive === "sink" ? 0 : 1)}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
      <div className="foundation-dynamics-chart-legend">
        {node === null ? (
          <span>No node selected</span>
        ) : (
          <span>
            <i
              style={{
                background: chartColor(node.data.primitive === "sink" ? 0 : 1),
              }}
            />
            {node.data.name}:{" "}
            {formatNumber(frameValue(frames[frames.length - 1], node))}
          </span>
        )}
      </div>
    </div>
  );
}

function FoundationDynamicsConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  connectionStatus,
}: ConnectionLineComponentProps<FoundationDynamicsNode>) {
  const opacity = connectionStatus === "valid" ? 1 : 0.3;
  const midX = fromX + (toX - fromX) * 0.5;
  return (
    <g className="foundation-dynamics-connection-line">
      <path
        d={`M ${fromX},${fromY} C ${midX},${fromY} ${midX},${toY} ${toX},${toY}`}
        fill="none"
        stroke="rgb(125, 200, 166)"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={opacity}
      />
    </g>
  );
}

function FoundationDynamicsNodeView({
  data,
}: NodeProps<FoundationDynamicsNode>) {
  const primitive = data.primitive;
  const secondary = nodeSecondaryText(data);
  return (
    <div
      className={`foundation-dynamics-node foundation-dynamics-node--${primitive}`}
      data-primitive={primitive}
    >
      {primitive !== "input" ? (
        <Handle
          id="in"
          type="target"
          position={Position.Left}
          className="foundation-dynamics-handle foundation-dynamics-handle--input"
        />
      ) : null}
      <div className="foundation-dynamics-node-kind">
        {primitive}
        {data.inputKind === undefined ? "" : `:${data.inputKind}`}
      </div>
      <strong>{data.name}</strong>
      {secondary === "" ? null : <span>{secondary}</span>}
      {data.expression === undefined ? null : <code>{data.expression}</code>}
      {primitive !== "sink" ? (
        <Handle
          id="out"
          type="source"
          position={Position.Right}
          className="foundation-dynamics-handle foundation-dynamics-handle--output"
        />
      ) : null}
    </div>
  );
}

function ConnectionList({
  title,
  connections,
}: {
  readonly title: string;
  readonly connections: readonly string[];
}) {
  return (
    <div className="foundation-dynamics-inspector-connections">
      <span>{title}</span>
      {connections.length === 0 ? (
        <em>none</em>
      ) : (
        connections.map((connection) => (
          <code key={connection}>{connection}</code>
        ))
      )}
    </div>
  );
}

function inputNode(
  id: string,
  name: string,
  inputKind: DynamicsInputKind,
  value: number | undefined,
  readSinkId: string | undefined,
  x: number,
  y: number,
): FoundationDynamicsNode {
  return {
    id,
    type: "foundationDynamics",
    position: { x, y },
    data: {
      primitive: "input",
      name,
      inputKind,
      value,
      sliderMin: 0,
      sliderMax: 100,
      actionAmount: 1,
      actionTicks: 10,
      readSinkId,
    },
  };
}

function operatorNode(
  id: string,
  name: string,
  expression: string,
  x: number,
  y: number,
): FoundationDynamicsNode {
  return {
    id,
    type: "foundationDynamics",
    position: { x, y },
    data: { primitive: "operator", name, expression },
  };
}

function sinkNode(
  id: string,
  name: string,
  state: number,
  expression: string,
  x: number,
  y: number,
): FoundationDynamicsNode {
  return {
    id,
    type: "foundationDynamics",
    position: { x, y },
    data: { primitive: "sink", name, state, expression },
  };
}

function createPrimitiveNode(
  primitive: DynamicsPrimitive,
  index: number,
): FoundationDynamicsNode {
  const x = 120 + (index % 4) * 170;
  const y = 120 + Math.floor(index / 4) * 120;
  const id = `${primitive}-${index + 1}`;
  switch (primitive) {
    case "input":
      return inputNode(id, "newInput", "user", 0, undefined, x, y);
    case "operator":
      return operatorNode(id, "newOperator", "a + b", x, y);
    case "sink":
      return sinkNode(id, "newSink", 0, "state + input", x, y);
    default:
      assertNever(primitive);
  }
}

function edge(
  id: string,
  source: string,
  target: string,
  label?: string,
): Edge {
  return {
    id,
    source,
    sourceHandle: "out",
    target,
    targetHandle: "in",
    label,
    type: "smoothstep",
  };
}

function hasEquivalentConnection(
  edges: readonly Edge[],
  connection: {
    readonly source: string | null;
    readonly target: string | null;
    readonly sourceHandle?: string | null;
    readonly targetHandle?: string | null;
  },
): boolean {
  if (connection.source === null || connection.target === null) {
    return false;
  }
  const sourceHandle = connection.sourceHandle ?? "out";
  const targetHandle = connection.targetHandle ?? "in";
  return edges.some(
    (edge) =>
      edge.source === connection.source &&
      edge.target === connection.target &&
      (edge.sourceHandle ?? "out") === sourceHandle &&
      (edge.targetHandle ?? "in") === targetHandle,
  );
}

function nodeSecondaryText(data: FoundationDynamicsNodeData): string {
  if (data.primitive === "input") {
    if (data.inputKind === "read") {
      return data.readSinkId === undefined
        ? "read sink"
        : `read ${data.readSinkId}`;
    }
    return String(data.value ?? 0);
  }
  if (data.primitive === "sink") {
    return `state ${data.state ?? 0}`;
  }
  return "";
}

function incomingNames(
  nodeId: string,
  nodes: readonly FoundationDynamicsNode[],
  edges: readonly Edge[],
): readonly string[] {
  return edges
    .filter((edge) => edge.target === nodeId)
    .map((edge) => nodes.find((node) => node.id === edge.source)?.data.name)
    .filter((name): name is string => name !== undefined);
}

function connectionSummaries(
  nodeId: string,
  direction: "incoming" | "outgoing",
  nodes: readonly FoundationDynamicsNode[],
  edges: readonly Edge[],
): readonly string[] {
  return edges
    .filter((edge) =>
      direction === "incoming"
        ? edge.target === nodeId
        : edge.source === nodeId,
    )
    .map((edge) => {
      const sourceName =
        nodes.find((node) => node.id === edge.source)?.data.name ?? edge.source;
      const targetName =
        nodes.find((node) => node.id === edge.target)?.data.name ?? edge.target;
      return direction === "incoming" ? sourceName : targetName;
    });
}

function sinkNodes(
  nodes: readonly FoundationDynamicsNode[],
): readonly FoundationDynamicsNode[] {
  return nodes.filter((node) => node.data.primitive === "sink");
}

function chartableNodes(
  nodes: readonly FoundationDynamicsNode[],
): readonly FoundationDynamicsNode[] {
  return nodes.filter(
    (node) =>
      node.data.primitive === "sink" || node.data.primitive === "operator",
  );
}

function primitiveCount(
  nodes: readonly FoundationDynamicsNode[],
  primitive: DynamicsPrimitive,
): number {
  return nodes.filter((node) => node.data.primitive === primitive).length;
}

function tabLabel(primitive: DynamicsPrimitive): string {
  switch (primitive) {
    case "input":
      return "Inputs";
    case "operator":
      return "Operators";
    case "sink":
      return "Sinks";
    default:
      assertNever(primitive);
  }
}

function normalizeReadInputs(
  nodes: readonly FoundationDynamicsNode[],
): FoundationDynamicsNode[] {
  const sinks = sinkNodes(nodes);
  const sinkIds = new Set(sinks.map((sink) => sink.id));
  return nodes.map((node) => {
    if (node.data.primitive !== "input" || node.data.inputKind !== "read") {
      return node;
    }
    const readSinkId = node.data.readSinkId;
    if (readSinkId !== undefined && sinkIds.has(readSinkId)) {
      return node;
    }
    if (sinks[0] === undefined) {
      return {
        ...node,
        data: {
          ...node.data,
          inputKind: "user",
          readSinkId: undefined,
          value: node.data.value ?? 0,
        },
      };
    }
    return {
      ...node,
      data: {
        ...node.data,
        readSinkId: sinks[0].id,
      },
    };
  });
}

function initialSimulationState(
  nodes: readonly FoundationDynamicsNode[],
  edges: readonly Edge[],
): SimulationState {
  const sinkStates = initialSinkStates(nodes);
  const values = evaluateNodeValues(nodes, edges, sinkStates);
  const operatorValues = operatorOutputs(nodes, values);
  return {
    running: false,
    tick: 0,
    sinkStates,
    frames: [{ tick: 0, operatorValues, sinkStates }],
  };
}

function initialSinkStates(
  nodes: readonly FoundationDynamicsNode[],
): Readonly<Record<string, number>> {
  const states: Record<string, number> = {};
  for (const node of nodes) {
    if (node.data.primitive === "sink") {
      states[node.id] = node.data.state ?? 0;
    }
  }
  return states;
}

function stepSimulationState(
  current: SimulationState,
  nodes: readonly FoundationDynamicsNode[],
  edges: readonly Edge[],
): SimulationState {
  const values = evaluateNodeValues(nodes, edges, current.sinkStates);
  const sinkStates = evaluateNextSinkStates(
    nodes,
    edges,
    current.sinkStates,
    values,
  );
  const operatorValues = operatorOutputs(nodes, values);
  const tick = current.tick + 1;
  const frame = { tick, operatorValues, sinkStates };
  return {
    running: current.running,
    tick,
    sinkStates,
    frames: [...current.frames, frame].slice(-120),
  };
}

function evaluateNextSinkStates(
  nodes: readonly FoundationDynamicsNode[],
  edges: readonly Edge[],
  currentSinkStates: Readonly<Record<string, number>>,
  values: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> {
  const nextSinkStates: Record<string, number> = {};
  for (const sink of sinkNodes(nodes)) {
    const currentState = currentSinkStates[sink.id] ?? sink.data.state ?? 0;
    const scope = {
      ...incomingScope(sink.id, nodes, edges, values),
      state: currentState,
    };
    nextSinkStates[sink.id] = evaluateExpression(
      sink.data.expression ?? "state",
      scope,
      currentState,
    );
  }
  return nextSinkStates;
}

function evaluateNodeValues(
  nodes: readonly FoundationDynamicsNode[],
  edges: readonly Edge[],
  currentSinkStates: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> {
  const values: Record<string, number> = {};
  for (const node of nodes) {
    if (node.data.primitive !== "input") {
      continue;
    }
    values[node.id] =
      node.data.inputKind === "read"
        ? (currentSinkStates[node.data.readSinkId ?? ""] ?? 0)
        : (node.data.value ?? 0);
  }

  const operators = nodes.filter((node) => node.data.primitive === "operator");
  const pending = new Set(operators.map((node) => node.id));
  for (let pass = 0; pass < operators.length; pass++) {
    let progressed = false;
    for (const operator of operators) {
      if (!pending.has(operator.id)) {
        continue;
      }
      const incomingEdges = edges.filter((edge) => edge.target === operator.id);
      if (!incomingEdges.every((edge) => values[edge.source] !== undefined)) {
        continue;
      }
      values[operator.id] = evaluateExpression(
        operator.data.expression ?? "0",
        incomingScope(operator.id, nodes, edges, values),
        0,
      );
      pending.delete(operator.id);
      progressed = true;
    }
    if (!progressed) {
      break;
    }
  }

  for (const nodeId of pending) {
    values[nodeId] = 0;
  }
  return values;
}

function operatorOutputs(
  nodes: readonly FoundationDynamicsNode[],
  values: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> {
  const outputs: Record<string, number> = {};
  for (const node of nodes) {
    if (node.data.primitive === "operator") {
      outputs[node.id] = values[node.id] ?? 0;
    }
  }
  return outputs;
}

function frameValue(
  frame: SimulationFrame | undefined,
  node: FoundationDynamicsNode,
): number {
  if (frame === undefined) {
    return 0;
  }
  return node.data.primitive === "sink"
    ? (frame.sinkStates[node.id] ?? 0)
    : (frame.operatorValues[node.id] ?? 0);
}

function currentNodeValue(
  node: FoundationDynamicsNode,
  simulation: SimulationState,
): number {
  const frame = simulation.frames[simulation.frames.length - 1];
  if (node.data.primitive === "input") {
    return node.data.inputKind === "read"
      ? (frame?.sinkStates[node.data.readSinkId ?? ""] ?? 0)
      : (node.data.value ?? 0);
  }
  return frameValue(frame, node);
}

function setCurrentSinkState(
  current: SimulationState,
  nodeId: string,
  value: number,
): SimulationState {
  const sinkStates = { ...current.sinkStates, [nodeId]: value };
  const frames = current.frames.map((frame, index) =>
    index === current.frames.length - 1
      ? { ...frame, sinkStates: { ...frame.sinkStates, [nodeId]: value } }
      : frame,
  );
  return {
    ...current,
    sinkStates,
    frames:
      frames.length === 0
        ? [{ tick: current.tick, operatorValues: {}, sinkStates }]
        : frames,
  };
}

function applyInputActions(
  nodes: readonly FoundationDynamicsNode[],
  actions: readonly InputRampAction[],
): {
  readonly nodes: FoundationDynamicsNode[];
  readonly actions: readonly InputRampAction[];
} {
  if (actions.length === 0) {
    return { nodes: [...nodes], actions };
  }
  const nodeIds = new Set(nodes.map((node) => node.id));
  const activeActions = actions.filter(
    (action) => action.remainingTicks > 0 && nodeIds.has(action.nodeId),
  );
  const actionByNodeId = new Map(
    activeActions.map((action) => [action.nodeId, action]),
  );
  const nextNodes = nodes.map((node) => {
    const action = actionByNodeId.get(node.id);
    if (
      action === undefined ||
      node.data.primitive !== "input" ||
      node.data.inputKind === "read"
    ) {
      return node;
    }
    const sliderMin = node.data.sliderMin ?? 0;
    const sliderMax = Math.max(sliderMin, node.data.sliderMax ?? 100);
    const value = clamp(
      (node.data.value ?? 0) + action.deltaPerTick,
      sliderMin,
      sliderMax,
    );
    return {
      ...node,
      data: {
        ...node.data,
        value,
      },
    };
  });
  return {
    nodes: nextNodes,
    actions: activeActions
      .map((action) => ({
        ...action,
        remainingTicks: action.remainingTicks - 1,
      }))
      .filter((action) => action.remainingTicks > 0),
  };
}

function incomingScope(
  nodeId: string,
  nodes: readonly FoundationDynamicsNode[],
  edges: readonly Edge[],
  values: Readonly<Record<string, number>>,
): Record<string, number> {
  const scope: Record<string, number> = {};
  for (const edge of edges.filter((edge) => edge.target === nodeId)) {
    const source = nodes.find((node) => node.id === edge.source);
    if (source === undefined) {
      continue;
    }
    scope[source.data.name] = values[source.id] ?? 0;
  }
  return scope;
}

function evaluateExpression(
  expression: string,
  scope: Readonly<Record<string, number>>,
  fallback: number,
): number {
  try {
    const body = expression.includes("return")
      ? expression
      : `return (${expression});`;
    // User-authored local model expressions are intentionally JavaScript.
    const fn = new Function(
      "scope",
      "clamp",
      "min",
      "max",
      "Math",
      `
      with (scope) {
        ${body}
      }
    `,
    );
    const value = fn(scope, clamp, Math.min, Math.max, Math);
    return typeof value === "number" && Number.isFinite(value)
      ? value
      : fallback;
  } catch {
    return fallback;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function chartColor(index: number): string {
  const colors = [
    "rgb(125, 200, 166)",
    "rgb(230, 191, 99)",
    "rgb(92, 173, 255)",
    "rgb(222, 120, 107)",
  ];
  return colors[index % colors.length];
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function parseNumberInput(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function assertNever(value: never): never {
  throw new Error(`Unsupported dynamics primitive "${String(value)}".`);
}
