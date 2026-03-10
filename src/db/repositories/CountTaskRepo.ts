import { db } from '../database';
import type { CountTask } from '@domain/entities/CountTask';
import type { CountTaskStatus } from '@domain/enums/CountTaskStatus';

export class CountTaskRepo {
  async getAll(): Promise<CountTask[]> {
    return db.countTasks.toArray();
  }

  async getById(id: string): Promise<CountTask | undefined> {
    return db.countTasks.get(id);
  }

  async getByPlanId(countPlanId: string): Promise<CountTask[]> {
    return db.countTasks.where('countPlanId').equals(countPlanId).toArray();
  }

  async getByPlanAndRound(countPlanId: string, round: number): Promise<CountTask[]> {
    return db.countTasks.where('[countPlanId+round]').equals([countPlanId, round]).toArray();
  }

  async getByAssigneeId(assigneeId: string): Promise<CountTask[]> {
    return db.countTasks.where('assigneeId').equals(assigneeId).toArray();
  }

  async getByStatus(status: CountTaskStatus): Promise<CountTask[]> {
    return db.countTasks.where('status').equals(status).toArray();
  }

  async create(task: CountTask): Promise<void> {
    await db.countTasks.add(task);
  }

  async bulkCreate(tasks: CountTask[]): Promise<void> {
    await db.countTasks.bulkAdd(tasks);
  }

  async update(id: string, changes: Partial<CountTask>): Promise<void> {
    await db.countTasks.update(id, { ...changes, updatedAt: new Date().toISOString() });
  }

  async delete(id: string): Promise<void> {
    await db.countTasks.delete(id);
  }

  async deleteByPlanId(countPlanId: string): Promise<void> {
    await db.countTasks.where('countPlanId').equals(countPlanId).delete();
  }
}

export const countTaskRepo = new CountTaskRepo();
