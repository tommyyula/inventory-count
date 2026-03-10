import type { IInventoryProvider } from '../interfaces/IInventoryProvider';
import type { InventoryItem } from '@domain/value-objects';
import { mockInventory } from './data/inventory';

export class MockInventoryProvider implements IInventoryProvider {
  async getInventory(_warehouseId: string): Promise<InventoryItem[]> {
    await this.delay();
    return [...mockInventory];
  }

  private delay(ms = 300): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
