import type { InventoryItem } from '@domain/value-objects';

export interface IInventoryProvider {
  getInventory(warehouseId: string): Promise<InventoryItem[]>;
}
