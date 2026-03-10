import type { CountPlan } from '@domain/entities/CountPlan';
import type { CountTask } from '@domain/entities/CountTask';
import type { CountDetail } from '@domain/entities/CountDetail';
import { CountTaskStatus } from '@domain/enums/CountTaskStatus';
import { CountDetailStatus, TaskPriority } from '@domain/enums';
import { countTaskRepo } from '@db/repositories/CountTaskRepo';
import { countDetailRepo } from '@db/repositories/CountDetailRepo';
import { snapshotRepo } from '@db/repositories/SnapshotRepo';
import { generateId, generateTaskNo } from '@shared/utils/idGenerator';
import { ProviderRegistry } from '@providers/ProviderRegistry';

class CountTaskService {
  async generateTasks(plan: CountPlan, round: number, splitBy: 'zone' | 'aisle' = 'zone'): Promise<CountTask[]> {
    if (!plan.freezeSnapshotId) {
      throw new Error('请先冻结库存快照');
    }
    const snapshotItems = await snapshotRepo.getItems(plan.freezeSnapshotId);
    const locationProvider = ProviderRegistry.get('location');
    const locations = await locationProvider.getLocations(plan.warehouseId);

    // Group locations by zone or aisle
    const groups = new Map<string, string[]>();
    for (const loc of locations) {
      const key = splitBy === 'zone' ? loc.zone : `${loc.zone}-${loc.aisle}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(loc.locationId);
    }

    const tasks: CountTask[] = [];
    const allDetails: CountDetail[] = [];
    let taskIndex = 1;

    for (const [_groupKey, locationIds] of groups) {
      const taskId = generateId();
      const now = new Date().toISOString();

      const task: CountTask = {
        id: taskId,
        taskNo: generateTaskNo(plan.planNo, taskIndex, round),
        countPlanId: plan.id,
        round,
        status: CountTaskStatus.PENDING,
        locationIds,
        priority: TaskPriority.MEDIUM,
        isBlindCount: plan.isBlindCount,
        createdAt: now,
        updatedAt: now,
      };
      tasks.push(task);

      // Create count details for each product in each location
      for (const locId of locationIds) {
        const itemsAtLocation = snapshotItems.filter(si => si.locationId === locId);
        for (const item of itemsAtLocation) {
          const detail: CountDetail = {
            id: generateId(),
            countTaskId: taskId,
            countPlanId: plan.id,
            round,
            locationId: item.locationId,
            locationCode: item.locationCode,
            productId: item.productId,
            productCode: item.productCode,
            productName: item.productName,
            barcode: item.barcode,
            systemQty: item.quantity,
            uom: item.uom,
            status: CountDetailStatus.PENDING,
            isAnomalous: false,
            createdAt: now,
            updatedAt: now,
          };
          allDetails.push(detail);
        }
      }

      taskIndex++;
    }

    await countTaskRepo.bulkCreate(tasks);
    await countDetailRepo.bulkCreate(allDetails);
    return tasks;
  }

  async generateRecountTasks(
    plan: CountPlan,
    round: number,
    scope: 'full' | 'partial',
    locationIds?: string[]
  ): Promise<CountTask[]> {
    if (!plan.freezeSnapshotId) throw new Error('请先冻结库存快照');

    const snapshotItems = await snapshotRepo.getItems(plan.freezeSnapshotId);
    let targetLocationIds: string[];

    if (scope === 'partial' && locationIds && locationIds.length > 0) {
      targetLocationIds = locationIds;
    } else {
      targetLocationIds = [...new Set(snapshotItems.map(si => si.locationId))];
    }

    const taskId = generateId();
    const now = new Date().toISOString();

    const task: CountTask = {
      id: taskId,
      taskNo: generateTaskNo(plan.planNo, 1, round),
      countPlanId: plan.id,
      round,
      status: CountTaskStatus.PENDING,
      locationIds: targetLocationIds,
      priority: TaskPriority.HIGH,
      isBlindCount: plan.isBlindCount,
      createdAt: now,
      updatedAt: now,
    };

    const details: CountDetail[] = [];
    for (const locId of targetLocationIds) {
      const items = snapshotItems.filter(si => si.locationId === locId);
      for (const item of items) {
        details.push({
          id: generateId(),
          countTaskId: taskId,
          countPlanId: plan.id,
          round,
          locationId: item.locationId,
          locationCode: item.locationCode,
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          barcode: item.barcode,
          systemQty: item.quantity,
          uom: item.uom,
          status: CountDetailStatus.PENDING,
          isAnomalous: false,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    await countTaskRepo.create(task);
    await countDetailRepo.bulkCreate(details);
    return [task];
  }

  async assignTask(taskId: string, assigneeId: string, assigneeName: string): Promise<CountTask> {
    const task = await this.getTaskOrThrow(taskId);
    if (task.status !== CountTaskStatus.PENDING && task.status !== CountTaskStatus.ASSIGNED) {
      throw new Error('只有待分配或已分配的任务可以分配');
    }
    await countTaskRepo.update(taskId, {
      assigneeId,
      assigneeName,
      status: CountTaskStatus.ASSIGNED,
    });
    return { ...task, assigneeId, assigneeName, status: CountTaskStatus.ASSIGNED };
  }

  async batchAssign(assignments: Array<{ taskId: string; assigneeId: string; assigneeName: string }>): Promise<void> {
    for (const a of assignments) {
      await this.assignTask(a.taskId, a.assigneeId, a.assigneeName);
    }
  }

  async startTask(taskId: string, deviceId?: string): Promise<CountTask> {
    const task = await this.getTaskOrThrow(taskId);
    if (task.status !== CountTaskStatus.ASSIGNED && task.status !== CountTaskStatus.PAUSED) {
      throw new Error('只有已分配或暂停的任务可以开始');
    }
    await countTaskRepo.update(taskId, {
      status: CountTaskStatus.IN_PROGRESS,
      startedAt: task.startedAt || new Date().toISOString(),
      deviceId,
    });
    return { ...task, status: CountTaskStatus.IN_PROGRESS };
  }

  async pauseTask(taskId: string): Promise<CountTask> {
    const task = await this.getTaskOrThrow(taskId);
    if (task.status !== CountTaskStatus.IN_PROGRESS) {
      throw new Error('只有进行中的任务可以暂停');
    }
    await countTaskRepo.update(taskId, { status: CountTaskStatus.PAUSED });
    return { ...task, status: CountTaskStatus.PAUSED };
  }

  async submitTask(taskId: string): Promise<CountTask> {
    const task = await this.getTaskOrThrow(taskId);
    if (task.status !== CountTaskStatus.IN_PROGRESS) {
      throw new Error('只有进行中的任务可以提交');
    }
    const details = await countDetailRepo.getByTaskId(taskId);
    const pending = details.filter(d => d.status === CountDetailStatus.PENDING);
    if (pending.length > 0) {
      throw new Error(`还有 ${pending.length} 项未处理，请完成后再提交`);
    }
    const now = new Date().toISOString();
    await countTaskRepo.update(taskId, {
      status: CountTaskStatus.SUBMITTED,
      submittedAt: now,
      completedAt: now,
    });
    return { ...task, status: CountTaskStatus.SUBMITTED, submittedAt: now };
  }

  async getTasksByPlanId(planId: string): Promise<CountTask[]> {
    return countTaskRepo.getByPlanId(planId);
  }

  async getMyTasks(assigneeId: string): Promise<CountTask[]> {
    return countTaskRepo.getByAssigneeId(assigneeId);
  }

  async getTask(taskId: string): Promise<CountTask | undefined> {
    return countTaskRepo.getById(taskId);
  }

  async getTaskDetails(taskId: string): Promise<CountDetail[]> {
    return countDetailRepo.getByTaskId(taskId);
  }

  async updateDetail(detailId: string, update: {
    countedQty: number;
    scanMethod: CountDetail['scanMethod'];
    remark?: string;
    countedBy?: string;
  }): Promise<CountDetail> {
    const detail = await countDetailRepo.getById(detailId);
    if (!detail) throw new Error('盘点明细不存在');

    const varianceQty = update.countedQty - detail.systemQty;
    const variancePercent = detail.systemQty === 0
      ? (update.countedQty === 0 ? 0 : 100)
      : (varianceQty / detail.systemQty) * 100;

    const changes: Partial<CountDetail> = {
      countedQty: update.countedQty,
      varianceQty,
      variancePercent,
      scanMethod: update.scanMethod,
      status: CountDetailStatus.COUNTED,
      countedBy: update.countedBy,
      countedAt: new Date().toISOString(),
      remark: update.remark,
    };

    await countDetailRepo.update(detailId, changes);
    return { ...detail, ...changes };
  }

  async skipDetail(detailId: string, reason: string): Promise<void> {
    await countDetailRepo.update(detailId, {
      status: CountDetailStatus.SKIPPED,
      remark: reason,
    });
  }

  async flagDetail(detailId: string, anomalyReason: string, countedQty?: number): Promise<void> {
    const changes: Partial<CountDetail> = {
      status: CountDetailStatus.FLAGGED,
      isAnomalous: true,
      anomalyReason,
      countedAt: new Date().toISOString(),
    };
    if (countedQty !== undefined) {
      changes.countedQty = countedQty;
    }
    await countDetailRepo.update(detailId, changes);
  }

  async getTaskProgress(taskId: string): Promise<{
    totalLocations: number;
    completedLocations: number;
    totalItems: number;
    countedItems: number;
    skippedItems: number;
    flaggedItems: number;
  }> {
    const details = await countDetailRepo.getByTaskId(taskId);
    const locationSet = new Set(details.map(d => d.locationId));
    const completedLocationIds = new Set<string>();

    for (const locId of locationSet) {
      const locDetails = details.filter(d => d.locationId === locId);
      if (locDetails.every(d => d.status !== CountDetailStatus.PENDING)) {
        completedLocationIds.add(locId);
      }
    }

    return {
      totalLocations: locationSet.size,
      completedLocations: completedLocationIds.size,
      totalItems: details.length,
      countedItems: details.filter(d => d.status === CountDetailStatus.COUNTED).length,
      skippedItems: details.filter(d => d.status === CountDetailStatus.SKIPPED).length,
      flaggedItems: details.filter(d => d.status === CountDetailStatus.FLAGGED).length,
    };
  }

  private async getTaskOrThrow(taskId: string): Promise<CountTask> {
    const task = await countTaskRepo.getById(taskId);
    if (!task) throw new Error(`盘点任务不存在: ${taskId}`);
    return task;
  }
}

export const countTaskService = new CountTaskService();
