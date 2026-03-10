import type { IAdjustmentPublisher } from '../interfaces/IAdjustmentPublisher';
import type { CountResult } from '@domain/value-objects';

export class MockAdjustmentPublisher implements IAdjustmentPublisher {
  async publishResult(result: CountResult): Promise<void> {
    console.log('[MockAdjustmentPublisher] 发布盘点结果:', result);
    // Store in localStorage for demo purposes
    const key = `count-result-${result.planId}`;
    localStorage.setItem(key, JSON.stringify(result));
  }
}
