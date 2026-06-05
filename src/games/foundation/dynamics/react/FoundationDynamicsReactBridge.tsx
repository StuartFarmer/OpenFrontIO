import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Connection,
  type ConnectionLineComponentProps,
  type Edge,
  type EdgeChange,
  type IsValidConnection,
  type NodeChange,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { createRoot, type Root } from "react-dom/client";
import {
  hasEquivalentConnection,
  type FoundationDynamicsNode,
  type FoundationDynamicsNodeData,
} from "../FoundationDynamicsModel";

export interface FoundationDynamicsReactBridgeProps {
  readonly nodes: FoundationDynamicsNode[];
  readonly edges: Edge[];
  readonly onNodesChange: (
    changes: NodeChange<FoundationDynamicsNode>[],
  ) => void;
  readonly onEdgesChange: (changes: EdgeChange<Edge>[]) => void;
  readonly onConnect: (connection: Connection) => void;
  readonly onNodeClick: (node: FoundationDynamicsNode) => void;
  readonly onEdgeClick: (edge: Edge) => void;
  readonly onPaneClick: () => void;
}

const nodeTypes = {
  foundationDynamics: FoundationDynamicsNodeView,
};

export class FoundationDynamicsReactBridge {
  private readonly root: Root;
  private props: FoundationDynamicsReactBridgeProps;

  constructor(
    container: HTMLElement,
    props: FoundationDynamicsReactBridgeProps,
  ) {
    this.root = createRoot(container);
    this.props = props;
    this.render();
  }

  update(props: FoundationDynamicsReactBridgeProps): void {
    this.props = props;
    this.render();
  }

  unmount(): void {
    this.root.unmount();
  }

  private render(): void {
    this.root.render(<FoundationDynamicsFlowCanvas {...this.props} />);
  }
}

function FoundationDynamicsFlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onEdgeClick,
  onPaneClick,
}: FoundationDynamicsReactBridgeProps) {
  const isValidConnection: IsValidConnection = (connection) =>
    connection.source !== null &&
    connection.target !== null &&
    connection.source !== connection.target &&
    (connection.sourceHandle ?? "out") === "out" &&
    (connection.targetHandle ?? "in") === "in" &&
    !hasEquivalentConnection(edges, connection);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      isValidConnection={isValidConnection}
      connectionLineComponent={FoundationDynamicsConnectionLine}
      onNodeClick={(_, node) => onNodeClick(node)}
      onEdgeClick={(_, edge) => onEdgeClick(edge)}
      onPaneClick={onPaneClick}
      defaultEdgeOptions={{
        type: "smoothstep",
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
