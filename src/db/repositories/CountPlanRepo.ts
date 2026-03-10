import { db } from '../database';
import type { CountPlan } from '@domain/entities/CountPlan';
import type { CountPlanStatus } from '@domain/enums/CountPlanStatus';

export class CountPlanRepo {
  async getAll(): Promise<CountPlan[]> {
    return db.countPlans.orderBy('createdAt').reverse().toArray();
  }

  async getById(id: string): Promise<CountPlan | undefined> {
    return db.countPlans.get(id);
  }

  async getByStatus(status: CountPlanStatus): Promise<CountPlan[]> {
    return db.countPlans.where('status').equals(status).toArray();
  }

  async create(plan: CountPlan): Promise<void> {
    await db.countPlans.add(plan);
  }

  async update(id: string, changes: Partial<CountPlan>): Promise<void> {
    await db.countPlans.update(id, { ...changes, updatedAt: new Date().toISOString() });
  }

  async delete(id: string): Promise<void> {
    await db.countPlans.delete(id);
  }

  async count(): Promise<number> {
    return db.countPlans.count();
  }

  async getByWarehouse(warehouseId: string): Promise<CountPlan[]> {
    return db.countPlans.where('warehouseId').equals(warehouseId).toArray();
  }
}

export const countPlanRepo = new CountPlanRepo();
