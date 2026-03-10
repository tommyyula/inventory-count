import type { ProductInfo } from '@domain/value-objects';

export interface IProductProvider {
  getProducts(): Promise<ProductInfo[]>;
  getProductByBarcode(barcode: string): Promise<ProductInfo | null>;
  searchProducts(keyword: string): Promise<ProductInfo[]>;
}
