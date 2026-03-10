import { db } from '../database';
import type { CountDetail } from '@domain/entities/CountDetail';

export class CountDetailRepo {
  async getById(id: string): Promise<CountDetail | undefined> {
    return db.countDetails.get(id);
  }

  async getByTaskId(countTaskId: string): Promise<CountDetail[]> {
    return db.countDetails.where('countTaskId').equals(countTaskId).toArray();
  }

  async getByPlanId(countPlanId: string): Promise<CountDetail[]> {
    return db.countDetails.where('countPlanId').equals(countPlanId).toArray();
  }

  async getByPlanAndRound(countPlanId: string, round: number): Promise<CountDetail[]> {
    return db.countDetails.where('[countPlanId+round]').equals([countPlanId, round]).toArray();
  }

  async getByTaskAndLocation(countTaskId: string, locationId: string): Promise<CountDetail[]> {
    return db.countDetails.where('[countTaskId+locationId]').equals([countTaskId, locationId]).toArray();
  }

  async create(detail: CountDetail): Promise<void> {
    await db.countDetails.add(detail);
  }

  async bulkCreate(details: CountDetail[]): Promise<void> {
    await db.countDetails.bulkAdd(details);
  }

  async update(id: string, changes: Partial<CountDetail>): Promise<void> {
    await db.countDetails.update(id, { ...changes, updatedAt: new Date().toISOString() });
  }

  async bulkUpdate(updates: Array<{ id: string; changes: Partial<CountDetail> }>): Promise<void> {
    await db.transaction('rw', db.countDetails, async () => {
      for (const { id, changes } of updates) {
        await db.countDetails.update(id, { ...changes, updatedAt: new Date().toISOString() });
      }
    });
  }

  async deleteByTaskId(countTaskId: string): Promise<void> {
    await db.countDetails.where('countTaskId').equals(countTaskId).delete();
  }

  async deleteByPlanId(countPlanId: string): Promise<void> {
    await db.countDetails.where('countPlanId').equals(countPlanId).delete();
  }

  async getByClientSyncId(clientSyncId: string): Promise<CountDetail | undefined> {
    return db.countDetails.where('clientSyncId').equals(clientSyncId).first();
  }
}

export const countDetailRepo = new CountDetailRepo();
