import type { Resolution } from '../enums/CountType';

export interface VarianceRecord {
  id: string;
  countPlanId: string;
  productId: string;
  productCode: string;
  locationId: string;
  locationCode: string;
  systemQty: number;
  finalCountedQty: number;
  varianceQty: number;
  variancePercent: number;
  varianceValue?: number;
  resolution: Resolution;
  adjustmentApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  rootCause?: string;
  requiresRecount: boolean;
  recountRound?: number;
  aiRecommendation?: string;
  aiConfidence?: number;
  createdAt: string;
  updatedAt: string;
}
