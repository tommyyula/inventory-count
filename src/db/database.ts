import Dexie, { type Table } from 'dexie';
import type { CountPlan } from '@domain/entities/CountPlan';
import type { CountTask } from '@domain/entities/CountTask';
import type { CountDetail } from '@domain/entities/CountDetail';
import type { VarianceRecord } from '@domain/entities/VarianceRecord';
import type { InventorySnapshot, SnapshotItem } from '@domain/entities/InventorySnapshot';
import type { SyncQueueItem } from '@domain/entities/SyncQueueItem';

export class InventoryCountDB extends Dexie {
  countPlans!: Table<CountPlan>;
  countTasks!: Table<CountTask>;
  countDetails!: Table<CountDetail>;
  varianceRecords!: Table<VarianceRecord>;
  inventorySnapshots!: Table<InventorySnapshot>;
  snapshotItems!: Table<SnapshotItem>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('InventoryCountDB');
    this.version(1).stores({
      countPlans: 'id, planNo, status, warehouseId, createdAt',
      countTasks: 'id, taskNo, countPlanId, status, assigneeId, round, [countPlanId+round]',
      countDetails: 'id, countTaskId, countPlanId, locationId, productId, status, clientSyncId, [countTaskId+locationId], [countPlanId+round]',
      varianceRecords: 'id, countPlanId, productId, locationId, resolution, [countPlanId+resolution]',
      inventorySnapshots: 'id, countPlanId, status',
      snapshotItems: 'id, snapshotId, locationId, productId, [snapshotId+locationId]',
      syncQueue: 'id, entityType, entityId, action, status, createdAt',
    });
  }
}

export const db = new InventoryCountDB();
