import { syncQueueRepo } from '@db/repositories/SyncQueueRepo';

class SyncService {
  private isSyncing = false;

  async getPendingCount(): Promise<number> {
    return syncQueueRepo.pendingCount();
  }

  async pushPending(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) return { synced: 0, failed: 0 };
    this.isSyncing = true;
    let synced = 0;
    let failed = 0;

    try {
      const pending = await syncQueueRepo.getPending();
      for (const item of pending) {
        try {
          // In v1, since all data is local, mark as synced immediately
          await syncQueueRepo.markSynced(item.id);
          synced++;
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          await syncQueueRepo.markFailed(item.id, errMsg);
          failed++;
        }
      }
    } finally {
      this.isSyncing = false;
    }

    return { synced, failed };
  }

  async clearSynced(): Promise<void> {
    return syncQueueRepo.clearSynced();
  }

  getIsSyncing(): boolean {
    return this.isSyncing;
  }
}

export const syncService = new SyncService();
