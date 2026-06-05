export interface LogisticProductionModifier {
  min: number;
  max: number;
  k: number;
}

export function applyLogisticProductionModifier(
  input: number,
  modifier: LogisticProductionModifier,
): number {
  const x = clamp01(input);
  const min = finiteOr(modifier.min, 0);
  const max = finiteOr(modifier.max, min);
  const t = normalizedLogistic01(x, modifier.k);
  return min + (max - min) * t;
}

export function normalizedLogistic01(input: number, k: number): number {
  const x = clamp01(input);
  const sharpness = Math.max(0, finiteOr(k, 0));
  if (sharpness === 0) {
    return x;
  }

  const left = logistic(-sharpness / 2);
  const right = logistic(sharpness / 2);
  return (logistic(sharpness * (x - 0.5)) - left) / (right - left);
}

function logistic(value: number): number {
  return 1 / (1 + Math.exp(-value));
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}
