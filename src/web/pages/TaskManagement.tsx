import { useEffect, useState } from 'react';
import { Table, Button, Modal, Select, Space, message, Progress, Typography } from 'antd';
import { useCountTaskStore } from '@stores/countTaskStore';
import { TaskStatusBadge } from '@shared/components/StatusBadge';
import { ProviderRegistry } from '@providers/ProviderRegistry';
import type { User } from '@domain/value-objects';
import type { CountTask } from '@domain/entities/CountTask';
import { CountTaskStatus } from '@domain/enums/CountTaskStatus';
import { countTaskService } from '@services/CountTaskService';

interface Props {
  planId: string;
}

export function TaskManagement({ planId }: Props) {
  const { tasks, loadTasksByPlan, assignTask, isLoading } = useCountTaskStore();
  const [users, setUsers] = useState<User[]>([]);
  const [assignModal, setAssignModal] = useState<{ visible: boolean; taskId?: string }>({ visible: false });
  const [selectedUser, setSelectedUser] = useState<string>();
  const [taskProgress, setTaskProgress] = useState<Record<string, { completed: number; total: number }>>({});

  useEffect(() => {
    loadTasksByPlan(planId);
    ProviderRegistry.get('auth').getUsers().then(setUsers);
  }, [planId, loadTasksByPlan]);

  useEffect(() => {
    const loadProgress = async () => {
      const progress: Record<string, { completed: number; total: number }> = {};
      for (const task of tasks) {
        const p = await countTaskService.getTaskProgress(task.id);
        progress[task.id] = { completed: p.completedLocations, total: p.totalLocations };
      }
      setTaskProgress(progress);
    };
    if (tasks.length > 0) loadProgress();
  }, [tasks]);

  const handleAssign = async () => {
    if (!assignModal.taskId || !selectedUser) return;
    const user = users.find(u => u.userId === selectedUser);
    if (!user) return;
    try {
      await assignTask(assignModal.taskId, user.userId, user.displayName);
      message.success('分配成功');
      setAssignModal({ visible: false });
      setSelectedUser(undefined);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '分配失败');
    }
  };

  const operators = users.filter(u => u.role === 'OPERATOR');

  const columns = [
    { title: '任务编号', dataIndex: 'taskNo', key: 'taskNo' },
    { title: '轮次', dataIndex: 'round', key: 'round' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <TaskStatusBadge status={v} /> },
    { title: '操作员', dataIndex: 'assigneeName', key: 'assigneeName', render: (v: string) => v || '-' },
    { title: '库位数', key: 'locations', render: (_: unknown, r: CountTask) => r.locationIds.length },
    {
      title: '进度', key: 'progress',
      render: (_: unknown, r: CountTask) => {
        const p = taskProgress[r.id];
        if (!p) return '-';
        const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
        return <Progress percent={pct} size="small" format={() => `${p.completed}/${p.total}`} />;
      },
    },
    {
      title: '操作', key: 'actions',
      render: (_: unknown, r: CountTask) => (
        <Space>
          {(r.status === CountTaskStatus.PENDING || r.status === CountTaskStatus.ASSIGNED) && (
            <Button size="small" type="primary"
              onClick={() => { setAssignModal({ visible: true, taskId: r.id }); setSelectedUser(r.assigneeId); }}>
              {r.assigneeId ? '重新分配' : '分配'}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={5}>盘点任务 ({tasks.length})</Typography.Title>
      <Table columns={columns} dataSource={tasks} rowKey="id" loading={isLoading} pagination={false} size="small" />

      <Modal
        title="分配任务"
        open={assignModal.visible}
        onOk={handleAssign}
        onCancel={() => setAssignModal({ visible: false })}
        okText="确认分配"
        cancelText="取消"
      >
        <Select
          style={{ width: '100%' }}
          placeholder="选择操作员"
          value={selectedUser}
          onChange={setSelectedUser}
          options={operators.map(u => ({ value: u.userId, label: `${u.displayName} (${u.username})` }))}
        />
      </Modal>
    </div>
  );
}
