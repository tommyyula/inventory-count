import { db } from '../database';
import type { VarianceRecord } from '@domain/entities/VarianceRecord';

export class VarianceRecordRepo {
  async getByPlanId(countPlanId: string): Promise<VarianceRecord[]> {
    return db.varianceRecords.where('countPlanId').equals(countPlanId).toArray();
  }

  async create(record: VarianceRecord): Promise<void> {
    await db.varianceRecords.add(record);
  }

  async bulkCreate(records: VarianceRecord[]): Promise<void> {
    await db.varianceRecords.bulkAdd(records);
  }

  async update(id: string, changes: Partial<VarianceRecord>): Promise<void> {
    await db.varianceRecords.update(id, { ...changes, updatedAt: new Date().toISOString() });
  }

  async deleteByPlanId(countPlanId: string): Promise<void> {
    await db.varianceRecords.where('countPlanId').equals(countPlanId).delete();
  }
}

export const varianceRecordRepo = new VarianceRecordRepo();
