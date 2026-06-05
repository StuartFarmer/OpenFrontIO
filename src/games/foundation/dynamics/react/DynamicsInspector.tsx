import type {
  DynamicsNode,
  DynamicsNodeId,
  DynamicsSystemDefinition,
} from "../../../../core/systems/dynamics";

export interface DynamicsInspectorProps {
  readonly system: DynamicsSystemDefinition;
  readonly selectedNodeId: DynamicsNodeId | null;
  readonly onSystemChange?: (system: DynamicsSystemDefinition) => void;
}

export function DynamicsInspector({
  system,
  selectedNodeId,
  onSystemChange,
}: DynamicsInspectorProps) {
  const node = system.nodes.find((node) => node.id === selectedNodeId);
  if (node === undefined) {
    return (
      <aside className="foundation-dynamics-inspector">
        <h2>Inspector</h2>
        <p>Select a node.</p>
      </aside>
    );
  }

  const emit = (nextNode: DynamicsNode) =>
    onSystemChange?.(replaceDynamicsNode(system, nextNode));

  return (
    <aside className="foundation-dynamics-inspector">
      <h2>Inspector</h2>
      <label>
        <span>Name</span>
        <input
          data-inspector-name
          value={node.name}
          onChange={(event) =>
            emit(updateDynamicsNodeName(node, event.currentTarget.value))
          }
        />
      </label>
      <p className="node-id">{node.id}</p>
      {renderConfigFields(node, emit)}
    </aside>
  );
}

export function updateDynamicsNodeName(
  node: DynamicsNode,
  name: string,
): DynamicsNode {
  return {
    ...node,
    name,
  } as DynamicsNode;
}

export function updateDynamicsNodeConfig(
  node: DynamicsNode,
  patch: Partial<DynamicsNode["config"]>,
): DynamicsNode {
  return {
    ...node,
    config: {
      ...node.config,
      ...patch,
    },
  } as DynamicsNode;
}

export function replaceDynamicsNode(
  system: DynamicsSystemDefinition,
  nextNode: DynamicsNode,
): DynamicsSystemDefinition {
  return {
    ...system,
    nodes: system.nodes.map((node) =>
      node.id === nextNode.id ? nextNode : node,
    ),
  };
}

function renderConfigFields(
  node: DynamicsNode,
  emit: (node: DynamicsNode) => void,
) {
  switch (node.type) {
    case "input":
    case "parameter":
      return (
        <NumberField
          label="Value"
          value={node.config.value}
          onChange={(value) => emit(updateDynamicsNodeConfig(node, { value }))}
        />
      );
    case "math":
      return (
        <label>
          <span>Operation</span>
          <select
            data-inspector-operation
            value={node.config.operation}
            onChange={(event) =>
              emit(
                updateDynamicsNodeConfig(node, {
                  operation: event.currentTarget.value as never,
                }),
              )
            }
          >
            {[
              "add",
              "subtract",
              "multiply",
              "divide",
              "power",
              "min",
              "max",
              "clamp",
            ].map((operation) => (
              <option key={operation} value={operation}>
                {operation}
              </option>
            ))}
          </select>
        </label>
      );
    case "activation":
      return (
        <>
          <label>
            <span>Function</span>
            <select
              data-inspector-activation
              value={node.config.function}
              onChange={(event) =>
                emit(
                  updateDynamicsNodeConfig(node, {
                    function: event.currentTarget.value as never,
                  }),
                )
              }
            >
              {["linear", "logistic", "power", "step"].map((fn) => (
                <option key={fn} value={fn}>
                  {fn}
                </option>
              ))}
            </select>
          </label>
          <NumberField
            label="Min"
            value={node.config.min ?? 0}
            onChange={(min) => emit(updateDynamicsNodeConfig(node, { min }))}
          />
          <NumberField
            label="Max"
            value={node.config.max ?? 1}
            onChange={(max) => emit(updateDynamicsNodeConfig(node, { max }))}
          />
          <NumberField
            label="K"
            value={node.config.k ?? 1}
            onChange={(k) => emit(updateDynamicsNodeConfig(node, { k }))}
          />
        </>
      );
    case "flow":
      return (
        <label>
          <span>Direction</span>
          <select
            data-inspector-direction
            value={node.config.direction}
            onChange={(event) =>
              emit(
                updateDynamicsNodeConfig(node, {
                  direction: event.currentTarget.value as never,
                }),
              )
            }
          >
            <option value="inflow">inflow</option>
            <option value="outflow">outflow</option>
          </select>
        </label>
      );
    case "stock":
      return (
        <>
          <NumberField
            label="Initial"
            value={node.config.initialValue}
            onChange={(initialValue) =>
              emit(updateDynamicsNodeConfig(node, { initialValue }))
            }
          />
          <NumberField
            label="Min"
            value={node.config.min ?? 0}
            onChange={(min) => emit(updateDynamicsNodeConfig(node, { min }))}
          />
          <NumberField
            label="Max"
            value={node.config.max ?? 0}
            onChange={(max) => emit(updateDynamicsNodeConfig(node, { max }))}
          />
        </>
      );
    case "probe":
      return (
        <label className="inline-field">
          <input
            data-inspector-charted
            type="checkbox"
            checked={node.config.charted === true}
            onChange={(event) =>
              emit(
                updateDynamicsNodeConfig(node, {
                  charted: event.currentTarget.checked,
                }),
              )
            }
          />
          <span>Charted</span>
        </label>
      );
    default:
      assertNever(node);
  }
}

function NumberField({
  label,
  value,
  onChange,
}: {
  readonly label: string;
  readonly value: number;
  readonly onChange: (value: number) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <input
        data-inspector-number={label}
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  );
}

function assertNever(value: never): never {
  throw new Error(`Unsupported dynamics node "${String(value)}".`);
}
