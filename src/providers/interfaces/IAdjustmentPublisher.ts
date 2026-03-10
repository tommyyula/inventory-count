import type { CountResult } from '@domain/value-objects';

export interface IAdjustmentPublisher {
  publishResult(result: CountResult): Promise<void>;
}
