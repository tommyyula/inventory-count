import type { LocationInfo } from '@domain/value-objects';

export interface ILocationProvider {
  getLocations(warehouseId: string): Promise<LocationInfo[]>;
}
