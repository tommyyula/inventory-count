import type { InventorySnapshot, SnapshotItem } from '@domain/entities/InventorySnapshot';
import { SnapshotStatus } from '@domain/enums';
import { snapshotRepo } from '@db/repositories/SnapshotRepo';
import { ProviderRegistry } from '@providers/ProviderRegistry';
import { generateId } from '@shared/utils/idGenerator';

class SnapshotService {
  async createSnapshot(countPlanId: string, warehouseId: string): Promise<InventorySnapshot> {
    const inventoryProvider = ProviderRegistry.get('inventory');
    const locationProvider = ProviderRegistry.get('location');

    const [inventoryItems, locations] = await Promise.all([
      inventoryProvider.getInventory(warehouseId),
      locationProvider.getLocations(warehouseId),
    ]);

    const snapshotId = generateId();
    const now = new Date().toISOString();

    const snapshotItems: SnapshotItem[] = inventoryItems.map(item => ({
      id: generateId(),
      snapshotId,
      locationId: item.locationId,
      locationCode: item.locationCode,
      productId: item.productId,
      productCode: item.productCode,
      productName: item.productName,
      barcode: item.barcode,
      quantity: item.quantity,
      uom: item.uom,
      unitCost: item.unitCost,
      lotNumber: item.lotNumber,
      expiryDate: item.expiryDate,
    }));

    const uniqueLocations = new Set(inventoryItems.map(i => i.locationId));
    const uniqueProducts = new Set(inventoryItems.map(i => i.productId));
    const totalQuantity = inventoryItems.reduce((sum, i) => sum + i.quantity, 0);

    const snapshot: InventorySnapshot = {
      id: snapshotId,
      countPlanId,
      snapshotTime: now,
      status: SnapshotStatus.READY,
      totalLocations: Math.max(uniqueLocations.size, locations.length),
      totalProducts: uniqueProducts.size,
      totalQuantity,
      createdAt: now,
    };

    await snapshotRepo.create(snapshot);
    await snapshotRepo.addItems(snapshotItems);

    return snapshot;
  }

  async getSnapshot(snapshotId: string): Promise<InventorySnapshot | undefined> {
    return snapshotRepo.getById(snapshotId);
  }

  async getSnapshotByPlanId(countPlanId: string): Promise<InventorySnapshot | undefined> {
    return snapshotRepo.getByPlanId(countPlanId);
  }

  async getSnapshotItems(snapshotId: string): Promise<SnapshotItem[]> {
    return snapshotRepo.getItems(snapshotId);
  }

  async getSnapshotItemsByLocation(snapshotId: string, locationId: string): Promise<SnapshotItem[]> {
    return snapshotRepo.getItemsByLocation(snapshotId, locationId);
  }
}

export const snapshotService = new SnapshotService();
