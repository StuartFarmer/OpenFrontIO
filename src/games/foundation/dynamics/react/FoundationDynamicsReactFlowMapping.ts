import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  MarkerType,
  Position,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeHandle,
} from "@xyflow/react";
import type { DynamicsSavedSystem } from "../../../../core/systems/dynamics";
import {
  hasEquivalentConnection,
  savedDynamicsSystemFromSchema,
  savedDynamicsSystemToSchema,
  type FoundationDynamicsConnection,
  type FoundationDynamicsEdge,
  type FoundationDynamicsNode,
  type FoundationDynamicsNodeData,
} from "../FoundationDynamicsModel";

export type FoundationDynamicsReactFlowNode = Node<FoundationDynamicsNodeData>;
export type FoundationDynamicsReactFlowEdge = Edge;

export interface FoundationDynamicsReactFlowGraph {
  readonly nodes: readonly FoundationDynamicsReactFlowNode[];
  readonly edges: readonly FoundationDynamicsReactFlowEdge[];
}

export function foundationNodesToReactFlow(
  nodes: readonly FoundationDynamicsNode[],
): FoundationDynamicsReactFlowNode[] {
  return nodes.map(foundationNodeToReactFlow);
}

export function foundationEdgesToReactFlow(
  edges: readonly FoundationDynamicsEdge[],
): FoundationDynamicsReactFlowEdge[] {
  return edges.map(foundationEdgeToReactFlow);
}

export function reactFlowNodesToFoundation(
  nodes: readonly FoundationDynamicsReactFlowNode[],
): FoundationDynamicsNode[] {
  return nodes.map(reactFlowNodeToFoundation);
}

export function reactFlowEdgesToFoundation(
  edges: readonly FoundationDynamicsReactFlowEdge[],
): FoundationDynamicsEdge[] {
  return edges.map(reactFlowEdgeToFoundation);
}

export function dynamicsSystemToReactFlowGraph(
  system: DynamicsSavedSystem,
): FoundationDynamicsReactFlowGraph {
  const editorSystem = savedDynamicsSystemFromSchema(system);
  return {
    nodes: foundationNodesToReactFlow(editorSystem.nodes),
    edges: foundationEdgesToReactFlow(editorSystem.edges),
  };
}

export function reactFlowGraphToDynamicsSystem(
  template: DynamicsSavedSystem,
  graph: FoundationDynamicsReactFlowGraph,
): DynamicsSavedSystem {
  const editorSystem = savedDynamicsSystemFromSchema(template);
  return savedDynamicsSystemToSchema({
    ...editorSystem,
    nodes: reactFlowNodesToFoundation(graph.nodes),
    edges: reactFlowEdgesToFoundation(graph.edges),
  });
}

export function applyReactFlowNodeChanges(
  nodes: readonly FoundationDynamicsNode[],
  changes: readonly NodeChange<FoundationDynamicsReactFlowNode>[],
): FoundationDynamicsNode[] {
  return reactFlowNodesToFoundation(
    applyNodeChanges(
      [...changes],
      foundationNodesToReactFlow(nodes),
    ) as FoundationDynamicsReactFlowNode[],
  );
}

export function applyReactFlowEdgeChanges(
  edges: readonly FoundationDynamicsEdge[],
  changes: readonly EdgeChange<FoundationDynamicsReactFlowEdge>[],
): FoundationDynamicsEdge[] {
  return reactFlowEdgesToFoundation(
    applyEdgeChanges(
      [...changes],
      foundationEdgesToReactFlow(edges),
    ) as FoundationDynamicsReactFlowEdge[],
  );
}

export function foundationEdgeFromConnection(
  connection: FoundationDynamicsConnection,
  existingEdges: readonly FoundationDynamicsEdge[],
): FoundationDynamicsEdge | null {
  if (connection.source === null || connection.target === null) {
    return null;
  }
  const edge = reactFlowEdgeToFoundation({
    id: `edge-${connection.source}-${connection.target}-${existingEdges.length}`,
    source: connection.source,
    sourceHandle: connection.sourceHandle ?? "out",
    target: connection.target,
    targetHandle: connection.targetHandle ?? "in",
    type: "smoothstep",
  });
  if (hasEquivalentConnection(existingEdges, edge)) {
    return null;
  }
  return edge;
}

export function addFoundationConnection(
  edges: readonly FoundationDynamicsEdge[],
  connection: Connection,
): FoundationDynamicsEdge[] {
  const edge = foundationEdgeFromConnection(connection, edges);
  if (edge === null) {
    return [...edges];
  }
  return reactFlowEdgesToFoundation(
    addEdge(foundationEdgeToReactFlow(edge), foundationEdgesToReactFlow(edges)),
  );
}

export function isValidFoundationConnection(
  edges: readonly FoundationDynamicsEdge[],
  connection: FoundationDynamicsConnection,
): boolean {
  return (
    connection.source !== null &&
    connection.target !== null &&
    connection.source !== connection.target &&
    foundationEdgeFromConnection(connection, edges) !== null
  );
}

function foundationNodeToReactFlow(
  node: FoundationDynamicsNode,
): FoundationDynamicsReactFlowNode {
  const dimensions = foundationNodeDimensions(node);
  return {
    id: node.id,
    type: node.type ?? "foundationDynamics",
    position: { x: node.position.x, y: node.position.y },
    data: { ...node.data },
    selected: node.selected,
    connectable: true,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    initialWidth: dimensions.width,
    initialHeight: dimensions.height,
    measured: dimensions,
    handles: foundationNodeHandles(node, dimensions),
    style: {
      width: dimensions.width,
      minHeight: dimensions.height,
    },
  };
}

function foundationNodeDimensions(node: FoundationDynamicsNode): {
  readonly width: number;
  readonly height: number;
} {
  switch (node.data.primitive) {
    case "input":
      return { width: 178, height: 88 };
    case "operator":
      return { width: 202, height: 104 };
    case "sink":
      return { width: 202, height: 104 };
  }
}

function foundationNodeHandles(
  node: FoundationDynamicsNode,
  dimensions: { readonly width: number; readonly height: number },
): NodeHandle[] {
  const handles: NodeHandle[] = [];
  const handleSize = 12;
  const handleY =
    dimensions.height / 2 -
    handleSize / 2 +
    visualHandleYOffset(node.data.primitive);

  if (node.data.primitive !== "input") {
    handles.push({
      id: "in",
      type: "target",
      position: Position.Left,
      x: -handleSize / 2,
      y: handleY,
      width: handleSize,
      height: handleSize,
    });
  }
  if (node.data.primitive !== "sink") {
    handles.push({
      id: "out",
      type: "source",
      position: Position.Right,
      x: dimensions.width - handleSize / 2,
      y: handleY,
      width: handleSize,
      height: handleSize,
    });
  }
  return handles;
}

function visualHandleYOffset(
  primitive: FoundationDynamicsNodeData["primitive"],
) {
  return primitive === "operator" ? -7 : 0;
}

export function reactFlowNodeToFoundation(
  node: FoundationDynamicsReactFlowNode,
): FoundationDynamicsNode {
  return {
    id: node.id,
    type: node.type,
    position: { x: node.position.x, y: node.position.y },
    data: { ...node.data },
    selected: node.selected,
  };
}

function foundationEdgeToReactFlow(
  edge: FoundationDynamicsEdge,
): FoundationDynamicsReactFlowEdge {
  return {
    id: edge.id,
    source: edge.source,
    sourceHandle: edge.sourceHandle ?? "out",
    target: edge.target,
    targetHandle: edge.targetHandle ?? "in",
    label: reactFlowEdgeLabel(edge.label),
    type: edge.type ?? "smoothstep",
    data:
      edge.data === undefined
        ? undefined
        : { ...(edge.data as Record<string, unknown>) },
    selected: edge.selected,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: "rgb(125, 200, 166)", strokeWidth: 2 },
  };
}

function reactFlowEdgeLabel(
  label: FoundationDynamicsEdge["label"],
): string | number | undefined {
  if (typeof label === "string" || typeof label === "number") {
    return label;
  }
  return undefined;
}

export function reactFlowEdgeToFoundation(
  edge: FoundationDynamicsReactFlowEdge,
): FoundationDynamicsEdge {
  return {
    id: edge.id,
    source: edge.source,
    sourceHandle: edge.sourceHandle ?? "out",
    target: edge.target,
    targetHandle: edge.targetHandle ?? "in",
    label: edge.label,
    type: edge.type,
    data: edge.data,
    selected: edge.selected,
  };
}
