import type { ILocationProvider } from '../interfaces/ILocationProvider';
import type { LocationInfo } from '@domain/value-objects';
import { mockLocations } from './data/locations';

export class MockLocationProvider implements ILocationProvider {
  async getLocations(_warehouseId: string): Promise<LocationInfo[]> {
    await this.delay();
    return [...mockLocations];
  }

  private delay(ms = 200): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
