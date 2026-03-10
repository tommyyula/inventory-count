import type { InventoryItem } from '@domain/value-objects';
import { mockProducts } from './products';
import { mockLocations } from './locations';

// Generate ~100 inventory records, distributing products across locations
function generateInventory(): InventoryItem[] {
  const items: InventoryItem[] = [];
  const assignments: Array<[number, number[]]> = [
    // [locationIndex, productIndices[]]
    [0, [0, 1, 2, 3, 4]],
    [1, [5, 6, 7]],
    [2, [8, 9, 10, 11]],
    [3, [12, 13, 14]],
    [4, [0, 3, 15, 16, 17, 18]],
    [5, [1, 5, 19, 20]],
    [6, [2, 6, 21, 22]],
    [7, [7, 8, 23, 24]],
    [8, [9, 10, 25, 26, 27]],
    [9, [11, 12, 28, 29]],
    [10, [0, 13, 14, 15]],
    [11, [1, 2, 16, 17, 18]],
    [12, [3, 4, 19, 20, 21]],
    [13, [5, 6, 22, 23]],
    [14, [7, 8, 24, 25, 26]],
    [15, [9, 10, 27, 28, 29]],
    [16, [0, 11, 12, 13]],
    [17, [14, 15, 16, 17]],
    [18, [18, 19, 20, 21, 22]],
    [19, [23, 24, 25, 26, 27, 28]],
  ];

  const quantities = [5, 8, 10, 12, 15, 20, 25, 30, 35, 40, 50, 60, 80, 100, 150, 200, 250, 300, 500];

  for (const [locIdx, prodIndices] of assignments) {
    const loc = mockLocations[locIdx];
    for (const prodIdx of prodIndices) {
      const prod = mockProducts[prodIdx];
      const qty = quantities[(locIdx + prodIdx) % quantities.length];
      items.push({
        locationId: loc.locationId,
        locationCode: loc.locationCode,
        productId: prod.productId,
        productCode: prod.productCode,
        productName: prod.productName,
        barcode: prod.barcode,
        quantity: qty,
        uom: prod.uom,
        unitCost: prod.unitCost,
      });
    }
  }

  return items;
}

export const mockInventory: InventoryItem[] = generateInventory();
