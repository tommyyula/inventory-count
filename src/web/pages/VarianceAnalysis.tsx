import { useEffect, useState } from 'react';
import { Table, Card, Row, Col, Statistic, Button, Tag, message, Typography, Spin } from 'antd';
import { varianceAnalysisService } from '@services/VarianceAnalysisService';
import { aiDecisionService } from '@services/AIDecisionService';
import { countPlanRepo } from '@db/repositories/CountPlanRepo';
import type { VarianceRecord } from '@domain/entities/VarianceRecord';
import type { VarianceSummary, AIDecisionContext } from '@domain/value-objects';
import { formatPercent, formatCurrency } from '@shared/utils/formatters';
import { getVarianceLevel, getVarianceColor } from '@shared/utils/variance';

interface Props {
  planId: string;
}

export function VarianceAnalysis({ planId }: Props) {
  const [summary, setSummary] = useState<VarianceSummary | null>(null);
  const [records, setRecords] = useState<VarianceRecord[]>([]);
  const [aiDecision, setAiDecision] = useState<AIDecisionContext | null>(null);
  const [loading, setLoading] = useState(false);

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      const plan = await countPlanRepo.getById(planId);
      if (!plan) return;

      const result = await varianceAnalysisService.analyzeVariance(planId);
      setSummary(result.summary);
      setRecords(result.records);

      // Run AI decision
      if (plan.aiDecisionEnabled) {
        const decision = await aiDecisionService.analyze(plan, result.summary, result.records);
        setAiDecision(decision);
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : '分析失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Try to load existing records first
    varianceAnalysisService.getVarianceRecords(planId).then(existing => {
      if (existing.length > 0) {
        setRecords(existing);
        countPlanRepo.getById(planId).then(plan => {
          if (plan) {
            const s = varianceAnalysisService.calculateSummary(existing, plan.varianceTolerancePercent);
            setSummary(s);
            if (plan.aiDecisionEnabled) {
              aiDecisionService.analyze(plan, s, existing).then(setAiDecision);
            }
          }
        });
      }
    });
  }, [planId]);

  const columns = [
    { title: '库位', dataIndex: 'locationCode', key: 'locationCode', width: 120 },
    { title: '产品编码', dataIndex: 'productCode', key: 'productCode', width: 120 },
    { title: '系统数量', dataIndex: 'systemQty', key: 'systemQty', width: 100 },
    { title: '盘点数量', dataIndex: 'finalCountedQty', key: 'finalCountedQty', width: 100 },
    { title: '差异数量', dataIndex: 'varianceQty', key: 'varianceQty', width: 100,
      render: (v: number) => <span style={{ color: v === 0 ? '#52c41a' : (Math.abs(v) > 0 ? '#ff4d4f' : '#000') }}>{v}</span> },
    { title: '差异%', dataIndex: 'variancePercent', key: 'variancePercent', width: 100,
      render: (v: number, r: VarianceRecord) => {
        const level = getVarianceLevel(v, 5); // Use default 5%
        return <Tag color={getVarianceColor(level)}>{formatPercent(v)}</Tag>;
      },
    },
    { title: '差异金额', dataIndex: 'varianceValue', key: 'varianceValue', width: 120,
      render: (v: number) => v ? formatCurrency(v) : '-' },
    { title: '状态', dataIndex: 'resolution', key: 'resolution',
      render: (v: string) => {
        const map: Record<string, { color: string; label: string }> = {
          ACCEPTED: { color: 'green', label: '已接受' },
          PENDING: { color: 'orange', label: '待处理' },
          RECOUNT: { color: 'blue', label: '需复盘' },
          ADJUSTED: { color: 'cyan', label: '已调整' },
        };
        const config = map[v] || { color: 'default', label: v };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={5}>差异分析</Typography.Title>
        <Button type="primary" onClick={loadAnalysis} loading={loading}>
          {records.length > 0 ? '重新分析' : '执行分析'}
        </Button>
      </div>

      {summary && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={4}><Card size="small"><Statistic title="准确率" value={summary.accuracyRate} precision={1} suffix="%" valueStyle={{ color: summary.accuracyRate >= 98 ? '#52c41a' : '#faad14' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="总项目" value={summary.totalItems} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="无差异" value={summary.matchedItems} valueStyle={{ color: '#52c41a' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="容忍度内" value={summary.withinTolerance} valueStyle={{ color: '#faad14' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="超差" value={summary.exceedTolerance} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="差异金额" value={summary.totalVarianceValue} precision={2} prefix="¥" /></Card></Col>
        </Row>
      )}

      {aiDecision && (
        <Card size="small" style={{ marginBottom: 16, borderColor: aiDecision.recommendation === 'COMPLETE' ? '#52c41a' : '#faad14' }}>
          <Typography.Title level={5}>🤖 AI 决策建议</Typography.Title>
          <p>
            <strong>推荐动作：</strong>
            <Tag color={aiDecision.recommendation === 'COMPLETE' ? 'green' : 'orange'}>
              {aiDecision.recommendation === 'COMPLETE' ? '完成盘点' : aiDecision.recommendation === 'RECOUNT' ? '全量复盘' : '部分复盘'}
            </Tag>
          </p>
          <p><strong>置信度：</strong>{formatPercent(aiDecision.confidence * 100)}</p>
          <p><strong>决策理由：</strong>{aiDecision.reasoning}</p>
          {aiDecision.recountTargets.length > 0 && (
            <p><strong>建议复盘库位：</strong>{aiDecision.recountTargets.join(', ')}</p>
          )}
        </Card>
      )}

      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
        size="small"
        scroll={{ x: 900 }}
      />
    </div>
  );
}
