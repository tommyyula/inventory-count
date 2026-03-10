export function calculateVarianceQty(systemQty: number, countedQty: number): number {
  return countedQty - systemQty;
}

export function calculateVariancePercent(systemQty: number, countedQty: number): number {
  if (systemQty === 0) {
    return countedQty === 0 ? 0 : 100;
  }
  return ((countedQty - systemQty) / systemQty) * 100;
}

export function calculateVarianceValue(varianceQty: number, unitCost: number): number {
  return varianceQty * unitCost;
}

export function isWithinTolerance(variancePercent: number, tolerancePercent: number): boolean {
  return Math.abs(variancePercent) <= tolerancePercent;
}

export type VarianceLevel = 'match' | 'within' | 'exceed';

export function getVarianceLevel(variancePercent: number, tolerancePercent: number): VarianceLevel {
  if (variancePercent === 0) return 'match';
  if (Math.abs(variancePercent) <= tolerancePercent) return 'within';
  return 'exceed';
}

export function getVarianceColor(level: VarianceLevel): string {
  switch (level) {
    case 'match': return '#52c41a';
    case 'within': return '#faad14';
    case 'exceed': return '#ff4d4f';
  }
}
