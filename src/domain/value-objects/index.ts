import type { LocationType } from '../enums';

export interface LocationInfo {
  locationId: string;
  locationCode: string;
  zone: string;
  aisle: string;
  rack: string;
  level: string;
  position: string;
  locationType: LocationType;
  isActive: boolean;
}

export interface ProductInfo {
  productId: string;
  productCode: string;
  productName: string;
  barcode: string;
  category: string;
  uom: string;
  unitCost: number;
  weight?: number;
  volume?: number;
  imageUrl?: string;
}

export interface VarianceSummary {
  totalItems: number;
  countedItems: number;
  matchedItems: number;
  variantItems: number;
  withinTolerance: number;
  exceedTolerance: number;
  totalVarianceQty: number;
  totalVarianceValue: number;
  accuracyRate: number;
}

export interface AIDecisionContext {
  planId: string;
  currentRound: number;
  varianceSummary: VarianceSummary;
  highValueVariances: Array<{
    locationCode: string;
    productCode: string;
    varianceValue: number;
  }>;
  recommendation: 'COMPLETE' | 'RECOUNT' | 'PARTIAL_RECOUNT';
  confidence: number;
  reasoning: string;
  recountTargets: string[];
}

export interface InventoryItem {
  locationId: string;
  locationCode: string;
  productId: string;
  productCode: string;
  productName: string;
  barcode: string;
  quantity: number;
  uom: string;
  unitCost: number;
  lotNumber?: string;
  expiryDate?: string;
}

export interface User {
  userId: string;
  username: string;
  displayName: string;
  role: 'ADMIN' | 'OPERATOR';
}

export interface LoginCredentials {
  username: string;
  password?: string;
}

export interface CountResult {
  planId: string;
  planNo: string;
  completedAt: string;
  warehouseId: string;
  totalRounds: number;
  accuracyRate: number;
  variances: VarianceItem[];
  summary: CountSummary;
}

export interface VarianceItem {
  locationId: string;
  locationCode: string;
  productId: string;
  productCode: string;
  systemQty: number;
  countedQty: number;
  varianceQty: number;
  variancePercent: number;
  varianceValue: number;
  resolution: 'ACCEPTED' | 'ADJUSTED' | 'PENDING';
}

export interface CountSummary {
  totalLocations: number;
  totalProducts: number;
  totalSystemQty: number;
  totalCountedQty: number;
  totalVarianceQty: number;
  totalVarianceValue: number;
  matchedItems: number;
  variantItems: number;
  accuracyRate: number;
}
