import type { CountDetailStatus, ScanMethod } from '../enums/CountType';

export interface CountDetail {
  id: string;
  countTaskId: string;
  countPlanId: string;
  round: number;
  locationId: string;
  locationCode: string;
  productId: string;
  productCode: string;
  productName: string;
  barcode?: string;
  systemQty: number;
  countedQty?: number;
  uom: string;
  varianceQty?: number;
  variancePercent?: number;
  varianceValue?: number;
  status: CountDetailStatus;
  scanMethod?: ScanMethod;
  photoUrls?: string[];
  countedBy?: string;
  countedAt?: string;
  remark?: string;
  isAnomalous: boolean;
  anomalyReason?: string;
  clientSyncId?: string;
  createdAt: string;
  updatedAt: string;
}
