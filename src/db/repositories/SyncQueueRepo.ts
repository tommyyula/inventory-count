import { db } from '../database';
import type { SyncQueueItem } from '@domain/entities/SyncQueueItem';
import { SyncStatus } from '@domain/enums';

export class SyncQueueRepo {
  async enqueue(item: SyncQueueItem): Promise<void> {
    await db.syncQueue.add(item);
  }

  async getPending(): Promise<SyncQueueItem[]> {
    return db.syncQueue.where('status').equals(SyncStatus.PENDING).toArray();
  }

  async getFailed(): Promise<SyncQueueItem[]> {
    return db.syncQueue.where('status').equals(SyncStatus.FAILED).toArray();
  }

  async markSynced(id: string): Promise<void> {
    await db.syncQueue.update(id, {
      status: SyncStatus.SYNCED,
      syncedAt: new Date().toISOString(),
    });
  }

  async markFailed(id: string, error: string): Promise<void> {
    const item = await db.syncQueue.get(id);
    if (item) {
      await db.syncQueue.update(id, {
        status: SyncStatus.FAILED,
        retryCount: item.retryCount + 1,
        error,
      });
    }
  }

  async pendingCount(): Promise<number> {
    return db.syncQueue.where('status').equals(SyncStatus.PENDING).count();
  }

  async clearSynced(): Promise<void> {
    await db.syncQueue.where('status').equals(SyncStatus.SYNCED).delete();
  }
}

export const syncQueueRepo = new SyncQueueRepo();
