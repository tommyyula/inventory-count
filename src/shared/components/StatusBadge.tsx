import { Tag } from 'antd';
import { CountPlanStatus } from '@domain/enums/CountPlanStatus';
import { CountTaskStatus } from '@domain/enums/CountTaskStatus';

const planStatusConfig: Record<string, { color: string; label: string }> = {
  [CountPlanStatus.DRAFT]: { color: 'default', label: '草稿' },
  [CountPlanStatus.READY]: { color: 'blue', label: '就绪' },
  [CountPlanStatus.FROZEN]: { color: 'cyan', label: '已冻结' },
  [CountPlanStatus.IN_PROGRESS]: { color: 'processing', label: '进行中' },
  [CountPlanStatus.REVIEWING]: { color: 'warning', label: '审核中' },
  [CountPlanStatus.COMPLETED]: { color: 'success', label: '已完成' },
  [CountPlanStatus.CANCELLED]: { color: 'error', label: '已取消' },
};

const taskStatusConfig: Record<string, { color: string; label: string }> = {
  [CountTaskStatus.PENDING]: { color: 'default', label: '待分配' },
  [CountTaskStatus.ASSIGNED]: { color: 'blue', label: '已分配' },
  [CountTaskStatus.IN_PROGRESS]: { color: 'processing', label: '进行中' },
  [CountTaskStatus.PAUSED]: { color: 'warning', label: '已暂停' },
  [CountTaskStatus.SUBMITTED]: { color: 'cyan', label: '已提交' },
  [CountTaskStatus.VERIFIED]: { color: 'success', label: '已审核' },
  [CountTaskStatus.REJECTED]: { color: 'error', label: '已退回' },
  [CountTaskStatus.CANCELLED]: { color: 'default', label: '已取消' },
};

export function PlanStatusBadge({ status }: { status: string }) {
  const config = planStatusConfig[status] || { color: 'default', label: status };
  return <Tag color={config.color}>{config.label}</Tag>;
}

export function TaskStatusBadge({ status }: { status: string }) {
  const config = taskStatusConfig[status] || { color: 'default', label: status };
  return <Tag color={config.color}>{config.label}</Tag>;
}
