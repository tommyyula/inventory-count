import type { CountResult, CountSummary, VarianceItem } from '@domain/value-objects';
import { countPlanRepo } from '@db/repositories/CountPlanRepo';
import { varianceRecordRepo } from '@db/repositories/VarianceRecordRepo';
import { ProviderRegistry } from '@providers/ProviderRegistry';
import { varianceAnalysisService } from './VarianceAnalysisService';

class ReportService {
  async generateReport(planId: string): Promise<CountResult> {
    const plan = await countPlanRepo.getById(planId);
    if (!plan) throw new Error('盘点计划不存在');

    const records = await varianceRecordRepo.getByPlanId(planId);
    const summary = varianceAnalysisService.calculateSummary(records, plan.varianceTolerancePercent);

    const variances: VarianceItem[] = records.map(r => ({
      locationId: r.locationId,
      locationCode: r.locationCode,
      productId: r.productId,
      productCode: r.productCode,
      systemQty: r.systemQty,
      countedQty: r.finalCountedQty,
      varianceQty: r.varianceQty,
      variancePercent: r.variancePercent,
      varianceValue: r.varianceValue || 0,
      resolution: r.adjustmentApproved ? 'ADJUSTED' : (r.varianceQty === 0 ? 'ACCEPTED' : 'PENDING'),
    }));

    const uniqueLocations = new Set(records.map(r => r.locationId));
    const uniqueProducts = new Set(records.map(r => r.productId));
    const totalSystemQty = records.reduce((s, r) => s + r.systemQty, 0);
    const totalCountedQty = records.reduce((s, r) => s + r.finalCountedQty, 0);

    const countSummary: CountSummary = {
      totalLocations: uniqueLocations.size,
      totalProducts: uniqueProducts.size,
      totalSystemQty,
      totalCountedQty,
      totalVarianceQty: summary.totalVarianceQty,
      totalVarianceValue: summary.totalVarianceValue,
      matchedItems: summary.matchedItems,
      variantItems: summary.variantItems,
      accuracyRate: summary.accuracyRate,
    };

    const result: CountResult = {
      planId: plan.id,
      planNo: plan.planNo,
      completedAt: new Date().toISOString(),
      warehouseId: plan.warehouseId,
      totalRounds: plan.currentRound,
      accuracyRate: summary.accuracyRate,
      variances,
      summary: countSummary,
    };

    // Publish result via provider
    try {
      const publisher = ProviderRegistry.get('adjustment');
      await publisher.publishResult(result);
    } catch (e) {
      console.warn('发布盘点结果失败:', e);
    }

    return result;
  }

  async exportReportJSON(planId: string): Promise<string> {
    const result = await this.generateReport(planId);
    return JSON.stringify(result, null, 2);
  }
}

export const reportService = new ReportService();
