import type { IInventoryProvider } from './interfaces/IInventoryProvider';
import type { ILocationProvider } from './interfaces/ILocationProvider';
import type { IProductProvider } from './interfaces/IProductProvider';
import type { IAuthProvider } from './interfaces/IAuthProvider';
import type { IAdjustmentPublisher } from './interfaces/IAdjustmentPublisher';
import type { IAIDecisionProvider } from './interfaces/IAIDecisionProvider';
import { MockInventoryProvider } from './mock/MockInventoryProvider';
import { MockLocationProvider } from './mock/MockLocationProvider';
import { MockProductProvider } from './mock/MockProductProvider';
import { MockAuthProvider } from './mock/MockAuthProvider';
import { MockAdjustmentPublisher } from './mock/MockAdjustmentPublisher';

type ProviderMap = {
  inventory: IInventoryProvider;
  location: ILocationProvider;
  product: IProductProvider;
  auth: IAuthProvider;
  adjustment: IAdjustmentPublisher;
  aiDecision: IAIDecisionProvider;
};

class ProviderRegistryClass {
  private providers = new Map<string, unknown>();

  register<K extends keyof ProviderMap>(key: K, provider: ProviderMap[K]): void {
    this.providers.set(key, provider);
  }

  get<K extends keyof ProviderMap>(key: K): ProviderMap[K] {
    const provider = this.providers.get(key);
    if (!provider) {
      throw new Error(`Provider '${key}' not registered`);
    }
    return provider as ProviderMap[K];
  }
}

export const ProviderRegistry = new ProviderRegistryClass();

// Register default mock providers
ProviderRegistry.register('inventory', new MockInventoryProvider());
ProviderRegistry.register('location', new MockLocationProvider());
ProviderRegistry.register('product', new MockProductProvider());
ProviderRegistry.register('auth', new MockAuthProvider());
ProviderRegistry.register('adjustment', new MockAdjustmentPublisher());
