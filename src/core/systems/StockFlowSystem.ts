import { ValueAddress } from "./ValueAddress";

export type StockFlowScalar = number | boolean | string;
export type StockFlowPhase =
  | "produce"
  | "consume"
  | "derive"
  | "births"
  | "deaths"
  | "clamp"
  | "diagnostics";

export type StockFlowParams = Record<string, number>;
export type StockFlowInputs = Partial<Record<ValueAddress, StockFlowScalar>>;
export type StockFlowStockState = Partial<Record<ValueAddress, number>>;

export interface EvaluationContext {
  getNumber(address: ValueAddress): number;
  getBoolean(address: ValueAddress): boolean;
  getString(address: ValueAddress): string;
  readonly params: StockFlowParams;
  readonly tick: number;
  readonly player?: unknown;
  readonly game?: unknown;
}

export type NumericExpression = (ctx: EvaluationContext) => number;
export type BooleanExpression = (ctx: EvaluationContext) => boolean;
export type StringExpression = (ctx: EvaluationContext) => string;
export type ScalarExpression =
  | NumericExpression
  | BooleanExpression
  | StringExpression;

export interface StockDefinition {
  readonly initial: number | NumericExpression;
  readonly min?: number | NumericExpression;
  readonly max?: number | NumericExpression;
  readonly unit?: string;
}

export interface ParameterDefinition {
  readonly value: number;
  readonly unit?: string;
}

export type AuxiliaryDefinitions = Record<ValueAddress, ScalarExpression>;
export type OutputDefinitions = Record<ValueAddress, ScalarExpression>;

export interface FlowDefinition {
  readonly stock: ValueAddress;
  readonly amount: NumericExpression;
  readonly phase?: StockFlowPhase;
  readonly unit?: string;
}

export type StockDefinitions = Record<ValueAddress, StockDefinition>;
export type ParameterDefinitions = Record<string, ParameterDefinition>;
export type FlowDefinitions = Record<ValueAddress, FlowDefinition>;

export interface StockFlowSystem {
  readonly id: string;
  readonly reads?: readonly ValueAddress[];
  readonly stocks?: StockDefinitions;
  readonly parameters?: ParameterDefinitions;
  readonly auxiliaries?: AuxiliaryDefinitions;
  readonly outputs?: OutputDefinitions;
  readonly flows?: FlowDefinitions;
}

export interface StockFlowModel {
  readonly id: string;
  readonly systems: readonly StockFlowSystem[];
  readonly externalInputs?: readonly ValueAddress[];
}
