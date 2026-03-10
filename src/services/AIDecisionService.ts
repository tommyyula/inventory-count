import type { AIDecisionContext, VarianceSummary } from '@domain/value-objects';
import type { VarianceRecord } from '@domain/entities';
import type { CountPlan } from '@domain/entities';
import type { IAIDecisionProvider, DecisionInput } from '@providers/interfaces/IAIDecisionProvider';

const HIGH_VALUE_THRESHOLD = 1000;

export class RuleBasedDecisionProvider implements IAIDecisionProvider {
  async analyze(context: DecisionInput): Promise<AIDecisionContext> {
    const { plan, varianceSummary, varianceRecords, currentRound, maxRounds } = context;

    const base = {
      planId: plan.id,
      currentRound,
      varianceSummary,
      highValueVariances: varianceRecords
        .filter(r => Math.abs(r.varianceValue || 0) > HIGH_VALUE_THRESHOLD)
        .map(r => ({
          locationCode: r.locationCode,
          productCode: r.productCode,
          varianceValue: r.varianceValue || 0,
        })),
    };

    // Rule 1: Max rounds reached → force complete
    if (currentRound >= maxRounds) {
      return {
        ...base,
        recommendation: 'COMPLETE',
        confidence: 0.7,
        reasoning: `已达到最大复盘轮次(${maxRounds})，建议完成盘点并人工审核剩余差异项`,
        recountTargets: [],
      };
    }

    // Rule 2: Accuracy ≥ 98% and no high value variance → complete
    const hasHighValueVariance = varianceRecords.some(
      r => Math.abs(r.varianceValue || 0) > HIGH_VALUE_THRESHOLD
    );
    if (varianceSummary.accuracyRate >= 98 && !hasHighValueVariance) {
      return {
        ...base,
        recommendation: 'COMPLETE',
        confidence: 0.95,
        reasoning: `准确率${varianceSummary.accuracyRate.toFixed(1)}%，无高价值差异，建议完成`,
        recountTargets: [],
      };
    }

    // Rule 3: Exceed items > 10% → full recount
    const exceedRatio = varianceSummary.totalItems > 0
      ? varianceSummary.exceedTolerance / varianceSummary.totalItems
      : 0;
    if (exceedRatio > 0.1) {
      return {
        ...base,
        recommendation: 'RECOUNT',
        confidence: 0.85,
        reasoning: `${(exceedRatio * 100).toFixed(1)}%的项目超出容忍度，建议全量复盘`,
        recountTargets: [],
      };
    }

    // Rule 4: Some exceed items ≤ 10% → partial recount
    if (varianceSummary.exceedTolerance > 0) {
      const targets = varianceRecords
        .filter(r => Math.abs(r.variancePercent) > plan.varianceTolerancePercent)
        .map(r => r.locationId);
      const uniqueTargets = [...new Set(targets)];
      return {
        ...base,
        recommendation: 'PARTIAL_RECOUNT',
        confidence: 0.9,
        reasoning: `${varianceSummary.exceedTolerance}项超差，建议对${uniqueTargets.length}个库位复盘`,
        recountTargets: uniqueTargets,
      };
    }

    // Rule 5: All within tolerance → complete
    return {
      ...base,
      recommendation: 'COMPLETE',
      confidence: 0.92,
      reasoning: '所有差异均在容忍度范围内，建议完成盘点',
      recountTargets: [],
    };
  }
}

class AIDecisionService {
  private provider: IAIDecisionProvider = new RuleBasedDecisionProvider();

  setProvider(provider: IAIDecisionProvider): void {
    this.provider = provider;
  }

  async analyze(
    plan: CountPlan,
    varianceSummary: VarianceSummary,
    varianceRecords: VarianceRecord[]
  ): Promise<AIDecisionContext> {
    const input: DecisionInput = {
      plan,
      varianceSummary,
      varianceRecords,
      currentRound: plan.currentRound,
      maxRounds: plan.maxRecountRounds,
    };
    return this.provider.analyze(input);
  }
}

export const aiDecisionService = new AIDecisionService();
