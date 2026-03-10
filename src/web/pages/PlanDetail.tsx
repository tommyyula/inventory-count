import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Steps, Button, Space, Tabs, message, Spin, Typography, Modal } from 'antd';
import { useCountPlanStore } from '@stores/countPlanStore';
import { PlanStatusBadge } from '@shared/components/StatusBadge';
import { CountPlanStatus } from '@domain/enums/CountPlanStatus';
import { formatDateTime } from '@shared/utils/formatters';
import { TaskManagement } from './TaskManagement';
import { VarianceAnalysis } from './VarianceAnalysis';
import { FinalReport } from './FinalReport';

const statusStepMap: Record<string, number> = {
  [CountPlanStatus.DRAFT]: 0,
  [CountPlanStatus.READY]: 1,
  [CountPlanStatus.FROZEN]: 2,
  [CountPlanStatus.IN_PROGRESS]: 3,
  [CountPlanStatus.REVIEWING]: 4,
  [CountPlanStatus.COMPLETED]: 5,
};

export function PlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentPlan: plan, loadPlan, isLoading, markReady, freezeInventory, generateTasks, cancelPlan, completePlan, moveToReviewing, triggerRecount } = useCountPlanStore();
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) loadPlan(id);
  }, [id, loadPlan]);

  if (isLoading || !plan) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;

  const handleAction = async (action: () => Promise<void>, successMsg: string) => {
    setActionLoading(true);
    try {
      await action();
      message.success(successMsg);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const renderActions = () => {
    const buttons: React.ReactNode[] = [];
    switch (plan.status) {
      case CountPlanStatus.DRAFT:
        buttons.push(
          <Button key="ready" type="primary" loading={actionLoading}
            onClick={() => handleAction(() => markReady(plan.id), '已标记就绪')}>
            标记就绪
          </Button>
        );
        break;
      case CountPlanStatus.READY:
        buttons.push(
          <Button key="freeze" type="primary" loading={actionLoading}
            onClick={() => handleAction(() => freezeInventory(plan.id), '库存已冻结')}>
            冻结库存
          </Button>
        );
        break;
      case CountPlanStatus.FROZEN:
        buttons.push(
          <Button key="generate" type="primary" loading={actionLoading}
            onClick={() => handleAction(() => generateTasks(plan.id), '任务已生成')}>
            生成盘点任务
          </Button>
        );
        break;
      case CountPlanStatus.IN_PROGRESS:
        buttons.push(
          <Button key="review" type="primary" loading={actionLoading}
            onClick={() => handleAction(() => moveToReviewing(plan.id), '已进入审核')}>
            进入审核
          </Button>
        );
        break;
      case CountPlanStatus.REVIEWING:
        buttons.push(
          <Button key="complete" type="primary" loading={actionLoading}
            onClick={() => handleAction(() => completePlan(plan.id), '盘点已完成')}>
            批准完成
          </Button>,
          <Button key="recount-full" loading={actionLoading}
            onClick={() => {
              Modal.confirm({
                title: '确认全量复盘？',
                content: '将为所有库位生成新一轮盘点任务',
                onOk: () => handleAction(() => triggerRecount(plan.id, 'full'), '已触发全量复盘'),
              });
            }}>
            全量复盘
          </Button>,
          <Button key="recount-partial" loading={actionLoading}
            onClick={() => {
              Modal.confirm({
                title: '确认部分复盘？',
                content: '将仅为超差库位生成新一轮盘点任务',
                onOk: () => handleAction(() => triggerRecount(plan.id, 'partial'), '已触发部分复盘'),
              });
            }}>
            部分复盘
          </Button>,
        );
        break;
    }

    if (![CountPlanStatus.COMPLETED, CountPlanStatus.CANCELLED].includes(plan.status as CountPlanStatus)) {
      buttons.push(
        <Button key="cancel" danger loading={actionLoading}
          onClick={() => {
            Modal.confirm({
              title: '确认取消？',
              content: '取消后不可恢复',
              onOk: () => handleAction(() => cancelPlan(plan.id), '已取消'),
            });
          }}>
          取消计划
        </Button>
      );
    }

    return <Space>{buttons}</Space>;
  };

  const tabItems = [
    {
      key: 'tasks',
      label: '任务管理',
      children: <TaskManagement planId={plan.id} />,
    },
    {
      key: 'variance',
      label: '差异分析',
      children: <VarianceAnalysis planId={plan.id} />,
    },
    {
      key: 'report',
      label: '最终报告',
      children: <FinalReport planId={plan.id} />,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          <a onClick={() => navigate('/plans')}>盘点计划</a> / {plan.planNo}
        </Typography.Title>
        {renderActions()}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Steps
          current={statusStepMap[plan.status] ?? 0}
          size="small"
          items={[
            { title: '草稿' },
            { title: '就绪' },
            { title: '冻结' },
            { title: '执行中' },
            { title: '审核' },
            { title: '完成' },
          ]}
        />
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={3} bordered size="small">
          <Descriptions.Item label="计划编号">{plan.planNo}</Descriptions.Item>
          <Descriptions.Item label="名称">{plan.name}</Descriptions.Item>
          <Descriptions.Item label="状态"><PlanStatusBadge status={plan.status} /></Descriptions.Item>
          <Descriptions.Item label="盘点类型">{plan.type === 'FULL' ? '全盘' : plan.type === 'PARTIAL' ? '部分盘' : '循环盘'}</Descriptions.Item>
          <Descriptions.Item label="当前轮次">{plan.currentRound}</Descriptions.Item>
          <Descriptions.Item label="最大轮次">{plan.maxRecountRounds}</Descriptions.Item>
          <Descriptions.Item label="差异容忍度">{plan.varianceTolerancePercent}%</Descriptions.Item>
          <Descriptions.Item label="盲盘模式">{plan.isBlindCount ? '是' : '否'}</Descriptions.Item>
          <Descriptions.Item label="AI 决策">{plan.aiDecisionEnabled ? '启用' : '禁用'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDateTime(plan.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="计划开始">{formatDateTime(plan.plannedStartDate)}</Descriptions.Item>
          <Descriptions.Item label="备注">{plan.notes || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}
