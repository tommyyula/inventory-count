import { useEffect } from 'react';
import { Card, Row, Col, Statistic, List, Progress, Typography, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCountPlanStore } from '@stores/countPlanStore';
import { PlanStatusBadge } from '@shared/components/StatusBadge';
import { CountPlanStatus } from '@domain/enums/CountPlanStatus';

export function Dashboard() {
  const { plans, loadPlans, isLoading } = useCountPlanStore();
  const navigate = useNavigate();

  useEffect(() => { loadPlans(); }, [loadPlans]);

  const inProgress = plans.filter(p => p.status === CountPlanStatus.IN_PROGRESS);
  const reviewing = plans.filter(p => p.status === CountPlanStatus.REVIEWING);
  const completed = plans.filter(p => p.status === CountPlanStatus.COMPLETED);
  const active = [...inProgress, ...reviewing];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>仪表盘</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/plans/create')}>
          新建盘点计划
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card><Statistic title="进行中" value={inProgress.length} valueStyle={{ color: '#1677ff' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="待审核" value={reviewing.length} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="已完成" value={completed.length} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="总计" value={plans.length} /></Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={14}>
          <Card title="活跃盘点计划" loading={isLoading}>
            {active.length === 0 ? (
              <Typography.Text type="secondary">暂无活跃计划</Typography.Text>
            ) : (
              <List
                dataSource={active}
                renderItem={plan => (
                  <List.Item
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/plans/${plan.id}`)}
                    extra={<PlanStatusBadge status={plan.status} />}
                  >
                    <List.Item.Meta
                      title={`${plan.planNo} - ${plan.name}`}
                      description={
                        <div>
                          <div>类型: {plan.type === 'FULL' ? '全盘' : plan.type === 'PARTIAL' ? '部分盘' : '循环盘'}</div>
                          <div>轮次: {plan.currentRound}</div>
                          <Progress percent={plan.status === CountPlanStatus.REVIEWING ? 100 : 50} size="small" />
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        <Col span={10}>
          <Card title="近期完成" extra={<a onClick={() => navigate('/plans')}>查看全部</a>}>
            <List
              dataSource={completed.slice(0, 5)}
              renderItem={plan => (
                <List.Item onClick={() => navigate(`/plans/${plan.id}`)} style={{ cursor: 'pointer' }}>
                  <List.Item.Meta
                    title={plan.planNo}
                    description={plan.name}
                  />
                </List.Item>
              )}
              locale={{ emptyText: '暂无完成记录' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
