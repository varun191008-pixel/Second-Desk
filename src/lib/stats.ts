/**
 * Statistical and mathematical utility functions.
 */

export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

export function sampleStdev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((acc, val) => acc + (val - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

export function tanh(x: number): number {
  return Math.tanh(x);
}

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}
