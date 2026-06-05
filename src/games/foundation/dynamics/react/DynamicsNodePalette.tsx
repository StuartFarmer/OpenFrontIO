import {
  DYNAMICS_NODE_TYPES,
  type DynamicsNodeType,
} from "../../../../core/systems/dynamics";

export interface DynamicsNodePaletteProps {
  readonly onAddNode: (type: DynamicsNodeType) => void;
}

export function DynamicsNodePalette({ onAddNode }: DynamicsNodePaletteProps) {
  return (
    <div
      className="foundation-dynamics-palette"
      aria-label="Dynamics node palette"
    >
      {DYNAMICS_NODE_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          data-add-node-type={type}
          onClick={() => onAddNode(type)}
        >
          {type}
        </button>
      ))}
    </div>
  );
}
