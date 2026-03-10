import type { AIDecisionContext, VarianceSummary } from '@domain/value-objects';
import type { VarianceRecord } from '@domain/entities';
import type { CountPlan } from '@domain/entities';

export interface DecisionInput {
  plan: CountPlan;
  varianceSummary: VarianceSummary;
  varianceRecords: VarianceRecord[];
  currentRound: number;
  maxRounds: number;
}

export interface IAIDecisionProvider {
  analyze(context: DecisionInput): Promise<AIDecisionContext>;
}
