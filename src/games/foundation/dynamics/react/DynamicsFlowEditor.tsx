import {
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import { useState } from "react";
import {
  DYNAMICS_SYSTEM_SCHEMA_VERSION,
  type DynamicsNode,
  type DynamicsNodeType,
  type DynamicsSystemDefinition,
} from "../../../../core/systems/dynamics";
import { DynamicsInspector } from "./DynamicsInspector";
import { DynamicsNodePalette } from "./DynamicsNodePalette";
import {
  dynamicsNodeTypes,
  type DynamicsNodeViewData,
} from "./DynamicsNodeViews";

export interface DynamicsFlowEditorProps {
  readonly system: DynamicsSystemDefinition;
  readonly onSystemChange?: (system: DynamicsSystemDefinition) => void;
}

export function DynamicsFlowEditor({
  system,
  onSystemChange,
}: DynamicsFlowEditorProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  return (
    <div className="foundation-dynamics-react-editor">
      <DynamicsNodePalette
        onAddNode={(type) =>
          onSystemChange?.(addDynamicsNodeToSystem(system, type))
        }
      />
      <div className="foundation-dynamics-editor-body">
        <ReactFlow
          nodes={dynamicsSystemToReactFlowNodes(system)}
          edges={dynamicsSystemToReactFlowEdges(system)}
          nodeTypes={dynamicsNodeTypes}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
        <DynamicsInspector
          system={system}
          selectedNodeId={selectedNodeId}
          onSystemChange={onSystemChange}
        />
      </div>
    </div>
  );
}

export function dynamicsSystemToReactFlowNodes(
  system: DynamicsSystemDefinition,
): Node<DynamicsNodeViewData>[] {
  return system.nodes.map((node) => ({
    id: node.id,
    type: "dynamics",
    position: node.position,
    data: {
      label: node.name,
      nodeType: node.type,
    },
  }));
}

export function dynamicsSystemToReactFlowEdges(
  system: DynamicsSystemDefinition,
): Edge[] {
  return system.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
  }));
}

export function addDynamicsNodeToSystem(
  system: DynamicsSystemDefinition,
  type: DynamicsNodeType,
): DynamicsSystemDefinition {
  const id = uniqueNodeId(
    type,
    system.nodes.map((node) => node.id),
  );
  const node: DynamicsNode = {
    id,
    type,
    name: id,
    position: {
      x: 80 + system.nodes.length * 24,
      y: 80 + system.nodes.length * 18,
    },
    config: defaultNodeConfig(type),
  } as DynamicsNode;

  return {
    ...system,
    version: DYNAMICS_SYSTEM_SCHEMA_VERSION,
    nodes: [...system.nodes, node],
  };
}

function defaultNodeConfig(type: DynamicsNodeType): DynamicsNode["config"] {
  switch (type) {
    case "input":
    case "parameter":
      return { value: 0, min: 0, max: 100, step: 1 };
    case "math":
      return { operation: "add" };
    case "activation":
      return { function: "linear", min: 0, max: 1 };
    case "flow":
      return { direction: "inflow" };
    case "stock":
      return { initialValue: 0, min: 0 };
    case "probe":
      return { charted: true };
    default:
      assertNever(type);
  }
}

function uniqueNodeId(
  type: DynamicsNodeType,
  existingIds: readonly string[],
): string {
  const existing = new Set(existingIds);
  if (!existing.has(type)) {
    return type;
  }
  let suffix = 2;
  while (existing.has(`${type}-${suffix}`)) {
    suffix++;
  }
  return `${type}-${suffix}`;
}

function assertNever(value: never): never {
  throw new Error(`Unsupported dynamics node type "${String(value)}".`);
}
