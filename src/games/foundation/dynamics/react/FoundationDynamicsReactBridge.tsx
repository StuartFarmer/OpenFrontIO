import "@xyflow/react/dist/style.css";
import { createRoot, type Root } from "react-dom/client";
import type { DynamicsSystemDefinition } from "../../../../core/systems/dynamics";
import { DynamicsFlowEditor } from "./DynamicsFlowEditor";

export interface FoundationDynamicsReactBridgeProps {
  readonly system: DynamicsSystemDefinition;
  readonly onSystemChange?: (system: DynamicsSystemDefinition) => void;
}

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

  emitSystemChange(system: DynamicsSystemDefinition): void {
    this.props.onSystemChange?.(system);
  }

  unmount(): void {
    this.root.unmount();
  }

  private render(): void {
    this.root.render(<DynamicsFlowEditor {...this.props} />);
  }
}
