import type { VarianceRecord } from '@domain/entities/VarianceRecord';
import type { VarianceSummary } from '@domain/value-objects';
import { CountDetailStatus, Resolution } from '@domain/enums';
import { countDetailRepo } from '@db/repositories/CountDetailRepo';
import { snapshotRepo } from '@db/repositories/SnapshotRepo';
import { varianceRecordRepo } from '@db/repositories/VarianceRecordRepo';
import { countPlanRepo } from '@db/repositories/CountPlanRepo';
import { generateId } from '@shared/utils/idGenerator';
import { calculateVarianceQty, calculateVariancePercent, calculateVarianceValue, isWithinTolerance } from '@shared/utils/variance';

class VarianceAnalysisService {
  async analyzeVariance(planId: string): Promise<{
    summary: VarianceSummary;
    records: VarianceRecord[];
  }> {
    const plan = await countPlanRepo.getById(planId);
    if (!plan) throw new Error('盘点计划不存在');
    if (!plan.freezeSnapshotId) throw new Error('快照不存在');

    const snapshotItems = await snapshotRepo.getItems(plan.freezeSnapshotId);
    const details = await countDetailRepo.getByPlanAndRound(planId, plan.currentRound);

    // Delete existing variance records for this plan
    await varianceRecordRepo.deleteByPlanId(planId);

    const records: VarianceRecord[] = [];
    const now = new Date().toISOString();

    // Build a map of counted details by location+product
    const countedMap = new Map<string, typeof details[0]>();
    for (const d of details) {
      if (d.status === CountDetailStatus.COUNTED || d.status === CountDetailStatus.FLAGGED) {
        countedMap.set(`${d.locationId}-${d.productId}`, d);
      }
    }

    for (const snapItem of snapshotItems) {
      const key = `${snapItem.locationId}-${snapItem.productId}`;
      const detail = countedMap.get(key);
      const countedQty = detail?.countedQty ?? 0;
      const varianceQty = calculateVarianceQty(snapItem.quantity, countedQty);
      const variancePercent = calculateVariancePercent(snapItem.quantity, countedQty);
      const varianceValue = calculateVarianceValue(varianceQty, snapItem.unitCost || 0);

      const withinTol = isWithinTolerance(variancePercent, plan.varianceTolerancePercent);

      const record: VarianceRecord = {
        id: generateId(),
        countPlanId: planId,
        productId: snapItem.productId,
        productCode: snapItem.productCode,
        locationId: snapItem.locationId,
        locationCode: snapItem.locationCode,
        systemQty: snapItem.quantity,
        finalCountedQty: countedQty,
        varianceQty,
        variancePercent,
        varianceValue,
        resolution: varianceQty === 0 ? Resolution.ACCEPTED : (withinTol ? Resolution.ACCEPTED : Resolution.PENDING),
        adjustmentApproved: false,
        requiresRecount: !withinTol && varianceQty !== 0,
        createdAt: now,
        updatedAt: now,
      };
      records.push(record);
    }

    await varianceRecordRepo.bulkCreate(records);

    const summary = this.calculateSummary(records, plan.varianceTolerancePercent);
    return { summary, records };
  }

  async getVarianceRecords(planId: string): Promise<VarianceRecord[]> {
    return varianceRecordRepo.getByPlanId(planId);
  }

  calculateSummary(records: VarianceRecord[], tolerancePercent: number): VarianceSummary {
    const totalItems = records.length;
    const countedItems = records.length;
    const matchedItems = records.filter(r => r.varianceQty === 0).length;
    const variantItems = totalItems - matchedItems;
    const withinTolerance = records.filter(
      r => r.varianceQty !== 0 && isWithinTolerance(r.variancePercent, tolerancePercent)
    ).length;
    const exceedTolerance = records.filter(
      r => !isWithinTolerance(r.variancePercent, tolerancePercent)
    ).length;
    const totalVarianceQty = records.reduce((s, r) => s + Math.abs(r.varianceQty), 0);
    const totalVarianceValue = records.reduce((s, r) => s + Math.abs(r.varianceValue || 0), 0);
    const accuracyRate = totalItems > 0 ? ((matchedItems + withinTolerance) / totalItems) * 100 : 100;

    return {
      totalItems,
      countedItems,
      matchedItems,
      variantItems,
      withinTolerance,
      exceedTolerance,
      totalVarianceQty,
      totalVarianceValue,
      accuracyRate,
    };
  }
}

export const varianceAnalysisService = new VarianceAnalysisService();
