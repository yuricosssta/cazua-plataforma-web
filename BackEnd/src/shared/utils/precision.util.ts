// src/shared/utils/precision.util.ts
export class Precision {
  static round(value: number, decimals: number = 2): number {
    if (typeof value !== 'number' || isNaN(value)) return 0;
    const factor = Math.pow(10, decimals);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }
}