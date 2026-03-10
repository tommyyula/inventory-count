import { create } from 'zustand';
import type { CountTask } from '@domain/entities/CountTask';
import type { CountDetail } from '@domain/entities/CountDetail';
import { countTaskService } from '@services/CountTaskService';

interface CountTaskState {
  tasks: CountTask[];
  currentTask: CountTask | null;
  taskDetails: CountDetail[];
  isLoading: boolean;
  error: string | null;
  loadTasksByPlan: (planId: string) => Promise<void>;
  loadMyTasks: (assigneeId: string) => Promise<void>;
  loadTask: (taskId: string) => Promise<void>;
  loadTaskDetails: (taskId: string) => Promise<void>;
  assignTask: (taskId: string, assigneeId: string, assigneeName: string) => Promise<void>;
  batchAssign: (assignments: Array<{ taskId: string; assigneeId: string; assigneeName: string }>) => Promise<void>;
  startTask: (taskId: string) => Promise<void>;
  pauseTask: (taskId: string) => Promise<void>;
  submitTask: (taskId: string) => Promise<void>;
  updateDetail: (detailId: string, update: {
    countedQty: number;
    scanMethod: CountDetail['scanMethod'];
    remark?: string;
    countedBy?: string;
  }) => Promise<void>;
  skipDetail: (detailId: string, reason: string) => Promise<void>;
  flagDetail: (detailId: string, reason: string, countedQty?: number) => Promise<void>;
}

export const useCountTaskStore = create<CountTaskState>((set, get) => ({
  tasks: [],
  currentTask: null,
  taskDetails: [],
  isLoading: false,
  error: null,

  loadTasksByPlan: async (planId: string) => {
    set({ isLoading: true });
    try {
      const tasks = await countTaskService.getTasksByPlanId(planId);
      set({ tasks, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载失败', isLoading: false });
    }
  },

  loadMyTasks: async (assigneeId: string) => {
    set({ isLoading: true });
    try {
      const tasks = await countTaskService.getMyTasks(assigneeId);
      set({ tasks, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载失败', isLoading: false });
    }
  },

  loadTask: async (taskId: string) => {
    const task = await countTaskService.getTask(taskId);
    set({ currentTask: task || null });
  },

  loadTaskDetails: async (taskId: string) => {
    const details = await countTaskService.getTaskDetails(taskId);
    set({ taskDetails: details });
  },

  assignTask: async (taskId: string, assigneeId: string, assigneeName: string) => {
    await countTaskService.assignTask(taskId, assigneeId, assigneeName);
    // Reload tasks from the current context
    const task = await countTaskService.getTask(taskId);
    if (task) {
      await get().loadTasksByPlan(task.countPlanId);
    }
  },

  batchAssign: async (assignments) => {
    await countTaskService.batchAssign(assignments);
    if (assignments.length > 0) {
      const task = await countTaskService.getTask(assignments[0].taskId);
      if (task) {
        await get().loadTasksByPlan(task.countPlanId);
      }
    }
  },

  startTask: async (taskId: string) => {
    await countTaskService.startTask(taskId);
    await get().loadTask(taskId);
  },

  pauseTask: async (taskId: string) => {
    await countTaskService.pauseTask(taskId);
    await get().loadTask(taskId);
  },

  submitTask: async (taskId: string) => {
    await countTaskService.submitTask(taskId);
    await get().loadTask(taskId);
  },

  updateDetail: async (detailId, update) => {
    await countTaskService.updateDetail(detailId, update);
    const detail = get().taskDetails.find(d => d.id === detailId);
    if (detail) {
      await get().loadTaskDetails(detail.countTaskId);
    }
  },

  skipDetail: async (detailId: string, reason: string) => {
    await countTaskService.skipDetail(detailId, reason);
    const detail = get().taskDetails.find(d => d.id === detailId);
    if (detail) {
      await get().loadTaskDetails(detail.countTaskId);
    }
  },

  flagDetail: async (detailId: string, reason: string, countedQty?: number) => {
    await countTaskService.flagDetail(detailId, reason, countedQty);
    const detail = get().taskDetails.find(d => d.id === detailId);
    if (detail) {
      await get().loadTaskDetails(detail.countTaskId);
    }
  },
}));
