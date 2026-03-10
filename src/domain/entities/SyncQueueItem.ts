import type { SyncStatus } from '../enums/CountType';

export interface SyncQueueItem {
  id: string;
  entityType: 'countDetail' | 'countTask' | 'photo';
  entityId: string;
  action: 'create' | 'update';
  payload: string; // JSON stringified
  status: SyncStatus;
  retryCount: number;
  createdAt: string;
  syncedAt?: string;
  error?: string;
}
