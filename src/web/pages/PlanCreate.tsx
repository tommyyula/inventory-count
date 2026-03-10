import { Form, Input, Select, DatePicker, InputNumber, Switch, Button, Card, message, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useCountPlanStore } from '@stores/countPlanStore';
import { useAuthStore } from '@stores/authStore';
import { CountType } from '@domain/enums';

export function PlanCreate() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { createPlan } = useCountPlanStore();
  const currentUser = useAuthStore(s => s.currentUser);

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      const plan = await createPlan({
        name: values.name as string,
        type: values.type as CountType,
        warehouseId: values.warehouseId as string || 'WH-001',
        scopeDescription: values.scopeDescription as string,
        plannedStartDate: (values.plannedStartDate as { toISOString: () => string })?.toISOString() || new Date().toISOString(),
        varianceTolerancePercent: values.varianceTolerancePercent as number,
        maxRecountRounds: values.maxRecountRounds as number,
        isBlindCount: values.isBlindCount as boolean,
        aiDecisionEnabled: values.aiDecisionEnabled as boolean,
        notes: values.notes as string,
      }, currentUser?.userId || 'USR-001');
      message.success('盘点计划创建成功');
      navigate(`/plans/${plan.id}`);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '创建失败');
    }
  };

  return (
    <div>
      <Typography.Title level={4}>新建盘点计划</Typography.Title>
      <Card style={{ maxWidth: 800 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            type: CountType.FULL,
            warehouseId: 'WH-001',
            varianceTolerancePercent: 5,
            maxRecountRounds: 2,
            isBlindCount: true,
            aiDecisionEnabled: true,
          }}
        >
          <Form.Item name="name" label="计划名称" rules={[{ required: true, message: '请输入计划名称' }]}>
            <Input placeholder="例：2026年3月全仓盘点" />
          </Form.Item>

          <Form.Item name="type" label="盘点类型" rules={[{ required: true }]}>
            <Select options={[
              { value: CountType.FULL, label: '全盘' },
              { value: CountType.PARTIAL, label: '部分盘' },
              { value: CountType.CYCLE, label: '循环盘' },
            ]} />
          </Form.Item>

          <Form.Item name="warehouseId" label="仓库" rules={[{ required: true }]}>
            <Select options={[
              { value: 'WH-001', label: '主仓库' },
              { value: 'WH-002', label: '备用仓库' },
            ]} />
          </Form.Item>

          <Form.Item name="plannedStartDate" label="计划开始日期" rules={[{ required: true, message: '请选择开始日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="scopeDescription" label="盘点范围描述">
            <Input.TextArea rows={2} placeholder="描述盘点范围，例：A区和B区所有货架" />
          </Form.Item>

          <Form.Item name="varianceTolerancePercent" label="差异容忍度 (%)">
            <InputNumber min={0.1} max={100} step={0.5} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="maxRecountRounds" label="最大复盘轮次">
            <InputNumber min={1} max={5} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="isBlindCount" label="盲盘模式" valuePropName="checked">
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>

          <Form.Item name="aiDecisionEnabled" label="AI 决策辅助" valuePropName="checked">
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>创建计划</Button>
            <Button onClick={() => navigate('/plans')}>取消</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
