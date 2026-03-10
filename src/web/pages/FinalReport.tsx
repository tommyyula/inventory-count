import { useState } from 'react';
import { Card, Table, Descriptions, Button, message, Typography, Statistic, Row, Col } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { reportService } from '@services/ReportService';
import type { CountResult } from '@domain/value-objects';
import { formatDateTime, formatPercent, formatCurrency } from '@shared/utils/formatters';

interface Props {
  planId: string;
}

export function FinalReport({ planId }: Props) {
  const [report, setReport] = useState<CountResult | null>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const result = await reportService.generateReport(planId);
      setReport(result);
      message.success('报告生成成功');
    } catch (err) {
      message.error(err instanceof Error ? err.message : '生成失败');
    } finally {
      setLoading(false);
    }
  };

  const exportJSON = async () => {
    try {
      const json = await reportService.exportReportJSON(planId);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `count-report-${planId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (err) {
      message.error(err instanceof Error ? err.message : '导出失败');
    }
  };

  const varianceColumns = [
    { title: '库位', dataIndex: 'locationCode', key: 'locationCode' },
    { title: '产品编码', dataIndex: 'productCode', key: 'productCode' },
    { title: '系统数量', dataIndex: 'systemQty', key: 'systemQty' },
    { title: '盘点数量', dataIndex: 'countedQty', key: 'countedQty' },
    { title: '差异数量', dataIndex: 'varianceQty', key: 'varianceQty' },
    { title: '差异%', dataIndex: 'variancePercent', key: 'variancePercent', render: (v: number) => formatPercent(v) },
    { title: '差异金额', dataIndex: 'varianceValue', key: 'varianceValue', render: (v: number) => formatCurrency(v) },
    { title: '处理方式', dataIndex: 'resolution', key: 'resolution',
      render: (v: string) => v === 'ACCEPTED' ? '接受' : v === 'ADJUSTED' ? '调整' : '待处理' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={5}>最终报告</Typography.Title>
        <div>
          <Button type="primary" onClick={generateReport} loading={loading} style={{ marginRight: 8 }}>
            生成报告
          </Button>
          {report && (
            <Button icon={<DownloadOutlined />} onClick={exportJSON}>
              导出 JSON
            </Button>
          )}
        </div>
      </div>

      {report && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Descriptions bordered size="small" column={3}>
              <Descriptions.Item label="计划编号">{report.planNo}</Descriptions.Item>
              <Descriptions.Item label="完成时间">{formatDateTime(report.completedAt)}</Descriptions.Item>
              <Descriptions.Item label="盘点轮次">{report.totalRounds}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={4}><Card size="small"><Statistic title="准确率" value={report.summary.accuracyRate} precision={1} suffix="%" /></Card></Col>
            <Col span={4}><Card size="small"><Statistic title="库位数" value={report.summary.totalLocations} /></Card></Col>
            <Col span={4}><Card size="small"><Statistic title="产品数" value={report.summary.totalProducts} /></Card></Col>
            <Col span={4}><Card size="small"><Statistic title="无差异" value={report.summary.matchedItems} /></Card></Col>
            <Col span={4}><Card size="small"><Statistic title="有差异" value={report.summary.variantItems} /></Card></Col>
            <Col span={4}><Card size="small"><Statistic title="差异金额" value={report.summary.totalVarianceValue} prefix="¥" precision={2} /></Card></Col>
          </Row>

          <Card title="差异明细">
            <Table
              columns={varianceColumns}
              dataSource={report.variances}
              rowKey={(r) => `${r.locationId}-${r.productId}`}
              pagination={{ pageSize: 20 }}
              size="small"
              scroll={{ x: 800 }}
            />
          </Card>
        </>
      )}
    </div>
  );
}
