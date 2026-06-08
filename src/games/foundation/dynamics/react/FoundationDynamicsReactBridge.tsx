import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type ConnectionLineComponentProps,
  type IsValidConnection,
  type NodeChange,
  type NodeProps,
  type OnNodeDrag,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import type {
  FoundationDynamicsEdge,
  FoundationDynamicsNode,
  FoundationDynamicsNodeData,
} from "../FoundationDynamicsModel";
import {
  applyReactFlowEdgeChanges,
  applyReactFlowNodeChanges,
  foundationEdgeFromConnection,
  foundationEdgesToReactFlow,
  foundationNodesToReactFlow,
  isValidFoundationConnection,
  reactFlowEdgesToFoundation,
  reactFlowEdgeToFoundation,
  reactFlowNodesToFoundation,
  reactFlowNodeToFoundation,
  type FoundationDynamicsReactFlowEdge,
  type FoundationDynamicsReactFlowNode,
} from "./FoundationDynamicsReactFlowMapping";

export interface FoundationDynamicsReactBridgeProps {
  readonly nodes: FoundationDynamicsNode[];
  readonly edges: FoundationDynamicsEdge[];
  readonly onNodesChange: (
    update: (
      nodes: readonly FoundationDynamicsNode[],
    ) => FoundationDynamicsNode[],
  ) => void;
  readonly onEdgesChange: (
    update: (
      edges: readonly FoundationDynamicsEdge[],
    ) => FoundationDynamicsEdge[],
  ) => void;
  readonly onConnect: (edge: FoundationDynamicsEdge) => void;
  readonly onNodeClick: (node: FoundationDynamicsNode) => void;
  readonly onEdgeClick: (edge: FoundationDynamicsEdge) => void;
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
  const [flowNodes, setFlowNodes] = useState(() =>
    foundationNodesToReactFlow(nodes),
  );
  const [flowEdges, setFlowEdges] = useState(() =>
    foundationEdgesToReactFlow(edges),
  );
  const flowNodesRef = useRef(flowNodes);
  const flowEdgesRef = useRef(flowEdges);
  const reactFlowRef = useRef<ReactFlowInstance<
    FoundationDynamicsReactFlowNode,
    FoundationDynamicsReactFlowEdge
  > | null>(null);
  const draggingRef = useRef(false);
  const nodeIdentityRef = useRef(nodeIdentity(nodes));

  const scheduleFitView = useCallback(() => {
    if (draggingRef.current || flowNodesRef.current.length === 0) {
      return;
    }
    const fit = () => {
      void reactFlowRef.current?.fitView({
        padding: 0.2,
        duration: 120,
      });
    };
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(fit);
      return;
    }
    setTimeout(fit, 0);
  }, []);

  useEffect(() => {
    const nextNodes = foundationNodesToReactFlow(nodes);
    const nextNodeIdentity = nodeIdentity(nodes);
    const shouldFit = nodeIdentityRef.current !== nextNodeIdentity;
    nodeIdentityRef.current = nextNodeIdentity;
    flowNodesRef.current = nextNodes;
    setFlowNodes(nextNodes);
    if (shouldFit) {
      scheduleFitView();
    }
  }, [nodes, scheduleFitView]);

  useEffect(() => {
    const nextEdges = foundationEdgesToReactFlow(edges);
    flowEdgesRef.current = nextEdges;
    setFlowEdges(nextEdges);
  }, [edges]);

  const commitNodes = useCallback(
    (nextNodes: readonly FoundationDynamicsReactFlowNode[]) => {
      onNodesChange(() => reactFlowNodesToFoundation(nextNodes));
    },
    [onNodesChange],
  );

  const commitEdges = useCallback(
    (nextEdges: readonly FoundationDynamicsReactFlowEdge[]) => {
      onEdgesChange(() => reactFlowEdgesToFoundation(nextEdges));
    },
    [onEdgesChange],
  );

  const isValidConnection: IsValidConnection = (connection) =>
    isValidFoundationConnection(
      reactFlowEdgesToFoundation(flowEdgesRef.current),
      connection,
    );
  const handleNodesChange = useCallback(
    (changes: NodeChange<FoundationDynamicsReactFlowNode>[]) => {
      const nextNodes = applyReactFlowNodeChanges(
        reactFlowNodesToFoundation(flowNodesRef.current),
        changes,
      );
      const nextFlowNodes = foundationNodesToReactFlow(nextNodes);
      flowNodesRef.current = nextFlowNodes;
      setFlowNodes(nextFlowNodes);
      if (shouldCommitNodeChanges(changes)) {
        commitNodes(nextFlowNodes);
      }
    },
    [commitNodes],
  );
  const handleNodeDragStop: OnNodeDrag<FoundationDynamicsReactFlowNode> =
    useCallback(
      (_event, _node, draggedNodes) => {
        draggingRef.current = false;
        const draggedNodeIds = new Set(draggedNodes.map((node) => node.id));
        const mergedNodes = flowNodesRef.current.map((node) => {
          const draggedNode = draggedNodes.find(
            (candidate) => candidate.id === node.id,
          );
          return draggedNodeIds.has(node.id) && draggedNode !== undefined
            ? draggedNode
            : node;
        });
        flowNodesRef.current = mergedNodes;
        setFlowNodes(mergedNodes);
        commitNodes(mergedNodes);
      },
      [commitNodes],
    );
  const handleNodeDragStart: OnNodeDrag<FoundationDynamicsReactFlowNode> =
    useCallback(() => {
      draggingRef.current = true;
    }, []);
  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof applyReactFlowEdgeChanges>[1]) => {
      const nextEdges = applyReactFlowEdgeChanges(
        reactFlowEdgesToFoundation(flowEdgesRef.current),
        changes,
      );
      const nextFlowEdges = foundationEdgesToReactFlow(nextEdges);
      flowEdgesRef.current = nextFlowEdges;
      setFlowEdges(nextFlowEdges);
      commitEdges(nextFlowEdges);
    },
    [commitEdges],
  );

  return (
    <ReactFlow
      nodes={flowNodes}
      edges={flowEdges}
      nodeTypes={nodeTypes}
      onInit={(instance) => {
        reactFlowRef.current = instance;
        scheduleFitView();
      }}
      onNodesChange={handleNodesChange}
      onEdgesChange={handleEdgesChange}
      onNodeDragStart={handleNodeDragStart}
      onNodeDragStop={handleNodeDragStop}
      onConnect={(connection) => {
        const currentEdges = reactFlowEdgesToFoundation(flowEdgesRef.current);
        const edge = foundationEdgeFromConnection(connection, currentEdges);
        if (edge !== null) {
          const nextFlowEdges = foundationEdgesToReactFlow([
            ...currentEdges,
            edge,
          ]);
          flowEdgesRef.current = nextFlowEdges;
          setFlowEdges(nextFlowEdges);
          onConnect(edge);
        }
      }}
      isValidConnection={isValidConnection}
      connectionLineComponent={FoundationDynamicsConnectionLine}
      onNodeClick={(_, node) => onNodeClick(reactFlowNodeToFoundation(node))}
      onEdgeClick={(_, edge) => onEdgeClick(reactFlowEdgeToFoundation(edge))}
      onPaneClick={onPaneClick}
      defaultEdgeOptions={{
        type: "smoothstep",
        style: { stroke: "rgb(125, 200, 166)", strokeWidth: 2 },
      }}
      defaultViewport={{ x: 0, y: 0, zoom: 1 }}
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

function nodeIdentity(nodes: readonly FoundationDynamicsNode[]): string {
  return nodes.map((node) => node.id).join("|");
}

function shouldCommitNodeChanges(
  changes: readonly NodeChange<FoundationDynamicsReactFlowNode>[],
): boolean {
  return changes.some((change) => {
    if (change.type === "position") {
      return change.dragging !== true;
    }
    return change.type !== "select" && change.type !== "dimensions";
  });
}

function FoundationDynamicsConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  connectionStatus,
}: ConnectionLineComponentProps<FoundationDynamicsReactFlowNode>) {
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
  isConnectable,
}: NodeProps<FoundationDynamicsReactFlowNode>) {
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
          isConnectable={isConnectable}
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
          isConnectable={isConnectable}
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
