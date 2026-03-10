import type { SnapshotStatus } from '../enums/CountType';

export interface InventorySnapshot {
  id: string;
  countPlanId: string;
  snapshotTime: string;
  status: SnapshotStatus;
  totalLocations: number;
  totalProducts: number;
  totalQuantity: number;
  createdAt: string;
}

export interface SnapshotItem {
  id: string;
  snapshotId: string;
  locationId: string;
  locationCode: string;
  productId: string;
  productCode: string;
  productName: string;
  barcode?: string;
  quantity: number;
  uom: string;
  unitCost?: number;
  lotNumber?: string;
  expiryDate?: string;
}
