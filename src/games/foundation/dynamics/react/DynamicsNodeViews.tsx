import type { NodeProps } from "@xyflow/react";
import type { DynamicsNodeType } from "../../../../core/systems/dynamics";

export interface DynamicsNodeViewData extends Record<string, unknown> {
  readonly label: string;
  readonly nodeType: DynamicsNodeType;
}

export const dynamicsNodeTypes = {
  dynamics: DynamicsNodeView,
};

function DynamicsNodeView({ data }: NodeProps) {
  const viewData = data as DynamicsNodeViewData;
  return (
    <div
      className="foundation-dynamics-node"
      data-node-type={viewData.nodeType}
    >
      <strong>{viewData.label}</strong>
      <span>{viewData.nodeType}</span>
    </div>
  );
}
