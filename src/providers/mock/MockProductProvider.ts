import type { IProductProvider } from '../interfaces/IProductProvider';
import type { ProductInfo } from '@domain/value-objects';
import { mockProducts } from './data/products';

export class MockProductProvider implements IProductProvider {
  async getProducts(): Promise<ProductInfo[]> {
    await this.delay();
    return [...mockProducts];
  }

  async getProductByBarcode(barcode: string): Promise<ProductInfo | null> {
    await this.delay(100);
    return mockProducts.find(p => p.barcode === barcode) || null;
  }

  async searchProducts(keyword: string): Promise<ProductInfo[]> {
    await this.delay(150);
    const lower = keyword.toLowerCase();
    return mockProducts.filter(
      p => p.productName.toLowerCase().includes(lower) ||
           p.productCode.toLowerCase().includes(lower) ||
           p.barcode.includes(keyword)
    );
  }

  private delay(ms = 200): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
