import type { CountPlan } from '@domain/entities/CountPlan';
import { CountPlanStatus } from '@domain/enums/CountPlanStatus';
import type { CountType } from '@domain/enums/CountType';
import { countPlanRepo } from '@db/repositories/CountPlanRepo';
import { countTaskRepo } from '@db/repositories/CountTaskRepo';
import { countDetailRepo } from '@db/repositories/CountDetailRepo';
import { varianceRecordRepo } from '@db/repositories/VarianceRecordRepo';
import { generateId, generatePlanNo } from '@shared/utils/idGenerator';
import { snapshotService } from './SnapshotService';
import { countTaskService } from './CountTaskService';
import { CountTaskStatus } from '@domain/enums/CountTaskStatus';

export interface CreatePlanInput {
  name: string;
  type: CountType;
  warehouseId: string;
  scopeDescription?: string;
  plannedStartDate: string;
  plannedEndDate?: string;
  varianceTolerancePercent?: number;
  varianceToleranceQty?: number;
  varianceToleranceValue?: number;
  maxRecountRounds?: number;
  isBlindCount?: boolean;
  aiDecisionEnabled?: boolean;
  notes?: string;
}

class CountPlanService {
  async createPlan(input: CreatePlanInput, createdBy: string): Promise<CountPlan> {
    const now = new Date().toISOString();
    const plan: CountPlan = {
      id: generateId(),
      planNo: generatePlanNo(),
      name: input.name,
      type: input.type,
      status: CountPlanStatus.DRAFT,
      warehouseId: input.warehouseId,
      scopeDescription: input.scopeDescription,
      plannedStartDate: input.plannedStartDate,
      plannedEndDate: input.plannedEndDate,
      varianceTolerancePercent: input.varianceTolerancePercent ?? 5,
      varianceToleranceQty: input.varianceToleranceQty,
      varianceToleranceValue: input.varianceToleranceValue,
      maxRecountRounds: input.maxRecountRounds ?? 2,
      currentRound: 0,
      isBlindCount: input.isBlindCount ?? true,
      aiDecisionEnabled: input.aiDecisionEnabled ?? true,
      createdBy,
      createdAt: now,
      updatedAt: now,
      notes: input.notes,
    };

    await countPlanRepo.create(plan);
    return plan;
  }

  async updatePlan(id: string, changes: Partial<CreatePlanInput>): Promise<CountPlan> {
    const plan = await this.getPlanOrThrow(id);
    if (plan.status !== CountPlanStatus.DRAFT) {
      throw new Error('只有草稿状态的计划可以修改');
    }
    await countPlanRepo.update(id, changes);
    return { ...plan, ...changes, updatedAt: new Date().toISOString() };
  }

  async markReady(id: string): Promise<CountPlan> {
    const plan = await this.getPlanOrThrow(id);
    if (plan.status !== CountPlanStatus.DRAFT) {
      throw new Error('只有草稿状态可以标记就绪');
    }
    if (!plan.name || !plan.warehouseId || !plan.plannedStartDate) {
      throw new Error('请填写必填字段：名称、仓库、计划开始日期');
    }
    await countPlanRepo.update(id, { status: CountPlanStatus.READY });
    return { ...plan, status: CountPlanStatus.READY };
  }

  async freezeInventory(id: string): Promise<CountPlan> {
    const plan = await this.getPlanOrThrow(id);
    if (plan.status !== CountPlanStatus.READY) {
      throw new Error('只有就绪状态可以冻结库存');
    }
    const snapshot = await snapshotService.createSnapshot(id, plan.warehouseId);
    await countPlanRepo.update(id, {
      status: CountPlanStatus.FROZEN,
      freezeSnapshotId: snapshot.id,
    });
    return { ...plan, status: CountPlanStatus.FROZEN, freezeSnapshotId: snapshot.id };
  }

  async generateAndStartTasks(id: string, splitBy: 'zone' | 'aisle' = 'zone'): Promise<CountPlan> {
    const plan = await this.getPlanOrThrow(id);
    if (plan.status !== CountPlanStatus.FROZEN && plan.status !== CountPlanStatus.REVIEWING) {
      throw new Error('只有冻结或审核状态可以生成任务');
    }
    const newRound = plan.currentRound + 1;
    await countTaskService.generateTasks(plan, newRound, splitBy);
    await countPlanRepo.update(id, {
      status: CountPlanStatus.IN_PROGRESS,
      currentRound: newRound,
      actualStartDate: plan.actualStartDate || new Date().toISOString(),
    });
    return {
      ...plan,
      status: CountPlanStatus.IN_PROGRESS,
      currentRound: newRound,
    };
  }

  async checkAllTasksSubmitted(planId: string): Promise<boolean> {
    const tasks = await countTaskRepo.getByPlanId(planId);
    const plan = await this.getPlanOrThrow(planId);
    const currentRoundTasks = tasks.filter(t => t.round === plan.currentRound);
    return currentRoundTasks.length > 0 &&
      currentRoundTasks.every(t => t.status === CountTaskStatus.SUBMITTED || t.status === CountTaskStatus.VERIFIED);
  }

  async moveToReviewing(id: string): Promise<CountPlan> {
    const plan = await this.getPlanOrThrow(id);
    if (plan.status !== CountPlanStatus.IN_PROGRESS) {
      throw new Error('只有进行中的计划可以进入审核');
    }
    await countPlanRepo.update(id, { status: CountPlanStatus.REVIEWING });
    return { ...plan, status: CountPlanStatus.REVIEWING };
  }

  async completePlan(id: string): Promise<CountPlan> {
    const plan = await this.getPlanOrThrow(id);
    if (plan.status !== CountPlanStatus.REVIEWING) {
      throw new Error('只有审核状态可以完成');
    }
    const now = new Date().toISOString();
    await countPlanRepo.update(id, {
      status: CountPlanStatus.COMPLETED,
      actualEndDate: now,
    });
    return { ...plan, status: CountPlanStatus.COMPLETED, actualEndDate: now };
  }

  async triggerRecount(id: string, scope: 'full' | 'partial', locationIds?: string[]): Promise<CountPlan> {
    const plan = await this.getPlanOrThrow(id);
    if (plan.status !== CountPlanStatus.REVIEWING) {
      throw new Error('只有审核状态可以触发复盘');
    }
    if (plan.currentRound >= plan.maxRecountRounds) {
      throw new Error(`已达到最大复盘轮次(${plan.maxRecountRounds})`);
    }

    const newRound = plan.currentRound + 1;
    await countTaskService.generateRecountTasks(plan, newRound, scope, locationIds);
    await countPlanRepo.update(id, {
      status: CountPlanStatus.IN_PROGRESS,
      currentRound: newRound,
    });
    return { ...plan, status: CountPlanStatus.IN_PROGRESS, currentRound: newRound };
  }

  async cancelPlan(id: string): Promise<CountPlan> {
    const plan = await this.getPlanOrThrow(id);
    if (plan.status === CountPlanStatus.COMPLETED || plan.status === CountPlanStatus.CANCELLED) {
      throw new Error('已完成或已取消的计划不能再取消');
    }
    // Cancel all pending/assigned/in-progress tasks
    const tasks = await countTaskRepo.getByPlanId(id);
    for (const task of tasks) {
      if (![CountTaskStatus.SUBMITTED, CountTaskStatus.VERIFIED, CountTaskStatus.CANCELLED].includes(task.status)) {
        await countTaskRepo.update(task.id, { status: CountTaskStatus.CANCELLED });
      }
    }
    await countPlanRepo.update(id, { status: CountPlanStatus.CANCELLED });
    return { ...plan, status: CountPlanStatus.CANCELLED };
  }

  async getPlan(id: string): Promise<CountPlan | undefined> {
    return countPlanRepo.getById(id);
  }

  async getAllPlans(): Promise<CountPlan[]> {
    return countPlanRepo.getAll();
  }

  async deletePlan(id: string): Promise<void> {
    const plan = await this.getPlanOrThrow(id);
    if (plan.status !== CountPlanStatus.DRAFT) {
      throw new Error('只有草稿状态可以删除');
    }
    await countDetailRepo.deleteByPlanId(id);
    await countTaskRepo.deleteByPlanId(id);
    await varianceRecordRepo.deleteByPlanId(id);
    await countPlanRepo.delete(id);
  }

  private async getPlanOrThrow(id: string): Promise<CountPlan> {
    const plan = await countPlanRepo.getById(id);
    if (!plan) {
      throw new Error(`盘点计划不存在: ${id}`);
    }
    return plan;
  }
}

export const countPlanService = new CountPlanService();
