import { ValueAddress } from "./ValueAddress";

export interface FlowContributionDiagnostic {
  readonly id: ValueAddress;
  readonly stock: ValueAddress;
  readonly amount: number;
}

export interface StockUpdateDiagnostic {
  readonly stock: ValueAddress;
  readonly before: number;
  readonly delta: number;
  readonly unclampedAfter: number;
  readonly after: number;
  readonly clamped: boolean;
}

export interface StockFlowDiagnostics {
  readonly outputs: Record<ValueAddress, number | boolean | string>;
  readonly flows: readonly FlowContributionDiagnostic[];
  readonly stocks: readonly StockUpdateDiagnostic[];
}
