export function toIQD(value: number): number {
  if (!Number.isFinite(value)) return 0;
  // IQD is a zero-decimal currency; normalize to nearest integer
  return Math.round(value);
}


