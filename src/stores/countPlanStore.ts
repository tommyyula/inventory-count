import { create } from 'zustand';
import type { CountPlan } from '@domain/entities/CountPlan';
import { countPlanService, type CreatePlanInput } from '@services/CountPlanService';

interface CountPlanState {
  plans: CountPlan[];
  currentPlan: CountPlan | null;
  isLoading: boolean;
  error: string | null;
  loadPlans: () => Promise<void>;
  loadPlan: (id: string) => Promise<void>;
  createPlan: (input: CreatePlanInput, createdBy: string) => Promise<CountPlan>;
  updatePlan: (id: string, changes: Partial<CreatePlanInput>) => Promise<void>;
  markReady: (id: string) => Promise<void>;
  freezeInventory: (id: string) => Promise<void>;
  generateTasks: (id: string, splitBy?: 'zone' | 'aisle') => Promise<void>;
  completePlan: (id: string) => Promise<void>;
  cancelPlan: (id: string) => Promise<void>;
  triggerRecount: (id: string, scope: 'full' | 'partial', locationIds?: string[]) => Promise<void>;
  moveToReviewing: (id: string) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
}

export const useCountPlanStore = create<CountPlanState>((set, get) => ({
  plans: [],
  currentPlan: null,
  isLoading: false,
  error: null,

  loadPlans: async () => {
    set({ isLoading: true, error: null });
    try {
      const plans = await countPlanService.getAllPlans();
      set({ plans, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载失败', isLoading: false });
    }
  },

  loadPlan: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const plan = await countPlanService.getPlan(id);
      set({ currentPlan: plan || null, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载失败', isLoading: false });
    }
  },

  createPlan: async (input: CreatePlanInput, createdBy: string) => {
    const plan = await countPlanService.createPlan(input, createdBy);
    await get().loadPlans();
    return plan;
  },

  updatePlan: async (id: string, changes: Partial<CreatePlanInput>) => {
    await countPlanService.updatePlan(id, changes);
    await get().loadPlans();
    await get().loadPlan(id);
  },

  markReady: async (id: string) => {
    await countPlanService.markReady(id);
    await get().loadPlan(id);
    await get().loadPlans();
  },

  freezeInventory: async (id: string) => {
    await countPlanService.freezeInventory(id);
    await get().loadPlan(id);
    await get().loadPlans();
  },

  generateTasks: async (id: string, splitBy?: 'zone' | 'aisle') => {
    await countPlanService.generateAndStartTasks(id, splitBy);
    await get().loadPlan(id);
    await get().loadPlans();
  },

  completePlan: async (id: string) => {
    await countPlanService.completePlan(id);
    await get().loadPlan(id);
    await get().loadPlans();
  },

  cancelPlan: async (id: string) => {
    await countPlanService.cancelPlan(id);
    await get().loadPlan(id);
    await get().loadPlans();
  },

  triggerRecount: async (id: string, scope: 'full' | 'partial', locationIds?: string[]) => {
    await countPlanService.triggerRecount(id, scope, locationIds);
    await get().loadPlan(id);
    await get().loadPlans();
  },

  moveToReviewing: async (id: string) => {
    await countPlanService.moveToReviewing(id);
    await get().loadPlan(id);
    await get().loadPlans();
  },

  deletePlan: async (id: string) => {
    await countPlanService.deletePlan(id);
    await get().loadPlans();
    set({ currentPlan: null });
  },
}));
