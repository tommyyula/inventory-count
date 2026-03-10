import type { CountTaskStatus } from '../enums/CountTaskStatus';
import type { TaskPriority } from '../enums/CountType';

export interface CountTask {
  id: string;
  taskNo: string;
  countPlanId: string;
  round: number;
  status: CountTaskStatus;
  assigneeId?: string;
  assigneeName?: string;
  locationIds: string[];
  priority: TaskPriority;
  startedAt?: string;
  completedAt?: string;
  submittedAt?: string;
  deviceId?: string;
  isBlindCount: boolean;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}
