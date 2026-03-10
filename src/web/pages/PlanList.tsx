import { useEffect, useState } from 'react';
import { Table, Button, Space, Select, Popconfirm, message, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCountPlanStore } from '@stores/countPlanStore';
import { PlanStatusBadge } from '@shared/components/StatusBadge';
import { CountPlanStatus } from '@domain/enums/CountPlanStatus';
import { formatDateTime } from '@shared/utils/formatters';
import type { CountPlan } from '@domain/entities/CountPlan';

export function PlanList() {
  const { plans, loadPlans, deletePlan, isLoading } = useCountPlanStore();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const navigate = useNavigate();

  useEffect(() => { loadPlans(); }, [loadPlans]);

  const filtered = statusFilter ? plans.filter(p => p.status === statusFilter) : plans;

  const columns = [
    { title: '计划编号', dataIndex: 'planNo', key: 'planNo', render: (v: string, r: CountPlan) => <a onClick={() => navigate(`/plans/${r.id}`)}>{v}</a> },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (v: string) => v === 'FULL' ? '全盘' : v === 'PARTIAL' ? '部分盘' : '循环盘' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <PlanStatusBadge status={v} /> },
    { title: '轮次', dataIndex: 'currentRound', key: 'currentRound' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => formatDateTime(v) },
    {
      title: '操作', key: 'actions',
      render: (_: unknown, record: CountPlan) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/plans/${record.id}`)}>查看</Button>
          {record.status === CountPlanStatus.DRAFT && (
            <Popconfirm title="确认删除？" onConfirm={async () => { await deletePlan(record.id); message.success('已删除'); }}>
              <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>盘点计划列表</Typography.Title>
        <Space>
          <Select
            placeholder="筛选状态"
            allowClear
            style={{ width: 150 }}
            onChange={setStatusFilter}
            options={[
              { value: CountPlanStatus.DRAFT, label: '草稿' },
              { value: CountPlanStatus.READY, label: '就绪' },
              { value: CountPlanStatus.FROZEN, label: '已冻结' },
              { value: CountPlanStatus.IN_PROGRESS, label: '进行中' },
              { value: CountPlanStatus.REVIEWING, label: '审核中' },
              { value: CountPlanStatus.COMPLETED, label: '已完成' },
              { value: CountPlanStatus.CANCELLED, label: '已取消' },
            ]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/plans/create')}>
            新建计划
          </Button>
        </Space>
      </div>
      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}
