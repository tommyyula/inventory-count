import { db } from '../database';
import type { InventorySnapshot, SnapshotItem } from '@domain/entities/InventorySnapshot';

export class SnapshotRepo {
  async getById(id: string): Promise<InventorySnapshot | undefined> {
    return db.inventorySnapshots.get(id);
  }

  async getByPlanId(countPlanId: string): Promise<InventorySnapshot | undefined> {
    return db.inventorySnapshots.where('countPlanId').equals(countPlanId).first();
  }

  async create(snapshot: InventorySnapshot): Promise<void> {
    await db.inventorySnapshots.add(snapshot);
  }

  async update(id: string, changes: Partial<InventorySnapshot>): Promise<void> {
    await db.inventorySnapshots.update(id, changes);
  }

  async getItems(snapshotId: string): Promise<SnapshotItem[]> {
    return db.snapshotItems.where('snapshotId').equals(snapshotId).toArray();
  }

  async getItemsByLocation(snapshotId: string, locationId: string): Promise<SnapshotItem[]> {
    return db.snapshotItems.where('[snapshotId+locationId]').equals([snapshotId, locationId]).toArray();
  }

  async addItems(items: SnapshotItem[]): Promise<void> {
    await db.snapshotItems.bulkAdd(items);
  }

  async deleteItems(snapshotId: string): Promise<void> {
    await db.snapshotItems.where('snapshotId').equals(snapshotId).delete();
  }
}

export const snapshotRepo = new SnapshotRepo();
