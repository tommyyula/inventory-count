import type { CountPlanStatus } from '../enums/CountPlanStatus';
import type { CountType } from '../enums/CountType';

export interface CountPlan {
  id: string;
  planNo: string;
  name: string;
  type: CountType;
  status: CountPlanStatus;
  warehouseId: string;
  scopeDescription?: string;
  plannedStartDate: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  freezeSnapshotId?: string;
  varianceTolerancePercent: number;
  varianceToleranceQty?: number;
  varianceToleranceValue?: number;
  maxRecountRounds: number;
  currentRound: number;
  isBlindCount: boolean;
  aiDecisionEnabled: boolean;
  aiDecisionResult?: string; // JSON string of AIDecisionContext
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}
