export type ValueAddress = `${string}.${string}`;

export function isValueAddress(value: string): value is ValueAddress {
  const parts = value.split(".");
  return parts.length >= 2 && parts.every((part) => part.length > 0);
}

export function assertValueAddress(
  value: string,
): asserts value is ValueAddress {
  if (!isValueAddress(value)) {
    throw new StockFlowAddressError(
      `Invalid stock-flow value address "${value}". Expected "system.value".`,
    );
  }
}

export class StockFlowAddressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockFlowAddressError";
  }
}
